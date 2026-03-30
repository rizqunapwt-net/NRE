<?php

namespace Tests\Feature\Integration;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use App\Models\Faq;
use App\Models\Testimonial;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ComprehensiveWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    /**
     * Workflow: Admin creates book -> verify not public -> publish -> verify in search
     */
    public function test_book_lifecycle_workflow(): void
    {
        // 1. Setup Admin & Author
        /** @var User $admin */
        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        $author = Author::factory()->create();
        $category = Category::factory()->create(['name' => 'Integration', 'slug' => 'integration']);

        // 2. Admin creates a draft book
        $bookData = [
            'title' => 'Integrated Book Workflow',
            'author_id' => $author->id,
            'category_id' => $category->id,
            'status' => 'draft',
            'price' => 50000,
            'is_published' => false,
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/books', $bookData);

        $response->assertStatus(201);
        $bookId = $response->json('data.id');

        // 3. Verify it does NOT appear in public catalog
        Cache::flush();
        $catalogResponse = $this->getJson('/api/v1/public/catalog?search=Integrated');
        $catalogResponse->assertStatus(200);
        $this->assertCount(0, $catalogResponse->json('data'));

        // 4. Admin publishes the book
        $this->actingAs($admin)
            ->patchJson('/api/v1/books/' . $bookId, [
                'status' => 'published',
                'is_published' => true,
            ])->assertStatus(200);

        // 5. Verify it NOW appears in public catalog
        Cache::flush();
        $catalogResponse = $this->getJson('/api/v1/public/catalog?search=Integrated');
        $catalogResponse->assertStatus(200);
        $this->assertCount(1, $catalogResponse->json('data'));
        $this->assertEquals('Integrated Book Workflow', $catalogResponse->json('data.0.title'));
    }

    public function test_user_registration_and_access_workflow(): void
    {
        // 1. Guest registers
        $regData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '08123456789',
        ];

        $response = $this->postJson('/api/v1/auth/register', $regData);
        $response->assertStatus(201);

        // 2. User attempts to login
        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'login' => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $loginResponse->assertStatus(200);
        $token = $loginResponse->json('data.access_token');

        // 3. User accesses restricted profile
        $profileResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/v1/auth/me');

        $profileResponse->assertStatus(200)
            ->assertJsonPath('data.user.email', 'newuser@example.com');
    }

    /**
     * Workflow: Admin updates site content -> verify public reflection
     */
    public function test_admin_content_update_workflow(): void
    {
        // 1. Setup Admin
        /** @var User $admin */
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        // 2. Admin adds an FAQ
        $this->actingAs($admin)
            ->postJson('/api/v1/website/faqs', [
                'question' => 'What is integration testing?',
                'answer' => 'Testing how modules work together.',
                'order' => 1,
                'is_active' => true,
            ]);

        // 3. Verify public FAQ API reflects changes
        $faqResponse = $this->getJson('/api/v1/public/faqs');
        $faqResponse->assertStatus(200);
        
        $found = false;
        foreach ($faqResponse->json('data') as $faq) {
            if ($faq['question'] === 'What is integration testing?') {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'FAQ not found in public list');
    }

    /**
     * Workflow: Admin creates book -> uploads files -> publishes -> user search & read
     */
    public function test_full_book_upload_and_access_workflow(): void
    {
        Storage::fake('books');
        Storage::fake('public');

        // 1. Setup Admin, Author & Category
        /** @var User $admin */
        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        $author = Author::factory()->create();
        $category = Category::factory()->create(['name' => 'Full Workflow', 'slug' => 'full-workflow']);

        // 2. Admin creates book
        $response = $this->actingAs($admin)->postJson('/api/v1/books', [
            'title' => 'Full Workflow Book',
            'author_id' => $author->id,
            'category_id' => $category->id,
            'status' => 'draft',
            'is_digital' => true,
        ]);
        $response->assertStatus(201);
        $bookId = $response->json('data.id');
        $book = Book::find($bookId);

        // 3. Admin uploads cover
        $coverFile = UploadedFile::fake()->image('cover.jpg');
        $this->actingAs($admin)->postJson("/api/v1/admin/books/{$bookId}/upload-cover", [
            'cover' => $coverFile,
        ])->assertStatus(200);

        // 4. Admin uploads PDF
        $pdfPath = public_path('docs/api-reference.pdf');
        if (file_exists($pdfPath)) {
            $pdfFile = new UploadedFile($pdfPath, 'api-reference.pdf', 'application/pdf', null, true);
        } else {
            $pdfFile = UploadedFile::fake()->create('book.pdf', 100, 'application/pdf');
        }
        
        $uploadPdfResponse = $this->actingAs($admin)->postJson("/api/v1/admin/books/{$bookId}/upload-pdf", [
            'pdf' => $pdfFile,
        ]);
        
        if ($uploadPdfResponse->status() !== 200) {
            fwrite(STDERR, print_r($uploadPdfResponse->json(), true));
        }
        
        $uploadPdfResponse->assertStatus(200);

        // 5. Admin publishes
        $this->actingAs($admin)->patchJson("/api/v1/books/{$bookId}", [
            'status' => 'published',
            'is_published' => true,
        ])->assertStatus(200);

        // 6. User searches and views detail
        Cache::flush();
        $catalogResponse = $this->getJson('/api/v1/public/catalog?search=Full+Workflow');
        $catalogResponse->assertStatus(200);
        $this->assertCount(1, $catalogResponse->json('data'));

        // 7. User with access reads PDF (Mocking access)
        /** @var User $user */
        $user = User::factory()->create();
        // Grant access manually or via purchase flow
        $book->load('author');
        \App\Models\BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'admin_manual',
            'granted_at' => now(),
        ]);

        $readResponse = $this->actingAs($user)->get("/api/v1/books/{$bookId}/read");
        $readResponse->assertStatus(200);
        $this->assertEquals('application/pdf', $readResponse->headers->get('Content-Type'));
    }
}

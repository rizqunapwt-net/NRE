<?php

namespace Tests\Feature;

use App\Jobs\GeneratePreviewPdf;
use App\Models\Book;
use App\Models\BookPreview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BookStorageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('books');
    }

    public function test_cover_upload_stores_file_and_queues_thumbnails(): void
    {
        Queue::fake();

        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $book = Book::factory()->create();
        $file = UploadedFile::fake()->image('cover.jpg', 800, 1200)->size(2048);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/books/{$book->id}/upload-cover", [
                'cover' => $file,
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        Storage::disk('books')->assertExists("covers/original/{$book->id}_" . now()->timestamp . '.jpg');
    }

    public function test_preview_endpoint_returns_404_when_no_preview(): void
    {
        $book = Book::factory()->create(['pdf_preview_path' => null]);

        $response = $this->getJson("/api/v1/public/books/{$book->id}/preview");

        $response->assertStatus(404);
        $response->assertJsonPath('success', false);
    }

    public function test_preview_endpoint_caps_preview_pages_to_ten(): void
    {
        config(['books.preview_pages' => 10]);

        $book = Book::factory()->create([
            'pdf_preview_path' => 'pdfs/preview/test_preview.pdf',
            'page_count' => 120,
        ]);
        BookPreview::create([
            'book_id' => $book->id,
            'preview_pdf_path' => 'pdfs/preview/test_preview.pdf',
            'preview_pages' => 50,
            'allow_preview' => true,
        ]);

        Storage::disk('books')->put('pdfs/preview/test_preview.pdf', 'dummy-pdf-content');

        $response = $this->getJson("/api/v1/public/books/{$book->id}/preview");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.preview_pages', 10);
    }

    public function test_preview_endpoint_returns_404_when_preview_path_exists_but_file_is_missing(): void
    {
        $book = Book::factory()->create([
            'pdf_preview_path' => 'pdfs/preview/missing-preview.pdf',
        ]);
        BookPreview::create([
            'book_id' => $book->id,
            'preview_pdf_path' => 'pdfs/preview/missing-preview.pdf',
            'preview_pages' => 5,
            'allow_preview' => true,
        ]);

        $response = $this->getJson("/api/v1/public/books/{$book->id}/preview");

        $response->assertStatus(404);
        $response->assertJsonPath('success', false);
    }

    public function test_preview_endpoint_queues_regeneration_when_preview_is_missing_but_full_pdf_exists(): void
    {
        Queue::fake();
        config(['queue.default' => 'database']);

        $book = Book::factory()->create([
            'pdf_full_path' => 'pdfs/full/source.pdf',
            'pdf_preview_path' => 'pdfs/preview/missing-preview.pdf',
        ]);
        BookPreview::create([
            'book_id' => $book->id,
            'preview_pdf_path' => 'pdfs/preview/missing-preview.pdf',
            'preview_pages' => 7,
            'allow_preview' => true,
        ]);

        Storage::disk('books')->put('pdfs/full/source.pdf', 'dummy source pdf');

        $response = $this->getJson("/api/v1/public/books/{$book->id}/preview");

        $response->assertStatus(202);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.status', 'processing');
        Queue::assertPushed(GeneratePreviewPdf::class);
    }

    public function test_cover_endpoint_returns_404_when_no_cover(): void
    {
        $book = Book::factory()->create(['cover_path' => null]);

        $response = $this->getJson("/api/v1/public/books/{$book->id}/cover");

        $response->assertStatus(404);
    }

    public function test_cover_endpoint_uses_external_fallback_when_local_cover_is_missing(): void
    {
        $book = Book::factory()->create([
            'cover_path' => 'covers/missing-cover.jpg',
            'google_drive_cover_url' => 'https://example.com/cover.jpg',
        ]);

        $response = $this->getJson("/api/v1/public/books/{$book->id}/cover");

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.url', 'https://example.com/cover.jpg');
    }

    public function test_read_endpoint_requires_authentication(): void
    {
        $book = Book::factory()->create();

        $response = $this->getJson("/api/v1/books/{$book->id}/read");

        $response->assertStatus(401);
    }

    public function test_read_endpoint_returns_403_without_access(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['pdf_full_path' => 'pdfs/full/1_test.pdf']);

        $response = $this->actingAs($user)
            ->getJson("/api/v1/books/{$book->id}/read");

        $response->assertStatus(403);
        $response->assertJsonPath('success', false);
    }

    public function test_pdf_upload_requires_admin(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create();
        $file = UploadedFile::fake()->create('book.pdf', 1024, 'application/pdf');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/admin/books/{$book->id}/upload-pdf", [
                'pdf' => $file,
            ]);

        $response->assertStatus(403);
    }
}

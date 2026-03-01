<?php

namespace Tests\Feature\Api\V1;

use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BookScholarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Ensure roles exist in the in-memory database
        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
    }

    #[Test]
    public function it_can_fetch_all_citation_formats()
    {
        $author = Author::create(['name' => 'Warto, Dr.']);
        $book = Book::create([
            'title' => 'Sinyal dari Desa',
            'author_id' => $author->id,
            'publisher' => 'Penerbit Rizquna Elfath',
            'publisher_city' => 'Cirebon',
            'published_year' => 2026,
            'status' => 'published',
            'is_published' => true,
        ]);

        $response = $this->getJson("/api/v1/books/{$book->id}/cite/all");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'book_id' => $book->id,
                ]
            ])
            ->assertJsonStructure([
                'data' => [
                    'formats' => [
                        'apa', 'mla', 'chicago', 'ieee', 'bibtex', 'ris', 'turabian'
                    ]
                ]
            ]);

        $data = $response->json('data.formats');
        $this->assertStringContainsString('Warto, D. (2026)', $data['apa']);
        $this->assertStringContainsString('Cirebon: Penerbit Rizquna Elfath', $data['chicago']);
    }

    #[Test]
    public function it_can_download_ris_citation()
    {
        $author = Author::create(['name' => 'Dr. Warto']);
        $book = Book::create([
            'title' => 'Sinyal dari Desa',
            'slug' => 'sinyal-dari-desa',
            'author_id' => $author->id,
            'publisher' => 'Penerbit Rizquna Elfath',
            'published_year' => 2026,
            'status' => 'published',
            'is_published' => true,
        ]);

        $response = $this->get("/api/v1/books/{$book->id}/cite/download?type=ris");

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/x-research-info-systems')
            ->assertHeader('Content-Disposition', 'attachment; filename="sinyal-dari-desa-citation.ris"');
        
        $this->assertStringContainsString('TY  - BOOK', $response->getContent());
        $this->assertStringContainsString('TI  - Sinyal dari Desa', $response->getContent());
        $this->assertStringContainsString('AU  - Dr. Warto', $response->getContent());
    }

    #[Test]
    public function it_can_update_book_metadata_as_admin()
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        
        $author = Author::create(['name' => 'Original Author']);
        $book = Book::create([
            'title' => 'Original Title',
            'author_id' => $author->id,
            'status' => 'draft',
        ]);

        $newData = [
            'title' => 'Updated Title',
            'publisher' => 'New Publisher',
            'publisher_city' => 'New City',
            'published_year' => 2027,
            'cover_path' => 'books/7/cover_updated.png',
            'pdf_full_path' => 'books/7/pdf_updated.pdf',
        ];

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/books/{$book->id}", $newData);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $book->refresh();
        $this->assertEquals('Updated Title', $book->title);
        $this->assertEquals('New Publisher', $book->publisher);
        $this->assertEquals('New City', $book->publisher_city);
        $this->assertEquals(2027, $book->published_year);
        $this->assertEquals('books/7/cover_updated.png', $book->cover_path);
        $this->assertEquals('books/7/pdf_updated.pdf', $book->pdf_full_path);
    }
}

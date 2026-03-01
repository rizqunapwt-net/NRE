<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScholarEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function createPublishedBook(array $overrides = []): Book
    {
        $author = Author::factory()->create(['name' => 'Dr. Warto']);

        return Book::factory()->create(array_merge([
            'title' => 'Sinyal dari Desa',
            'author_id' => $author->id,
            'published_year' => 2026,
            'isbn' => '978-634-7576-13-2',
            'is_published' => true,
            'is_digital' => true,
            'slug' => 'sinyal-dari-desa',
        ], $overrides));
    }

    public function test_cite_by_id_returns_citation(): void
    {
        $book = $this->createPublishedBook();

        $response = $this->getJson("/api/v1/books/{$book->id}/cite?format=apa");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.format', 'apa');

        $this->assertNotEmpty($response->json('data.citation'));
    }

    public function test_cite_all_returns_all_formats(): void
    {
        $book = $this->createPublishedBook();

        $response = $this->getJson("/api/v1/books/{$book->id}/cite/all");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.book_id', $book->id);

        $formats = $response->json('data.formats');
        $this->assertArrayHasKey('apa', $formats);
        $this->assertArrayHasKey('mla', $formats);
        $this->assertArrayHasKey('chicago', $formats);
        $this->assertArrayHasKey('ieee', $formats);
        $this->assertArrayHasKey('bibtex', $formats);
        $this->assertArrayHasKey('ris', $formats);
    }

    public function test_cite_download_ris(): void
    {
        $book = $this->createPublishedBook();

        $response = $this->get("/api/v1/books/{$book->id}/cite/download?type=ris");

        $response->assertOk();
        $this->assertStringContainsString('application/x-research-info-systems', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('TY  - BOOK', $response->getContent());
    }

    public function test_cite_download_bib(): void
    {
        $book = $this->createPublishedBook();

        $response = $this->get("/api/v1/books/{$book->id}/cite/download?type=bib");

        $response->assertOk();
        $this->assertStringContainsString('@book{', $response->getContent());
    }

    public function test_cite_unpublished_book_returns_404(): void
    {
        $book = Book::factory()->create(['is_published' => false]);

        $this->getJson("/api/v1/books/{$book->id}/cite/all")
            ->assertNotFound();
    }

    public function test_cite_nonexistent_book_returns_404(): void
    {
        $this->getJson('/api/v1/books/99999/cite/all')
            ->assertNotFound();
    }

    public function test_search_endpoint(): void
    {
        $this->createPublishedBook(['title' => 'Belajar Laravel Framework']);
        $this->createPublishedBook([
            'title' => 'Belajar PHP',
            'slug' => 'belajar-php',
            'isbn' => '978-111-2222-33-4',
        ]);

        $response = $this->getJson('/api/v1/search?q=laravel');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_search_requires_digital_published(): void
    {
        $this->createPublishedBook([
            'title' => 'Non Digital Book',
            'is_digital' => false,
            'slug' => 'non-digital',
        ]);

        $response = $this->getJson('/api/v1/search');

        $response->assertOk();
        // Non-digital books should not appear in scholar search
        $data = $response->json('data.data');
        foreach ($data as $book) {
            $this->assertNotEquals('Non Digital Book', $book['title']);
        }
    }

    public function test_per_page_limit_capped_at_100(): void
    {
        Book::factory()->count(5)->create(['is_published' => true]);

        $response = $this->getJson('/api/v1/public/repository?per_page=500');

        $response->assertOk();
        $this->assertLessThanOrEqual(100, $response->json('data.per_page'));
    }
}

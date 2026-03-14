<?php

namespace Tests\Feature\Api;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_fetch_public_catalog_with_pagination()
    {
        Book::factory()->count(15)->create(['status' => 'published', 'is_published' => true]);

        $response = $this->getJson('/api/v1/public/catalog?per_page=10');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'meta' => ['current_page', 'last_page', 'total']
                 ]);
        
        $this->assertCount(10, $response->json('data'));
    }

    /** @test */
    public function it_can_filter_books_by_category()
    {
        $cat1 = Category::factory()->create(['name' => 'Pendidikan', 'slug' => 'pendidikan']);
        $cat2 = Category::factory()->create(['name' => 'Islam', 'slug' => 'islam']);

        Book::factory()->count(3)->create(['category_id' => $cat1->id, 'status' => 'published', 'is_published' => true]);
        Book::factory()->count(2)->create(['category_id' => $cat2->id, 'status' => 'published', 'is_published' => true]);

        $response = $this->getJson('/api/v1/public/catalog?category=pendidikan');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    /** @test */
    public function it_can_search_books_by_title()
    {
        Book::factory()->create(['title' => 'Belajar Laravel Dasar', 'status' => 'published', 'is_published' => true]);
        Book::factory()->create(['title' => 'Pemrograman PHP Modern', 'status' => 'published', 'is_published' => true]);

        $response = $this->getJson('/api/v1/public/catalog?search=Laravel');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Belajar Laravel Dasar', $response->json('data.0.title'));
    }

    /** @test */
    public function it_can_fetch_book_detail_by_slug()
    {
        $book = Book::factory()->create(['title' => 'Buku Test', 'slug' => 'buku-test', 'status' => 'published', 'is_published' => true]);

        $response = $this->getJson('/api/v1/public/catalog/buku-test');

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'Buku Test');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed categories and books for testing
        $this->artisan('db:seed', ['--class' => 'CategorySeeder']);
        $this->artisan('db:seed', ['--class' => 'AuthorSeeder']);
        $this->artisan('db:seed', ['--class' => 'BookSeeder']);
    }

    public function test_catalog_returns_paginated_books(): void
    {
        $response = $this->getJson('/api/v1/public/catalog');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ]);
    }

    public function test_catalog_filters_by_category_slug(): void
    {
        $category = Category::first();

        $response = $this->getJson('/api/v1/public/catalog?category=' . $category->slug);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'meta' => ['current_page' => 1],
            ]);
    }

    public function test_catalog_search_by_title(): void
    {
        $book = Book::first();

        $response = $this->getJson('/api/v1/public/catalog?search=' . substr($book->title, 0, 5));

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data'));
    }

    public function test_book_detail_by_slug_works(): void
    {
        $book = Book::where('status', 'published')->first();

        $response = $this->getJson('/api/v1/public/catalog/' . $book->slug);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id', 'title', 'slug', 'author', 'price', 'cover_url',
                    'status', 'published_year', 'description',
                ],
            ]);
    }

    public function test_book_detail_by_id_works(): void
    {
        $book = Book::where('status', 'published')->first();

        $response = $this->getJson('/api/v1/public/catalog/' . $book->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'title', 'slug'],
            ]);
        
        $this->assertEquals($book->id, $response->json('data.id'));
    }

    public function test_book_with_zero_price_returns_zero_not_null(): void
    {
        $book = Book::where('price', 0)->where('status', 'published')->first();

        if (!$book) {
            // Create a free book if none exists
            $book = Book::factory()->published()->free()->create();
        }

        $response = $this->getJson('/api/v1/public/catalog/' . $book->slug);

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('data.price'));
    }

    public function test_categories_endpoint_returns_list(): void
    {
        $response = $this->getJson('/api/v1/public/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'slug', 'icon', 'books_count'],
                ],
            ]);
    }

    public function test_nonexistent_slug_returns_404(): void
    {
        $response = $this->getJson('/api/v1/public/catalog/nonexistent-slug-xyz123');

        $response->assertStatus(404);
    }
}

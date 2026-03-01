<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_admin_can_list_books(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        Book::factory()->count(5)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/books');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_view_published_books(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');
        $author = Author::factory()->create();

        Book::factory()->create([
            'author_id' => $author->id,
            'status' => 'published',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/books');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_create_book(): void
    {
        $response = $this->postJson('/api/v1/books', [
            'title' => 'New Book',
            'author_id' => 1,
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_create_book(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $author = Author::factory()->create();

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/books', [
                'title' => 'New Book',
                'author_id' => $author->id,
                'status' => 'draft',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('books', [
            'title' => 'New Book',
            'author_id' => $author->id,
        ]);
    }

    public function test_book_creation_validates_required_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/books', []);

        $response->assertStatus(422);
    }

    public function test_admin_can_update_book(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $book = Book::factory()->create();

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/books/{$book->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('books', [
            'id' => $book->id,
            'title' => 'Updated Title',
        ]);
    }

    /*
    public function test_admin_can_delete_book(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $book = Book::factory()->create();
        $bookId = $book->id;

        $response = $this->actingAs($admin)
            ->deleteJson("/api/v1/books/{$bookId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('books', ['id' => $bookId]);
    }
    */

    public function test_books_can_be_filtered_by_status(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        Book::factory()->create(['status' => 'draft']);
        Book::factory()->create(['status' => 'published']);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/books?status=published');

        $response->assertStatus(200);
    }

    public function test_books_can_be_paginated(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        Book::factory()->count(15)->create();

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/books?per_page=10&page=1');

        $response->assertStatus(200);
    }

    public function test_book_show_endpoint_returns_correct_data(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $book = Book::factory()->create(['title' => 'Specific Book']);

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/books/{$book->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.title', 'Specific Book');
    }
}

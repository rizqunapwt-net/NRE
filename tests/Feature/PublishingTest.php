<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublishingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_author(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create();

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->postJson('/api/v1/authors', [
                'name' => 'Penulis Baru',
                'email' => 'penulis@test.com',
                'phone' => '081234567890',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('authors', ['email' => 'penulis@test.com']);
    }

    public function test_admin_can_create_book(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create();
        $author = Author::factory()->create();

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->postJson('/api/v1/books', [
                'title' => 'Buku Test',
                'author_id' => $author->id,
                'type' => 'publishing',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('books', ['title' => 'Buku Test']);
    }

    public function test_admin_can_update_book_status(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create();
        $author = Author::factory()->create();
        $book = Book::factory()->create([
            'author_id' => $author->id,
            'type' => 'publishing',
            'status' => 'manuscript',
        ]);

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->patchJson("/api/v1/books/{$book->id}/status", [
                'status' => 'editing',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_isbn_tracking_returns_only_publishing_books(): void
    {
        $this->seed(RolePermissionSeeder::class);

        $admin = User::factory()->create();
        $author = Author::factory()->create();

        Book::factory()->create(['author_id' => $author->id, 'type' => 'publishing', 'status' => 'production']);
        Book::factory()->create(['author_id' => $author->id, 'type' => 'printing']);

        $response = $this->actingAsWithRole($admin, 'Admin')
            ->getJson('/api/v1/books/isbn-tracking');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }
}

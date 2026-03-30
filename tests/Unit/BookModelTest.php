<?php

namespace Tests\Unit;

use App\Enums\BookStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_can_be_created_with_valid_data(): void
    {
        $author = Author::factory()->create();

        $book = Book::factory()->create([
            'author_id' => $author->id,
            'title' => 'Test Book',
            'status' => BookStatus::DRAFT,
        ]);

        $this->assertDatabaseHas('books', [
            'id' => $book->id,
            'author_id' => $author->id,
            'title' => 'Test Book',
        ]);
    }

    public function test_book_belongs_to_author(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create(['author_id' => $author->id]);

        $this->assertTrue($book->author()->exists());
        $this->assertEquals($author->id, $book->author->id);
    }

    public function test_book_can_be_published(): void
    {
        $book = Book::factory()->create(['status' => BookStatus::DRAFT]);

        $book->update(['status' => BookStatus::PUBLISHED]);

        $this->assertEquals(BookStatus::PUBLISHED, $book->status);
    }

    public function test_book_can_be_archived(): void
    {
        $book = Book::factory()->create(['status' => BookStatus::PUBLISHED]);

        $book->update(['status' => BookStatus::ARCHIVED]);

        $this->assertEquals(BookStatus::ARCHIVED, $book->status);
    }

    public function test_book_has_valid_isbn(): void
    {
        $book = Book::factory()->create([
            'isbn' => '978-3-16-148410-0',
        ]);

        $this->assertNotEmpty($book->isbn);
        $this->assertIsString($book->isbn);
    }

    public function test_multiple_books_can_belong_to_same_author(): void
    {
        $author = Author::factory()->create();

        Book::factory()->count(5)->create(['author_id' => $author->id]);

        $this->assertCount(5, $author->books);
    }

    public function test_book_has_timestamps(): void
    {
        $book = Book::factory()->create();

        $this->assertNotNull($book->created_at);
        $this->assertNotNull($book->updated_at);
    }

    public function test_book_can_be_deleted(): void
    {
        $book = Book::factory()->create();
        $bookId = $book->id;

        $book->delete();

        $this->assertSoftDeleted('books', ['id' => $bookId]);
    }

    public function test_book_has_required_fields(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create(['author_id' => $author->id]);

        $this->assertNotNull($book->title);
        $this->assertNotNull($book->author_id);
        $this->assertNotNull($book->status);
    }

    public function test_book_description_can_be_updated(): void
    {
        $book = Book::factory()->create();
        $newDescription = 'Updated description';

        $book->update(['description' => $newDescription]);

        $this->assertEquals($newDescription, $book->description);
    }
}

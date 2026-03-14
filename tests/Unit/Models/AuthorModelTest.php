<?php

namespace Tests\Unit\Models;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorModelTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function an_author_can_be_created_with_valid_data()
    {
        $author = Author::create([
            'name' => 'Dr. Ahmad Dahlan',
            'email' => 'dahlan@example.com',
            'phone' => '08123456789',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('authors', [
            'name' => 'Dr. Ahmad Dahlan',
            'email' => 'dahlan@example.com',
        ]);
    }

    /** @test */
    public function an_author_has_many_books()
    {
        $author = Author::factory()->create();
        Book::factory()->count(3)->create(['author_id' => $author->id]);

        $this->assertCount(3, $author->books);
        $this->assertInstanceOf(Book::class, $author->books->first());
    }

    /** @test */
    public function it_can_filter_active_authors()
    {
        Author::factory()->create(['status' => 'active']);
        Author::factory()->create(['status' => 'inactive']);

        $activeAuthors = Author::where('status', 'active')->get();
        
        $this->assertCount(1, $activeAuthors);
        $this->assertEquals('active', $activeAuthors->first()->status);
    }
}

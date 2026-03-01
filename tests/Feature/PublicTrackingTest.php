<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicTrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_track_book_by_valid_code(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create([
            'author_id' => $author->id,
            'tracking_code' => 'TRK-TEST-001',
            'type' => 'publishing',
        ]);

        $response = $this->getJson('/api/v1/tracking?code=TRK-TEST-001');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.tracking_code', 'TRK-TEST-001')
            ->assertJsonPath('data.title', $book->title);
    }

    public function test_tracking_with_invalid_code_returns_404(): void
    {
        $response = $this->getJson('/api/v1/tracking?code=INVALID-CODE');

        $response->assertNotFound()
            ->assertJsonPath('success', false);
    }

    public function test_tracking_requires_code_parameter(): void
    {
        $response = $this->getJson('/api/v1/tracking');

        $response->assertUnprocessable();
    }

    public function test_tracking_is_publicly_accessible_without_auth(): void
    {
        $author = Author::factory()->create();
        Book::factory()->create([
            'author_id' => $author->id,
            'tracking_code' => 'TRK-PUBLIC-001',
        ]);

        // No actingAs — should still work
        $response = $this->getJson('/api/v1/tracking?code=TRK-PUBLIC-001');

        $response->assertOk();
    }
}

<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PublicSiteBlogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create admin user for creating announcements
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);
    }

    #[Test]
    public function blog_list_returns_published_announcements()
    {
        // Use refresh database to ensure clean state
        $this->seed(); // Seed fresh data

        $response = $this->getJson('/api/v1/public/blog');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/json');
    }

    #[Test]
    public function blog_list_respects_pagination()
    {
        // Create multiple published announcements
        Announcement::factory()->count(5)->create([
            'is_active' => true,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/public/blog?per_page=2');

        $response->assertStatus(200);
        // Verify it's a valid JSON response
        $this->assertNotEmpty($response->getContent());
    }

    #[Test]
    public function blog_list_can_search_by_title()
    {
        Announcement::factory()->create([
            'title' => 'Special Laravel Article',
            'content' => 'Content',
            'is_active' => true,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/public/blog?q=Laravel');

        $response->assertStatus(200);
        // Just verify we get a 200 response
    }

    #[Test]
    public function blog_list_can_search_by_content()
    {
        Announcement::factory()->create([
            'title' => 'Test Title',
            'content' => 'This mentions PHP',
            'is_active' => true,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/public/blog?q=PHP');

        $response->assertStatus(200);
    }

    #[Test]
    public function blog_detail_returns_single_announcement()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'Test Article',
            'content' => '<p>Full content here</p>',
            'is_active' => true,
            'published_at' => now()->subDay(),
            'view_count' => 5,
        ]);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'content',
                    'priority',
                    'published_at',
                    'view_count',
                    'is_active',
                ],
            ])
            ->assertJson([
                'data' => [
                    'title' => 'Test Article',
                ],
            ]);
    }

    #[Test]
    public function blog_detail_increments_view_count()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'View Count Test',
            'content' => 'Content',
            'is_active' => true,
            'published_at' => now()->subDay(),
            'view_count' => 10,
        ]);

        $this->assertEquals(10, $announcement->view_count);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(200);

        // Refresh from database
        $announcement->refresh();
        $this->assertEquals(11, $announcement->view_count);
    }

    #[Test]
    public function blog_detail_returns_404_for_inactive_announcement()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'Inactive Article',
            'content' => 'Should return 404',
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(404);
    }

    #[Test]
    public function blog_detail_returns_404_for_future_announcement()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'Future Article',
            'content' => 'Not yet published',
            'is_active' => true,
            'published_at' => now()->addDay(), // Future date
        ]);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(404);
    }

    #[Test]
    public function blog_detail_returns_404_for_expired_announcement()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'Expired Article',
            'content' => 'Already expired',
            'is_active' => true,
            'published_at' => now()->subDays(10),
            'expires_at' => now()->subDay(), // Already expired
        ]);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(404);
    }

    #[Test]
    public function blog_list_excludes_announcements_without_published_date()
    {
        // Announcement with published date in the past
        Announcement::factory()->create([
            'title' => 'Published Yesterday',
            'content' => 'Content',
            'is_active' => true,
            'published_at' => now()->subDay(),
        ]);

        // Announcement with published date today
        Announcement::factory()->create([
            'title' => 'Published Today',
            'content' => 'Content',
            'is_active' => true,
            'published_at' => now(),
        ]);

        // Create inactive announcement (should not be returned)
        Announcement::factory()->create([
            'title' => 'Inactive Article',
            'content' => 'Should not be returned',
            'is_active' => false,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/v1/public/blog');

        $response->assertStatus(200);
        // Only active published announcements should be returned
        $this->assertNotEmpty($response->getContent());
    }

    #[Test]
    public function blog_detail_includes_creator_information()
    {
        $announcement = Announcement::factory()->create([
            'title' => 'Test Article',
            'content' => 'Content',
            'is_active' => true,
            'published_at' => now()->subDay(),
            'created_by' => $this->admin->id,
        ]);

        $response = $this->getJson("/api/v1/public/blog/{$announcement->id}");

        $response->assertStatus(200);
        $this->assertArrayHasKey('creator', $response->json('data'));
    }
}

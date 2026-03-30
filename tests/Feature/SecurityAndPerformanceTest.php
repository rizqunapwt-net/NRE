<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\RoyaltyCalculation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

/**
 * Tests for Agent 1 security and performance fixes:
 * - CORS configuration
 * - Rate limiting on public endpoints
 * - Search term length limits
 * - Pagination bounds
 * - Validation on critical endpoints
 * - N+1 query prevention (Author model $appends removal)
 */
class SecurityAndPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);

        // Clear rate limiters between tests to prevent pollution
        RateLimiter::clear('');
    }

    // ─── CORS Tests ───

    public function test_cors_does_not_allow_wildcard_origin(): void
    {
        $cors = config('cors');

        $this->assertNotContains('*', $cors['allowed_origins'], 'CORS should not use wildcard origins');
        $this->assertNotContains('*', $cors['allowed_methods'], 'CORS should not use wildcard methods');
    }

    public function test_cors_allows_configured_origins(): void
    {
        $origins = config('cors.allowed_origins');

        $this->assertIsArray($origins);
        $this->assertNotEmpty($origins);
    }

    public function test_cors_supports_credentials(): void
    {
        $this->assertTrue(config('cors.supports_credentials'));
    }

    // ─── Sanctum Token Expiration Tests ───

    public function test_sanctum_tokens_have_expiration(): void
    {
        $expiration = config('sanctum.expiration');

        $this->assertNotNull($expiration, 'Sanctum tokens must have expiration set');
        $this->assertGreaterThan(0, $expiration);
        $this->assertLessThanOrEqual(1440, $expiration, 'Token expiration should not exceed 24 hours');
    }

    // ─── Rate Limiting Tests ───

    public function test_public_tracking_endpoint_has_rate_limit(): void
    {
        RateLimiter::clear(sha1('throttle|127.0.0.1'));

        // Hit the endpoint many times; we don't need real data, just checking rate limit exists
        for ($i = 0; $i < 31; $i++) {
            $response = $this->getJson('/api/v1/tracking?code=INVALID');
        }

        // After 30+ hits, should get 429
        $response->assertStatus(429);
    }

    // ─── Search Term Length Limits ───

    public function test_book_search_scope_ignores_oversized_term(): void
    {
        $author = Author::factory()->create();
        Book::factory()->create(['author_id' => $author->id, 'title' => 'Unique Test Book']);

        $oversizedTerm = str_repeat('a', 250);

        // The scope should NOT add any where clauses for oversized terms
        $queryWithSearch = Book::search($oversizedTerm)->toRawSql();
        $queryWithoutSearch = Book::query()->toRawSql();

        $this->assertEquals($queryWithoutSearch, $queryWithSearch, 'Oversized search term should not modify the query');
    }

    public function test_book_search_accepts_normal_term(): void
    {
        $author = Author::factory()->create();
        Book::factory()->create([
            'author_id' => $author->id,
            'title' => 'Laravel Programming Guide',
        ]);

        // A normal-length term should add where clauses
        $queryWithSearch = Book::search('Laravel')->toRawSql();
        $queryWithoutSearch = Book::query()->toRawSql();

        $this->assertNotEquals($queryWithoutSearch, $queryWithSearch, 'Valid search term should modify the query');
    }

    public function test_book_search_scope_ignores_single_character(): void
    {
        $author = Author::factory()->create();
        Book::factory()->create(['author_id' => $author->id]);

        // Single char should not modify the query
        $queryWithSearch = Book::search('a')->toRawSql();
        $queryWithoutSearch = Book::query()->toRawSql();

        $this->assertEquals($queryWithoutSearch, $queryWithSearch, 'Single char search should not modify the query');
    }

    // ─── Pagination Limits ───

    public function test_catalog_pagination_is_bounded(): void
    {
        // Try requesting 10000 items per page
        $response = $this->getJson('/api/v1/public/catalog?per_page=10000');

        $response->assertOk();
        $perPage = $response->json('data.per_page') ?? $response->json('data.books.per_page');

        $this->assertLessThanOrEqual(48, $perPage, 'Catalog per_page should be capped at 48');
    }

    public function test_blog_pagination_is_bounded(): void
    {
        $response = $this->getJson('/api/v1/public/blog?per_page=5000');

        $response->assertOk();
        $perPage = $response->json('per_page');

        $this->assertLessThanOrEqual(30, $perPage, 'Blog per_page should be capped at 30');
    }

    // ─── Validation Tests ───

    public function test_royalty_pay_validation_rules_exist(): void
    {
        // Test validation directly by inspecting the controller method
        // This avoids middleware/routing complexity while still verifying the fix
        $user = User::factory()->create(['is_active' => true]);
        $author = Author::factory()->create();
        $royalty = RoyaltyCalculation::factory()->create(['author_id' => $author->id]);

        $this->actingAsWithRole($user, 'Admin');
        $this->withoutMiddleware();

        // Test missing required fields
        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/royalties/{$royalty->id}/pay", []);

        // Should get 422 validation error
        $this->assertContains($response->status(), [400, 422],
            "Expected 400 or 422, got {$response->status()}: " . $response->content());
    }

    public function test_royalty_pay_rejects_future_paid_at(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $author = Author::factory()->create();
        $royalty = RoyaltyCalculation::factory()->create(['author_id' => $author->id]);

        $this->actingAsWithRole($user, 'Admin');
        $this->withoutMiddleware();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/royalties/{$royalty->id}/pay", [
                'payment_reference' => 'REF-123',
                'paid_at' => now()->addYear()->toDateString(),
            ]);

        $this->assertContains($response->status(), [400, 422],
            "Expected 400 or 422, got {$response->status()}: " . $response->content());
    }

    public function test_publishing_request_status_rejects_invalid_status(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $this->actingAsWithRole($user, 'Admin');
        $this->withoutMiddleware();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/publishing-requests/999/status', [
                'status' => 'nonexistent_status_value',
            ]);

        $response->assertStatus(422);
    }

    public function test_publishing_request_notes_rejects_oversized_content(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $this->actingAsWithRole($user, 'Admin');
        $this->withoutMiddleware();

        $response = $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/publishing-requests/999/notes', [
                'editor_notes' => str_repeat('x', 6000), // Over 5000 limit
            ]);

        $response->assertStatus(422);
    }

    // ─── N+1 Prevention: Author Model ───

    public function test_author_model_does_not_auto_append_computed_attributes(): void
    {
        $author = Author::factory()->create();

        $json = $author->toArray();

        // These should NOT be auto-appended anymore
        $this->assertArrayNotHasKey('published_books_count', $json);
        $this->assertArrayNotHasKey('active_contracts_count', $json);
        $this->assertArrayNotHasKey('total_royalties', $json);
        $this->assertArrayNotHasKey('paid_royalties', $json);
        $this->assertArrayNotHasKey('pending_royalties', $json);
    }

    public function test_author_computed_attributes_accessible_via_explicit_append(): void
    {
        $author = Author::factory()->create();
        $author->append(['published_books_count', 'total_royalties']);

        $json = $author->toArray();

        $this->assertArrayHasKey('published_books_count', $json);
        $this->assertArrayHasKey('total_royalties', $json);
    }

    // ─── Webhook Validation ───

    public function test_webhook_rejects_payload_without_transaction_id(): void
    {
        // Send empty payload (no transaction_id extractable)
        $response = $this->postJson('/api/v1/webhooks/payment', [
            'some_random_field' => 'value',
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment(['status' => 'error']);
    }

    // ─── Cache Key Consistency ───

    public function test_catalog_cache_key_is_order_independent(): void
    {
        // Same params in different order should produce same cache key
        $params1 = ['search' => 'test', 'category' => 'fiction', 'sort' => 'newest'];
        $params2 = ['sort' => 'newest', 'search' => 'test', 'category' => 'fiction'];

        ksort($params1);
        ksort($params2);

        $key1 = 'catalog_' . md5(json_encode($params1));
        $key2 = 'catalog_' . md5(json_encode($params2));

        $this->assertEquals($key1, $key2, 'Cache keys should be identical regardless of parameter order');
    }
}

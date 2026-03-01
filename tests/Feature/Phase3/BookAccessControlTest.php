<?php

namespace Tests\Feature\Phase3;

use App\Models\Book;
use App\Models\BookAccess;
use App\Models\BookPurchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BookAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        
        // Setup roles untuk test
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder'])->run();
        
        // Mock events untuk test
        Event::fake();
    }

    /**
     * Test user can access their library
     */
    public function test_user_can_access_library(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        // Grant access
        BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'payment',
            'granted_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/user/library');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data.data'));
    }

    /**
     * Test user can view purchase history
     */
    public function test_user_can_view_purchase_history(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        BookPurchase::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'amount_paid' => 100000,
            'payment_status' => 'paid',
            'transaction_id' => 'TXN-HISTORY',
            'access_type' => 'permanent',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/user/purchases');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data.data'));
    }

    /**
     * Test admin can manage book access
     */
    public function test_admin_can_grant_manual_access(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/book-access', [
                'user_id' => $user->id,
                'book_id' => $book->id,
                'reason' => 'Complimentary access',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Akses berhasil diberikan.',
            ]);

        $this->assertDatabaseHas('book_access', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'granted_by' => 'admin_manual',
            'is_active' => true,
        ]);
    }

    /**
     * Test admin can toggle access
     */
    public function test_admin_can_toggle_access(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        $access = BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'payment',
            'granted_at' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/admin/book-access/{$access->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Access should be deactivated
        $this->assertDatabaseHas('book_access', [
            'id' => $access->id,
            'is_active' => false,
        ]);
    }

    /**
     * Test admin access is not deactivated on purchase
     */
    public function test_admin_access_not_deactivated_on_purchase(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        // Grant admin access first
        $adminAccess = BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'admin_manual',
            'granted_at' => now(),
        ]);

        // User purchases the book (simulate payment webhook)
        $purchase = BookPurchase::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'amount_paid' => 100000,
            'payment_status' => 'paid',
            'transaction_id' => 'TXN-PURCHASE-TEST',
            'access_type' => 'permanent',
            'paid_at' => now(),
        ]);

        // Trigger access grant manually (simulating webhook flow)
        $accessService = app(\App\Services\BookAccessService::class);
        $accessService->grantAfterPayment($purchase);

        // Admin access should still be active
        $this->assertDatabaseHas('book_access', [
            'id' => $adminAccess->id,
            'is_active' => true,
            'granted_by' => 'admin_manual',
        ]);

        // New payment access should also exist
        $this->assertDatabaseHas('book_access', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'granted_by' => 'payment',
            'is_active' => true,
        ]);
    }

    /**
     * Test access check is cached
     */
    public function test_access_check_is_cached(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'payment',
            'granted_at' => now(),
        ]);

        // First check (should query DB)
        $service = app(\App\Services\BookAccessService::class);
        $service->hasAccess($user, $book);

        // Second check (should use cache)
        $hasAccess = $service->hasAccess($user, $book);
        $this->assertTrue($hasAccess);

        // Verify cache key exists
        $cacheKey = "book_access:{$user->id}:{$book->id}";
        $this->assertTrue(Cache::has($cacheKey));
    }

    /**
     * Test expired access is revoked
     */
    public function test_expired_access_is_revoked(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        // Create expired access
        BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'payment',
            'granted_at' => now()->subDays(31),
            'expires_at' => now()->subDay(), // Expired
        ]);

        // Run revoke command
        $this->artisan('books:revoke-expired-access')
            ->expectsOutputToContain('Berhasil revoke');

        // Access should be deactivated
        $this->assertDatabaseHas('book_access', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'is_active' => false,
        ]);
    }

    /**
     * Test access with expiry date
     */
    public function test_access_with_expiry_date(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        $expiresAt = now()->addDays(30);

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/book-access', [
                'user_id' => $user->id,
                'book_id' => $book->id,
                'expires_at' => $expiresAt->toIso8601String(),
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('book_access', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'is_active' => true,
        ]);

        // Check expiry date is set
        $access = BookAccess::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->first();

        $this->assertNotNull($access->expires_at);
        $this->assertTrue($access->expires_at->diffInMinutes($expiresAt) < 1);
    }

    /**
     * Test user cannot access book without purchase
     */
    public function test_cannot_access_book_without_purchase(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['is_published' => true]);

        // User has no access
        $service = app(\App\Services\BookAccessService::class);
        $hasAccess = $service->hasAccess($user, $book);

        $this->assertFalse($hasAccess);
    }
}

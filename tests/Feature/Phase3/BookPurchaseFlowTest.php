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

class BookPurchaseFlowTest extends TestCase
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
     * Test user can initiate book purchase
     */
    public function test_user_can_initiate_book_purchase(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase', [
                'access_type' => 'permanent',
                'payment_method' => 'midtrans',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Pembelian berhasil dibuat.',
            ]);

        $this->assertDatabaseHas('book_purchases', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'payment_status' => 'pending',
        ]);
    }

    /**
     * Test purchase is idempotent - prevent double purchase
     */
    public function test_purchase_is_idempotent(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        // First purchase
        $response1 = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase');

        // Second purchase (should return existing)
        $response2 = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase');

        $response1->assertStatus(201);
        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['is_existing' => true],
            ]);

        // Should only have 1 pending purchase
        $this->assertDatabaseCount('book_purchases', 1);
    }

    /**
     * Test user cannot purchase if already has access
     */
    public function test_cannot_purchase_if_already_has_access(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        // Grant access first
        BookAccess::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_level' => 'full',
            'is_active' => true,
            'granted_by' => 'admin_manual',
            'granted_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    /**
     * Test race condition prevention with concurrent purchases
     */
    public function test_prevent_race_condition_on_purchase(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        // Simulate concurrent requests (in real scenario, would use multiple processes)
        $response1 = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase');

        $response2 = $this->actingAs($user)
            ->postJson('/api/v1/books/' . $book->id . '/purchase');

        // One should succeed, one should return existing
        $this->assertTrue(
            $response1->status() === 201 || $response2->status() === 201
        );

        // Only 1 purchase should exist
        $this->assertDatabaseCount('book_purchases', 1);
    }

    /**
     * Test purchase status endpoint
     */
    public function test_can_check_purchase_status(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        $purchase = BookPurchase::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'amount_paid' => 100000,
            'payment_status' => 'pending',
            'transaction_id' => 'TXN-STATUSTEST',
            'access_type' => 'permanent',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/purchases/TXN-STATUSTEST/status');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'transaction_id' => 'TXN-STATUSTEST',
                    'payment_status' => 'pending',
                ],
            ]);
    }

    /**
     * Test admin can view all purchases
     */
    public function test_admin_can_view_all_purchases(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Admin');

        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        BookPurchase::create([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'amount_paid' => 100000,
            'payment_status' => 'paid',
            'transaction_id' => 'TXN-ADMINTEST',
            'access_type' => 'permanent',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/purchases');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertCount(1, $response->json('data.data'));
    }

    /**
     * Test purchase with different access types
     */
    public function test_purchase_with_different_access_types(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        $accessTypes = ['permanent', 'rental_30d', 'rental_90d', 'rental_365d'];

        foreach ($accessTypes as $type) {
            $response = $this->actingAs($user)
                ->postJson('/api/v1/books/' . $book->id . '/purchase', [
                    'access_type' => $type,
                ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('book_purchases', [
                'user_id' => $user->id,
                'book_id' => $book->id,
                'access_type' => $type,
            ]);

            // Cleanup for next iteration
            BookPurchase::where('user_id', $user->id)->delete();
        }
    }

    /**
     * Test expired pending purchases are cancelled
     */
    public function test_expired_pending_purchases_cancelled(): void
    {
        $user = User::factory()->create();
        $book = Book::factory()->create(['price' => 100000, 'is_published' => true]);

        // Create expired pending purchase (forceFill to bypass Eloquent auto-timestamp)
        $purchase = new BookPurchase([
            'user_id' => $user->id,
            'book_id' => $book->id,
            'amount_paid' => 100000,
            'payment_status' => 'pending',
            'transaction_id' => 'TXN-EXPIRED',
        ]);
        $purchase->created_at = now()->subHours(3); // Expired (> 2 hours)
        $purchase->save();

        // Run artisan command
        $this->artisan('books:cancel-expired-purchases')
            ->assertExitCode(0);

        $this->assertDatabaseHas('book_purchases', [
            'transaction_id' => 'TXN-EXPIRED',
            'payment_status' => 'expired',
        ]);
    }
}

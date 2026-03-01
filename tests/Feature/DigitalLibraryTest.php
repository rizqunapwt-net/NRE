<?php

namespace Tests\Feature;

use App\Domain\DigitalLibrary\Events\AccessGranted;
use App\Domain\DigitalLibrary\Events\BookPurchased;
use App\Enums\AccessType;
use App\Enums\BookPaymentStatus;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookAccess;
use App\Models\BookCitation;
use App\Models\BookPurchase;
use App\Models\Category;
use App\Models\User;
use App\Services\BookAccessService;
use App\Services\CitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class DigitalLibraryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    // ─── Category Tests ───

    public function test_category_can_be_created_with_slug(): void
    {
        $cat = Category::create([
            'name'      => 'Agama & Spiritualitas',
            'slug'      => 'agama-spiritualitas',
            'is_active' => true,
        ]);

        $this->assertDatabaseHas('categories', ['slug' => 'agama-spiritualitas']);
        $this->assertNull($cat->parent_id);
    }

    public function test_category_supports_parent_child_hierarchy(): void
    {
        $parent = Category::create(['name' => 'Agama', 'slug' => 'agama', 'is_active' => true]);
        $child  = Category::create(['name' => 'Islam', 'slug' => 'islam', 'parent_id' => $parent->id, 'is_active' => true]);

        $this->assertEquals($parent->id, $child->parent_id);
        $this->assertTrue($parent->children()->where('id', $child->id)->exists());
    }

    // ─── Book Digital Fields Tests ───

    public function test_book_has_digital_fields(): void
    {
        $author = Author::factory()->create();
        $book   = Book::create([
            'type'         => 'publishing',
            'title'        => 'Buku Digital Test',
            'author_id'    => $author->id,
            'is_digital'   => true,
            'is_published' => false,
            'slug'         => 'buku-digital-test',
        ]);

        $this->assertTrue($book->is_digital);
        $this->assertFalse($book->is_published);
    }

    public function test_book_slug_is_auto_generated(): void
    {
        $author = Author::factory()->create();
        $book   = Book::create([
            'type'      => 'publishing',
            'title'     => 'Buku Dengan Judul Panjang',
            'author_id' => $author->id,
        ]);

        $this->assertNotNull($book->slug);
        $this->assertEquals('buku-dengan-judul-panjang', $book->slug);
    }

    public function test_book_slug_is_unique_with_suffix(): void
    {
        $author = Author::factory()->create();

        $book1 = Book::create(['type' => 'publishing', 'title' => 'Buku Sama', 'author_id' => $author->id]);
        $book2 = Book::create(['type' => 'publishing', 'title' => 'Buku Sama', 'author_id' => $author->id]);
        $book3 = Book::create(['type' => 'publishing', 'title' => 'Buku Sama', 'author_id' => $author->id]);

        $this->assertEquals('buku-sama', $book1->slug);
        $this->assertEquals('buku-sama-2', $book2->slug);
        $this->assertEquals('buku-sama-3', $book3->slug);
    }

    // ─── BookPurchase Tests ───

    public function test_book_purchase_can_be_created(): void
    {
        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        $purchase = BookPurchase::create([
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'amount_paid'    => 99000.00,
            'currency'       => 'IDR',
            'payment_method' => 'transfer',
            'payment_status' => BookPaymentStatus::PENDING,
            'access_type'    => AccessType::PERMANENT,
        ]);

        $this->assertDatabaseHas('book_purchases', [
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'payment_status' => 'pending',
            'access_type'    => 'permanent',
        ]);
        $this->assertFalse($purchase->isPaid());
    }

    public function test_mark_as_paid_updates_status(): void
    {
        // Event dispatch terjadi di BookPurchaseService::confirmPayment(), bukan di markAsPaid().
        // Test ini hanya memverifikasi data mutation yang dilakukan oleh markAsPaid().

        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        $purchase = BookPurchase::create([
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'amount_paid'    => 99000.00,
            'currency'       => 'IDR',
            'payment_status' => BookPaymentStatus::PENDING,
            'access_type'    => AccessType::PERMANENT,
        ]);

        $purchase->markAsPaid('GW-12345', ['ref' => 'test']);

        $this->assertTrue($purchase->fresh()->isPaid());
        $this->assertEquals('GW-12345', $purchase->fresh()->payment_gateway_id);
    }

    public function test_mark_as_paid_throws_if_already_paid(): void
    {
        $this->expectException(\RuntimeException::class);

        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        $purchase = BookPurchase::create([
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'amount_paid'    => 50000.00,
            'currency'       => 'IDR',
            'payment_status' => BookPaymentStatus::PAID,
            'access_type'    => AccessType::RENTAL_30D,
        ]);

        $purchase->markAsPaid('GW-AGAIN', []);
    }

    // ─── BookAccessService Tests ───

    public function test_grant_from_purchase_creates_book_access(): void
    {
        Event::fake([AccessGranted::class]);

        $user    = User::factory()->create();
        $author  = Author::factory()->create();
        $book    = Book::factory()->create(['author_id' => $author->id]);
        $service = app(BookAccessService::class);

        $purchase = BookPurchase::create([
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'amount_paid'    => 99000.00,
            'currency'       => 'IDR',
            'payment_status' => BookPaymentStatus::PAID,
            'access_type'    => AccessType::PERMANENT,
            'paid_at'        => now(),
        ]);

        $access = $service->grantFromPurchase($purchase);

        $this->assertInstanceOf(BookAccess::class, $access);
        $this->assertEquals($user->id, $access->user_id);
        $this->assertEquals($book->id, $access->book_id);
        $this->assertTrue($access->is_active);
        $this->assertEquals('payment', $access->granted_by);
        $this->assertEquals($purchase->id, $access->book_purchase_id);

        Event::assertDispatched(AccessGranted::class);
    }

    public function test_grant_from_purchase_is_idempotent(): void
    {
        Event::fake();

        $user    = User::factory()->create();
        $author  = Author::factory()->create();
        $book    = Book::factory()->create(['author_id' => $author->id]);
        $service = app(BookAccessService::class);

        $purchase = BookPurchase::create([
            'user_id'        => $user->id,
            'book_id'        => $book->id,
            'amount_paid'    => 99000.00,
            'currency'       => 'IDR',
            'payment_status' => BookPaymentStatus::PAID,
            'access_type'    => AccessType::PERMANENT,
            'paid_at'        => now(),
        ]);

        $access1 = $service->grantFromPurchase($purchase);
        $access2 = $service->grantFromPurchase($purchase);

        $this->assertEquals($access1->id, $access2->id);
        $this->assertEquals(1, BookAccess::where('book_purchase_id', $purchase->id)->count());
    }

    public function test_grant_manually_by_admin(): void
    {
        Event::fake([AccessGranted::class]);

        $admin   = User::factory()->create();
        $user    = User::factory()->create();
        $author  = Author::factory()->create();
        $book    = Book::factory()->create(['author_id' => $author->id]);
        $service = app(BookAccessService::class);

        $access = $service->grantManually(
            userId:      $user->id,
            bookId:      $book->id,
            adminId:     $admin->id,
            accessLevel: 'full',
            notes:       'Review copy',
        );

        $this->assertEquals('admin_manual', $access->granted_by);
        $this->assertEquals($admin->id, $access->granted_by_admin_id);
        $this->assertEquals('Review copy', $access->admin_notes);
        $this->assertTrue($access->is_active);

        Event::assertDispatched(AccessGranted::class);
    }

    public function test_revoke_deactivates_access(): void
    {
        $user    = User::factory()->create();
        $author  = Author::factory()->create();
        $book    = Book::factory()->create(['author_id' => $author->id]);
        $service = app(BookAccessService::class);

        BookAccess::create([
            'user_id'     => $user->id,
            'book_id'     => $book->id,
            'is_active'   => true,
            'granted_by'  => 'admin_manual',
            'granted_at'  => now(),
        ]);

        $service->revoke($user->id, $book->id);

        $this->assertFalse(
            BookAccess::where('user_id', $user->id)
                ->where('book_id', $book->id)
                ->where('is_active', true)
                ->exists()
        );
    }

    public function test_has_access_returns_true_for_book_owner_author(): void
    {
        $user = User::factory()->create([
            'is_verified_author' => true,
        ]);
        $author = Author::factory()->create([
            'user_id' => $user->id,
        ]);
        $book = Book::factory()->create([
            'author_id' => $author->id,
        ]);

        $user->update(['author_profile_id' => $author->id]);

        $service = app(BookAccessService::class);

        $this->assertTrue($service->hasAccess($user->fresh(), $book));
    }

    public function test_has_access_returns_false_for_non_owner_without_purchase(): void
    {
        $owner = User::factory()->create(['is_verified_author' => true]);
        $author = Author::factory()->create(['user_id' => $owner->id]);
        $book = Book::factory()->create(['author_id' => $author->id]);
        $otherUser = User::factory()->create();

        $service = app(BookAccessService::class);

        $this->assertFalse($service->hasAccess($otherUser, $book));
    }

    public function test_has_access_returns_false_for_expired(): void
    {
        $user    = User::factory()->create();
        $author  = Author::factory()->create();
        $book    = Book::factory()->create(['author_id' => $author->id]);
        $service = app(BookAccessService::class);

        BookAccess::create([
            'user_id'    => $user->id,
            'book_id'    => $book->id,
            'is_active'  => true,
            'granted_by' => 'payment',
            'granted_at' => now()->subDays(35),
            'expires_at' => now()->subDay(), // sudah expired
        ]);

        $this->assertFalse($service->hasAccess($user, $book));
    }

    // ─── CitationService Tests ───

    public function test_citation_service_generates_apa(): void
    {
        $author  = Author::factory()->create(['name' => 'Ahmad Subagyo']);
        $book    = Book::factory()->create([
            'author_id'    => $author->id,
            'title'        => 'Ekonomi Islam Modern',
            'published_year' => 2024,
        ]);

        app(CitationService::class)->invalidateCache($book);

        BookCitation::create([
            'book_id'          => $book->id,
            'publisher_name'   => 'Penerbit Rizquna Elfath',
            'city'             => 'Jakarta',
            'publication_year' => 2024,
        ]);

        $service  = app(CitationService::class);
        $citation = $service->generate($book, 'apa');

        $this->assertStringContainsString('Ahmad Subagyo', $citation);
        $this->assertStringContainsString('2024', $citation);
        $this->assertStringContainsString('Ekonomi Islam Modern', $citation);
        $this->assertStringContainsString('Penerbit Rizquna Elfath', $citation);
    }

    public function test_citation_service_generates_all_formats(): void
    {
        $author = Author::factory()->create(['name' => 'Siti Rahayu']);
        $book   = Book::factory()->create(['author_id' => $author->id, 'title' => 'Fikih Kontemporer']);

        app(CitationService::class)->invalidateCache($book);

        BookCitation::create([
            'book_id'          => $book->id,
            'publication_year' => 2023,
        ]);

        $service = app(CitationService::class);
        $all     = $service->generateAll($book);

        $this->assertArrayHasKey('apa', $all);
        $this->assertArrayHasKey('mla', $all);
        $this->assertArrayHasKey('chicago', $all);
        $this->assertArrayHasKey('ieee', $all);
        $this->assertArrayHasKey('bibtex', $all);
        $this->assertStringContainsString('@book{', $all['bibtex']);
    }

    // ─── BookAccess scopeActive Tests ───

    public function test_scope_active_excludes_expired_access(): void
    {
        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        BookAccess::create([
            'user_id'    => $user->id,
            'book_id'    => $book->id,
            'is_active'  => true,
            'granted_by' => 'payment',
            'granted_at' => now()->subDays(40),
            'expires_at' => now()->subDay(),
        ]);

        $this->assertEquals(0, BookAccess::active()->count());
    }

    public function test_scope_active_includes_permanent_access(): void
    {
        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        BookAccess::create([
            'user_id'    => $user->id,
            'book_id'    => $book->id,
            'is_active'  => true,
            'granted_by' => 'payment',
            'granted_at' => now(),
            'expires_at' => null,
        ]);

        $this->assertEquals(1, BookAccess::active()->count());
    }

    // ─── AccessType Enum Tests ───

    public function test_access_type_expiration_date(): void
    {
        $permanent = AccessType::PERMANENT->expirationDate();
        $rental30  = AccessType::RENTAL_30D->expirationDate();
        $rental90  = AccessType::RENTAL_90D->expirationDate();
        $rental365 = AccessType::RENTAL_365D->expirationDate();

        $this->assertNull($permanent);
        $this->assertEqualsWithDelta(30, now()->diffInDays($rental30), 1);
        $this->assertEqualsWithDelta(90, now()->diffInDays($rental90), 1);
        $this->assertEqualsWithDelta(365, now()->diffInDays($rental365), 1);
    }

    // ─── User Library Relationship Tests ───

    public function test_user_accessible_books_relation(): void
    {
        $user   = User::factory()->create();
        $author = Author::factory()->create();
        $book   = Book::factory()->create(['author_id' => $author->id]);

        BookAccess::create([
            'user_id'    => $user->id,
            'book_id'    => $book->id,
            'is_active'  => true,
            'granted_by' => 'admin_manual',
            'granted_at' => now(),
        ]);

        $accessible = $user->accessibleBooks()->get();

        $this->assertCount(1, $accessible);
        $this->assertEquals($book->id, $accessible->first()->id);
    }
}

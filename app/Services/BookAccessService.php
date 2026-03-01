<?php

namespace App\Services;

use App\Domain\DigitalLibrary\Events\AccessGranted;
use App\Enums\AccessType;
use App\Models\Book;
use App\Models\BookAccess;
use App\Models\BookPurchase;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BookAccessService
{
    private const CACHE_TTL = 300; // 5 menit

    /**
     * Cek apakah user punya akses ke buku dengan caching.
     */
    public function hasAccess(User $user, Book $book): bool
    {
        // Penulis buku boleh membaca bukunya sendiri tanpa perlu purchase/access record.
        if (
            $book->author_id &&
            (
                ((int) ($user->author_profile_id ?? 0) === (int) $book->author_id) ||
                $book->author()->where('authors.user_id', $user->id)->exists()
            )
        ) {
            return true;
        }

        $cacheKey = "book_access:{$user->id}:{$book->id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $book) {
            return BookAccess::where('user_id', $user->id)
                ->where('book_id', $book->id)
                ->where('is_active', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
                })
                ->exists();
        });
    }

    /**
     * Grant access to a book after successful purchase.
     * Race-condition safe via DB transaction + lockForUpdate.
     * Hanya deactivate payment access, bukan admin_manual access.
     */
    public function grantFromPurchase(BookPurchase $purchase): BookAccess
    {
        return DB::transaction(function () use ($purchase) {
            // Lock the purchase row to prevent duplicate grants
            $purchase = BookPurchase::lockForUpdate()->find($purchase->id);

            // Idempotent: return existing access if already granted
            if ($purchase->access()->exists()) {
                return $purchase->access;
            }

            BookAccess::where('user_id', $purchase->user_id)
                ->where('book_id', $purchase->book_id)
                ->where('granted_by', 'payment') // ← Hanya payment access
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $access = BookAccess::create([
                'user_id'          => $purchase->user_id,
                'book_id'          => $purchase->book_id,
                'access_level'     => 'full',
                'is_active'        => true,
                'granted_by'       => 'payment',
                'book_purchase_id' => $purchase->id,
                'granted_at'       => now(),
                'expires_at'       => $purchase->expires_at,
            ]);

            // Invalidate cache
            $this->invalidateCache($purchase->user_id, $purchase->book_id);

            event(new AccessGranted($access));

            return $access;
        });
    }

    /**
     * Grant manual access by an admin (e.g., complimentary, review copy).
     */
    public function grantManually(
        int $userId,
        int $bookId,
        int $adminId,
        string $accessLevel = 'full',
        ?string $notes = null,
        ?\Carbon\Carbon $expiresAt = null
    ): BookAccess {
        return DB::transaction(function () use ($userId, $bookId, $adminId, $accessLevel, $notes, $expiresAt) {
            // Deactivate existing access (semua jenis, karena ini manual override oleh admin)
            BookAccess::where('user_id', $userId)
                ->where('book_id', $bookId)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $access = BookAccess::create([
                'user_id'             => $userId,
                'book_id'             => $bookId,
                'access_level'        => $accessLevel,
                'is_active'           => true,
                'granted_by'          => 'admin_manual',
                'granted_by_admin_id' => $adminId,
                'admin_notes'         => $notes,
                'granted_at'          => now(),
                'expires_at'          => $expiresAt,
            ]);

            // Invalidate cache
            $this->invalidateCache($userId, $bookId);

            event(new AccessGranted($access));

            return $access;
        });
    }

    /**
     * Grant access setelah payment webhook confirmed.
     * Wrapper untuk grantFromPurchase dengan interface yang lebih simple.
     */
    public function grantAfterPayment(BookPurchase $purchase): BookAccess
    {
        return $this->grantFromPurchase($purchase);
    }

    /**
     * Revoke active access for a user+book.
     */
    public function revoke(int $userId, int $bookId): int
    {
        $result = BookAccess::where('user_id', $userId)
            ->where('book_id', $bookId)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        // Invalidate cache
        $this->invalidateCache($userId, $bookId);

        return $result;
    }

    /**
     * Invalidate cache saat akses berubah.
     */
    public function invalidateCache(int $userId, int $bookId): void
    {
        Cache::forget("book_access:{$userId}:{$bookId}");
    }

    /**
     * Get daftar buku yang bisa diakses user (dengan caching).
     */
    public function getUserLibrary(User $user, int $perPage = 20)
    {
        $page     = request()->input('page', 1);
        $cacheKey = "user_library:{$user->id}:{$perPage}:page_{$page}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $perPage) {
            return Book::whereHas('access', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->where('is_active', true)
                  ->where(function ($q2) {
                      $q2->whereNull('expires_at')
                         ->orWhere('expires_at', '>', now());
                  });
            })
            ->with(['author', 'category', 'preview'])
            ->published()
            ->paginate($perPage);
        });
    }

    /**
     * Invalidate user library cache (semua pages).
     * Menggunakan key-based forget karena database/file cache tidak support tagging.
     */
    public function invalidateUserLibraryCache(User $user, int $perPage = 20): void
    {
        // Hapus cache untuk semua page yang mungkin sudah di-cache
        // Asumsi max 100 halaman — cukup untuk library user
        for ($page = 1; $page <= 100; $page++) {
            $key = "user_library:{$user->id}:{$perPage}:page_{$page}";
            if (! Cache::has($key)) {
                break; // Stop ketika page tidak ada di cache
            }
            Cache::forget($key);
        }
    }
}

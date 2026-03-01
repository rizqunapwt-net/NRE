<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Support\Facades\Cache;

class CatalogCacheService
{
    private const CATALOG_TTL = 600;      // 10 menit
    private const BOOK_DETAIL_TTL = 1800; // 30 menit
    private const CATEGORY_TTL = 3600;    // 1 jam
    private const LIBRARY_TTL = 300;      // 5 menit

    /**
     * Cache katalog buku publik.
     */
    public function getCatalog(int $page = 1, ?int $categoryId = null, ?string $search = null)
    {
        $key = "catalog:page:{$page}:cat:{$categoryId}:q:" . md5($search ?? '');

        return Cache::remember($key, self::CATALOG_TTL, function () use ($page, $categoryId, $search) {
            $query = Book::with(['author:id,name', 'category:id,name,slug'])
                ->published()
                ->select([
                    'id', 'title', 'slug', 'price', 'original_price',
                    'cover_path', 'author_id', 'category_id', 'is_digital',
                ])
                ->latest('published_at');

            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $driver = config('database.default');

                    if ($driver === 'pgsql') {
                        $q->where('title', 'ilike', "%{$search}%")
                          ->orWhereHas('author', fn ($aq) =>
                              $aq->where('name', 'ilike', "%{$search}%")
                          );
                    } else {
                        // SQLite/MySQL: gunakan LOWER() LIKE
                        $lower = strtolower($search);
                        $q->whereRaw("LOWER(title) LIKE ?", ["%{$lower}%"])
                          ->orWhereHas('author', fn ($aq) =>
                              $aq->whereRaw("LOWER(name) LIKE ?", ["%{$lower}%"])
                          );
                    }
                });
            }

            return $query->paginate(20, ['*'], 'page', $page);
        });
    }

    /**
     * Cache detail buku.
     */
    public function getBookDetail(string $slug)
    {
        return Cache::remember("book:{$slug}", self::BOOK_DETAIL_TTL, function () use ($slug) {
            return Book::with(['author', 'category', 'citation', 'preview'])
                ->where('slug', $slug)
                ->published()
                ->firstOrFail();
        });
    }

    /**
     * Cache daftar kategori.
     */
    public function getCategories()
    {
        return Cache::remember('categories:active', self::CATEGORY_TTL, function () {
            return Category::active()
                ->ordered()
                ->withCount('publishedBooks')
                ->get();
        });
    }

    /**
     * Cache perpustakaan user (per user).
     */
    public function getUserLibrary(int $userId, int $page = 1)
    {
        $key = "user:{$userId}:library:page:{$page}";

        return Cache::remember($key, self::LIBRARY_TTL, function () use ($userId, $page) {
            return Book::whereHas('access', function ($q) use ($userId) {
                $q->where('user_id', $userId)->active();
            })
            ->with(['author:id,name', 'category:id,name'])
            ->paginate(20, ['*'], 'page', $page);
        });
    }

    /**
     * Invalidate cache saat buku di-update.
     */
    public function invalidateBook(Book $book): void
    {
        Cache::forget("book:{$book->slug}");

        // Invalidate halaman katalog tertentu (flush pattern)
        // Redis mendukung wildcard delete
        $this->flushByPattern('catalog:*');
        $this->flushByPattern("user:*:library:*");
    }

    /**
     * Invalidate cache perpustakaan user tertentu.
     */
    public function invalidateUserLibrary(int $userId): void
    {
        $this->flushByPattern("user:{$userId}:library:*");
    }

    /**
     * Flush cache by pattern menggunakan cursor-based SCAN (non-blocking).
     * KEYS command dihindari karena blocking O(N) yang membekukan Redis.
     */
    private function flushByPattern(string $pattern): void
    {
        $prefix = config('cache.prefix', 'nre_cache_');

        try {
            $redis = Cache::getRedis();
            $cursor = '0';
            $fullPattern = $prefix . $pattern;

            do {
                [$cursor, $keys] = $redis->scan($cursor, ['match' => $fullPattern, 'count' => 100]);
                if (!empty($keys)) {
                    $redis->del($keys);
                }
            } while ($cursor !== '0');
        } catch (\Throwable $e) {
            // Redis tidak tersedia (atau driver tidak mendukung) — lewati tanpa error
        }
    }
}

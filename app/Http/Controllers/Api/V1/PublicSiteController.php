<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\Faq;
use App\Models\SiteContent;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSiteController extends Controller
{
    /**
     * GET /api/v1/public/site-content
     * Returns all active site content grouped by section.
     */
    public function siteContent(): JsonResponse
    {
        $contents = SiteContent::active()
            ->orderBy('sort_order')
            ->get()
            ->groupBy('section')
            ->map(fn ($items) => $items->pluck('value', 'key'));

        return response()->json(['data' => $contents]);
    }

    /**
     * GET /api/v1/public/faqs
     */
    public function faqs(Request $request): JsonResponse
    {
        $query = Faq::active()->orderBy('sort_order');

        if ($request->has('category')) {
            $query->category($request->category);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * GET /api/v1/public/testimonials
     */
    public function testimonials(Request $request): JsonResponse
    {
        $query = Testimonial::active()->orderBy('sort_order');

        if ($request->boolean('featured')) {
            $query->featured();
        }

        return response()->json(['data' => $query->limit(12)->get()]);
    }

    /**
     * GET /api/v1/public/catalog
     * Returns published books for the landing page catalog.
     */
    public function catalog(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Catalog Audit:', [
            'db_connection' => \Illuminate\Support\Facades\DB::getDefaultConnection(),
            'db_name' => \Illuminate\Support\Facades\DB::getDatabaseName(),
            'published_count' => Book::where('status', 'published')->count(),
        ]);

        $query = Book::with(['author', 'preview', 'category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc');

        if ($request->has('category')) {
            $categorySlug = $request->category;
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('author', function ($a) use ($search) {
                        $a->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $books = $query->paginate($request->input('per_page', 12));

        // Transform each book to include cover_url
        $books->getCollection()->transform(function ($book) {
            return $this->transformBook($book);
        });

        return response()->json($books);
    }

    /**
     * GET /api/v1/public/catalog/{id}
     * Returns a single book detail for public view.
     */
    public function bookDetail(string $idOrSlug): JsonResponse
    {
        $query = Book::with(['author', 'preview', 'assignments.marketplace', 'marketplaceListings.marketplace'])
            ->where('status', 'published');

        // Fix: Separate queries to avoid PostgreSQL type casting issues
        if (is_numeric($idOrSlug)) {
            $query->where('id', (int) $idOrSlug);
        } else {
            $query->where('slug', $idOrSlug);
        }

        $book = $query->firstOrFail();

        $data = $this->transformBook($book);

        // Collect marketplace links from assignments and marketplace_listings
        $links = [];

        foreach ($book->assignments as $a) {
            if ($a->product_url && $a->marketplace) {
                $links[] = [
                    'marketplace' => $a->marketplace->name,
                    'code'        => $a->marketplace->code,
                    'url'         => $a->product_url,
                ];
            }
        }

        foreach ($book->marketplaceListings()->active()->get() as $l) {
            if ($l->listing_url && $l->marketplace) {
                $links[] = [
                    'marketplace' => $l->marketplace->name,
                    'code'        => $l->marketplace->code,
                    'url'         => $l->listing_url,
                    'price'       => $l->price,
                ];
            }
        }

        $data['marketplace_links'] = $links;

        return response()->json(['data' => $data]);
    }

    private function transformBook(Book $book): array
    {
        $coverUrl = null;
        if ($book->cover_path) {
            $coverUrl = url('/api/v1/public/books/' . $book->id . '/cover-image');
        }

        return [
            'id'           => $book->id,
            'title'        => $book->title,
            'slug'         => $book->slug ?: \Illuminate\Support\Str::slug($book->title),
            'author'       => $book->author ? ['id' => $book->author->id, 'nama' => $book->author->name] : null,
            'price'        => $book->price ?? 0,
            'cover_url'    => $coverUrl,
            'cover_path'   => $book->cover_path,
            'type'         => $book->type,
            'status'       => $book->status,
            'published_at' => $book->published_at?->toDateString(),
            'published_year' => $book->published_year,
            'publisher'    => $book->publisher,
            'publisher_city' => $book->publisher_city,
            'description'  => $book->description,
            'isbn'         => $book->isbn,
            'is_digital'   => $book->is_digital,
            'tracking_code' => $book->tracking_code,
            'page_count'   => $book->page_count,
            'preview_pages' => $book->preview?->preview_pages ?? config('books.preview_pages', 10),
            'category'     => $book->category ? [
                'id'   => $book->category->id,
                'name' => $book->category->name,
                'slug' => $book->category->slug,
                'icon' => $book->category->icon,
            ] : null,
        ];
    }

    /**
     * GET /api/v1/public/authors
     * Returns featured authors for the landing page.
     */
    public function authors(): JsonResponse
    {
        $authors = Author::whereHas('books', fn ($q) => $q->where('status', 'published'))
            ->withCount(['books' => fn ($q) => $q->where('status', 'published')])
            ->orderByDesc('books_count')
            ->limit(8)
            ->get(['id', 'name', 'email', 'photo_path']);

        return response()->json(['data' => $authors]);
    }

    /**
     * GET /api/v1/public/stats
     * Returns aggregate stats for the landing page.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_books' => Book::where('status', 'published')->count(),
                'total_authors' => Author::has('books')->count(),
                'years_active' => max(1, now()->year - 2020),
            ],
        ]);
    }

    /**
     * GET /api/v1/public/blog
     * Returns published announcements/articles for the blog page.
     */
    public function blog(Request $request): JsonResponse
    {
        $query = Announcement::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            })
            ->orderBy('published_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        $posts = $query->paginate($request->input('per_page', 9));

        return response()->json($posts);
    }

    /**
     * GET /api/v1/public/blog/{id}
     * Returns a single blog post detail.
     */
    public function blogDetail(string $id): JsonResponse
    {
        $post = Announcement::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>=', now());
            })
            ->findOrFail($id);

        // Increment view count
        $post->increment('view_count');

        $post->load('creator');

        return response()->json(['data' => $post]);
    }

    /**
     * GET /api/v1/public/categories
     * Returns active categories with book count.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::active()
            ->ordered()
            ->withCount(['books' => fn ($q) => $q->where('status', 'published')])
            ->get()
            ->map(fn ($c) => [
                'id'          => $c->id,
                'name'        => $c->name,
                'slug'        => $c->slug,
                'icon'        => $c->icon,
                'books_count' => $c->books_count,
            ]);

        return response()->json(['data' => $categories]);
    }

    /**
     * GET /api/v1/public/catalog/grouped
     * Returns books grouped by category for the homepage.
     */
    public function catalogGrouped(): JsonResponse
    {
        $categories = Category::active()
            ->ordered()
            ->with(['books' => fn ($q) => $q
                ->where('status', 'published')
                ->with(['author', 'preview', 'category'])
                ->orderByDesc('created_at')
                ->limit(4)
            ])
            ->withCount(['books' => fn ($q) => $q->where('status', 'published')])
            ->get()
            ->filter(fn ($c) => $c->books_count > 0)
            ->map(fn ($c) => [
                'category' => [
                    'id'   => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'icon' => $c->icon,
                ],
                'books_count' => $c->books_count,
                'books'       => $c->books->map(fn ($b) => $this->transformBook($b)),
            ]);

        return response()->json(['data' => $categories->values()]);
    }
}

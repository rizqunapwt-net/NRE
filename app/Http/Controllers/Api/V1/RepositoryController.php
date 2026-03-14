<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookStorageService;
use App\Services\CitationService;
use App\Services\ScholarCitationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RepositoryController extends Controller
{
    public function __construct(
        private CitationService $citationService,
        private ScholarCitationService $scholarCitationService,
        private BookStorageService $storageService,
    ) {}

    /**
     * GET /api/v1/public/repository
     * Daftar buku mode akademis (untuk sitasi).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Book::with(['author:id,name', 'category:id,name', 'citation'])
            ->published()
            ->select([
                'id', 'title', 'subtitle', 'slug', 'isbn', 'author_id', 'category_id',
                'description', 'abstract', 'publisher', 'publisher_city',
                'year', 'edition', 'page_count', 'language',
                'published_year', 'cover_path', 'published_at',
            ]);

        // Search dengan database-agnostic approach
        if ($search = $request->get('q')) {
            $this->applySearch($query, $search);
        }

        // Filter by year
        if ($year = $request->get('year')) {
            $query->where('published_year', $year);
        }

        // Filter by category
        if ($categoryId = $request->get('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $books = $query->latest('published_year')
            ->paginate(min($request->integer('per_page', 20), 100));

        // Transform cover_path to cover_url using BookStorageService
        $books->getCollection()->transform(function ($book) {
            if ($book->cover_path) {
                // Try S3 first, fallback to Google Drive
                $book->setAttribute('cover_url', $this->storageService->getCoverUrlWithFallback($book, 'medium'));
            } else {
                $book->setAttribute('cover_url', null);
            }
            return $book;
        });

        return response()->json([
            'success' => true,
            'data' => $books,
        ]);
    }

    /**
     * GET /api/v1/public/repository/{slug}
     * Detail buku + data sitasi.
     */
    public function show(string $slug): JsonResponse
    {
        $book = Book::with(['author', 'category', 'citation'])
            ->where('slug', $slug)
            ->published()
            ->firstOrFail();

        $bookData = $book->toArray();
        
        // Add cover_url using BookStorageService
        if ($book->cover_path) {
            // Try S3 first, fallback to Google Drive
            $bookData['cover_url'] = $this->storageService->getCoverUrlWithFallback($book, 'large');
        } else {
            $bookData['cover_url'] = null;
        }

        return response()->json([
            'success' => true,
            'data' => [
                ...$bookData,
                'citations' => $this->scholarCitationService->generateAll($book),
            ],
        ]);
    }

    /**
     * GET /api/v1/public/repository/{slug}/cite?format=apa
     * Get sitasi dalam format tertentu.
     */
    public function cite(string $slug, Request $request): JsonResponse
    {
        $book = Book::with(['author', 'citation'])
            ->where('slug', $slug)
            ->published()
            ->firstOrFail();

        $format = strtolower((string) $request->get('format', 'apa'));
        $citation = $this->resolveCitation($book, $format);

        return response()->json([
            'success' => true,
            'data' => [
                'format' => $format,
                'citation' => $citation,
                'all_formats' => $this->scholarCitationService->generateAll($book),
            ],
        ]);
    }

    /**
     * GET /api/v1/search
     * Full-text search endpoint (scholar mode).
     */
    public function search(Request $request): JsonResponse
    {
        $query = Book::with(['author:id,name', 'category:id,name', 'citation'])
            ->published()
            ->where('is_digital', true)
            ->select([
                'id',
                'slug',
                'author_id',
                'category_id',
                'title',
                'subtitle',
                'isbn',
                'description',
                'abstract',
                'publisher',
                'publisher_city',
                'year',
                'edition',
                'published_year',
                'cover_path',
                'published_at',
            ]);

        if ($q = $request->query('q')) {
            $query->search((string) $q);
        }

        if ($year = $request->query('year')) {
            $query->where(function (Builder $q) use ($year): void {
                $q->where('year', $year)->orWhere('published_year', $year);
            });
        }

        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        $books = $query->latest('published_at')
            ->paginate(min($request->integer('per_page', 20), 100));

        // Transform cover_path to cover_url using BookStorageService
        $books->getCollection()->transform(function ($book) {
            if ($book->cover_path) {
                // Try S3 first, fallback to Google Drive
                $book->setAttribute('cover_url', $this->storageService->getCoverUrlWithFallback($book, 'medium'));
            } else {
                $book->setAttribute('cover_url', null);
            }
            return $book;
        });

        return response()->json([
            'success' => true,
            'data' => $books,
        ]);
    }

    /**
     * GET /api/v1/books/{id}/cite?format=apa
     */
    public function citeById(int $id, Request $request): JsonResponse
    {
        $book = Book::with(['author', 'citation'])
            ->published()
            ->findOrFail($id);

        $format = strtolower((string) $request->get('format', 'apa'));
        $citation = $this->resolveCitation($book, $format);

        return response()->json([
            'success' => true,
            'data' => [
                'book_id' => $book->id,
                'format' => $format,
                'citation' => $citation,
                'all_formats' => $this->scholarCitationService->generateAll($book),
            ],
        ]);
    }

    /**
     * GET /api/v1/books/{id}/cite/all
     */
    public function citeAll(int $id): JsonResponse
    {
        $book = Book::with(['author', 'citation'])
            ->published()
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'book_id' => $book->id,
                'formats' => $this->scholarCitationService->generateAll($book),
            ],
        ]);
    }

    /**
     * GET /api/v1/books/{id}/cite/download?type=ris|bib
     */
    public function citeDownload(int $id, Request $request): Response|JsonResponse
    {
        $book = Book::with(['author', 'citation'])
            ->published()
            ->findOrFail($id);

        $type = strtolower((string) $request->query('type', 'ris'));
        try {
            $payload = $this->scholarCitationService->generateDownload($book, $type);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $filename = str($book->slug ?: 'book-' . $book->id)->slug()->value() . '-citation.' . $payload['extension'];

        return response($payload['content'], 200, [
            'Content-Type' => $payload['mime'],
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Apply search query (database-agnostic: SQLite dev, PostgreSQL prod).
     */
    private function applySearch(Builder $query, string $search): void
    {
        // Minimum 3 karakter untuk search
        if (strlen($search) < 3) {
            return;
        }

        $query->where(function ($q) use ($search) {
            $driver = config('database.default');

            if ($driver === 'pgsql') {
                // PostgreSQL: gunakan full-text search dengan to_tsvector
                $q->whereRaw(
                    "to_tsvector('indonesian', COALESCE(title, '') || ' ' || COALESCE(description, '')) @@ plainto_tsquery('indonesian', ?)",
                    [$search]
                )
                ->orWhereRaw("isbn::text ILIKE ?", ["%{$search}%"])
                ->orWhereHas('author', fn ($aq) =>
                    $aq->whereRaw("to_tsvector('indonesian', COALESCE(name, '')) @@ plainto_tsquery('indonesian', ?)", [$search])
                );
            } else {
                // SQLite/MySQL: gunakan LOWER() LIKE
                $lower = strtolower($search);
                $q->whereRaw("LOWER(title) LIKE ?", ["%{$lower}%"])
                  ->orWhereRaw("LOWER(description) LIKE ?", ["%{$lower}%"])
                  ->orWhereRaw("LOWER(isbn) LIKE ?", ["%{$lower}%"])
                  ->orWhereHas('author', fn ($aq) =>
                      $aq->whereRaw("LOWER(name) LIKE ?", ["%{$lower}%"])
                  );
            }
        });
    }

    private function resolveCitation(Book $book, string $format): string
    {
        try {
            return $this->scholarCitationService->generate($book, $format);
        } catch (\InvalidArgumentException) {
            return $this->citationService->generate($book, $format);
        }
    }
}

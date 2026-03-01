<?php

namespace App\Observers;

use App\Models\Book;
use App\Services\CatalogCacheService;
use App\Services\CitationService;

class BookObserver
{
    public function __construct(
        private CitationService $citationService,
        private CatalogCacheService $cacheService,
    ) {}

    /**
     * Handle the Book "created" event.
     */
    public function created(Book $book): void
    {
        // Generate citation cache on creation
        $this->citationService->generateAll($book);
        
        // Invalidate catalog cache
        $this->cacheService->invalidateBook($book);
    }

    /**
     * Handle the Book "updated" event.
     * Invalidate citation cache dan catalog cache saat book diupdate.
     */
    public function updated(Book $book): void
    {
        // Invalidate citation cache jika field yang relevan berubah
        if ($book->isDirty(['title', 'published_year', 'isbn', 'author_id'])) {
            $this->citationService->invalidateCache($book);
        }
        
        // Selalu invalidate catalog cache saat book update
        $this->cacheService->invalidateBook($book);
    }

    /**
     * Handle the Book "deleted" event.
     */
    public function deleted(Book $book): void
    {
        $this->citationService->invalidateCache($book);
        $this->cacheService->invalidateBook($book);
    }

    /**
     * Handle the Book "restored" event.
     */
    public function restored(Book $book): void
    {
        $this->citationService->invalidateCache($book);
        $this->cacheService->invalidateBook($book);
    }
}

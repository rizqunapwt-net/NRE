<?php

namespace App\Jobs;

use App\Models\Author;
use App\Models\Book;
use App\Services\PdfParserService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ParsePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 600;

    public function __construct(
        private int $bookId,
        private bool $force = false,
    ) {
        $this->onQueue('parsing');
    }

    public function handle(PdfParserService $parserService): void
    {
        $book = Book::with('author')->find($this->bookId);

        if (! $book || ! $book->pdf_full_path) {
            return;
        }

        if ($book->is_parsed && ! $this->force) {
            return;
        }

        $parsed = $parserService->parse($book->pdf_full_path);

        DB::transaction(function () use ($book, $parsed): void {
            $book->update([
                'subtitle' => $parsed['subtitle'] ?? $book->subtitle,
                'publisher' => $parsed['publisher'] ?? $book->publisher,
                'publisher_city' => $parsed['publisher_city'] ?? $book->publisher_city,
                'year' => $parsed['year'] ?? $book->year,
                'edition' => $parsed['edition'] ?? $book->edition,
                'abstract' => $parsed['abstract'] ?? $book->abstract,
                'full_text' => $parsed['full_text'] ?? $book->full_text,
                'file_path' => $book->pdf_full_path,
                'total_pdf_pages' => $parsed['total_pdf_pages'] ?? $book->total_pdf_pages,
                'bibliography_start_page' => $parsed['bibliography_start_page'] ?? $book->bibliography_start_page,
                'pdf_metadata' => $parsed['pdf_metadata'] ?? $book->pdf_metadata,
                'is_parsed' => true,
                'parsed_at' => now(),
            ]);

            $this->syncAuthorFromPdf($book, $parsed);

            $book->references()->delete();
            foreach ($parsed['references'] ?? [] as $reference) {
                $book->references()->create($reference);
            }

            $this->updateSearchVector($book->id);
        });
    }

    /**
     * Sinkronisasi penulis utama dari metadata PDF.
     * Sistem saat ini menggunakan author_id tunggal.
     */
    private function syncAuthorFromPdf(Book $book, array $parsed): void
    {
        $authors = data_get($parsed, 'pdf_metadata.authors', []);
        if (! is_array($authors) || $authors === []) {
            return;
        }

        $firstAuthor = trim((string) $authors[0]);
        if ($firstAuthor === '') {
            return;
        }

        $author = Author::firstOrCreate(['name' => Str::limit($firstAuthor, 255, '')]);

        if (! $book->author_id) {
            $book->update(['author_id' => $author->id]);
            return;
        }

        $existingAuthorName = Str::lower((string) ($book->author?->name ?? ''));
        if (in_array($existingAuthorName, ['unknown', 'unknown author'], true)) {
            $book->update(['author_id' => $author->id]);
        }
    }

    private function updateSearchVector(int $bookId): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }

        DB::statement(
            "UPDATE books
             SET search_vector = to_tsvector(
                'simple',
                COALESCE(title, '') || ' ' ||
                COALESCE(subtitle, '') || ' ' ||
                COALESCE(abstract, '') || ' ' ||
                COALESCE(full_text, '')
             )
             WHERE id = ?",
            [$bookId]
        );
    }
}


<?php

namespace App\Console\Commands;

use App\Jobs\ParsePdfJob;
use App\Models\Book;
use App\Services\PdfParserService;
use Illuminate\Console\Command;

class ParseBooksCommand extends Command
{
    protected $signature = 'books:parse
        {id? : ID buku tertentu (opsional)}
        {--force : Parse ulang meskipun is_parsed=true}
        {--dry : Simulasi parse tanpa menyimpan ke database}';

    protected $description = 'Parse metadata PDF buku dan sinkronkan ke books + book_references';

    public function handle(PdfParserService $parserService): int
    {
        $bookId = $this->argument('id');
        $force = (bool) $this->option('force');
        $dry = (bool) $this->option('dry');

        $query = Book::query()->whereNotNull('pdf_full_path');

        if ($bookId) {
            $query->whereKey($bookId);
        }

        if (! $force) {
            $query->where(function ($q) {
                $q->where('is_parsed', false)->orWhereNull('is_parsed');
            });
        }

        $books = $query->orderBy('id')->get();

        if ($books->isEmpty()) {
            $this->warn('Tidak ada buku yang perlu diparse.');
            return self::SUCCESS;
        }

        $this->info("Target parse: {$books->count()} buku.");
        if ($dry) {
            $this->warn('Mode DRY RUN aktif. Tidak ada data yang disimpan.');
        }

        $success = 0;
        $failed = 0;

        foreach ($books as $book) {
            try {
                if ($dry) {
                    $payload = $parserService->parse($book->pdf_full_path);
                    $this->line(
                        "ID {$book->id} | {$book->title} | pages=" . ($payload['total_pdf_pages'] ?? 0)
                        . ' | refs=' . count($payload['references'] ?? [])
                    );
                } else {
                    ParsePdfJob::dispatchSync($book->id, $force);
                    $this->line("Parsed book ID {$book->id} ({$book->title})");
                }
                $success++;
            } catch (\Throwable $e) {
                $failed++;
                $this->error("Gagal parse ID {$book->id}: {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->table(
            ['Status', 'Jumlah'],
            [
                ['Berhasil', $success],
                ['Gagal', $failed],
            ]
        );

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}


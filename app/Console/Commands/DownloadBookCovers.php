<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Services\BookStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DownloadBookCovers extends Command
{
    protected $signature = 'library:download-covers
                            {--id= : Specific book ID}
                            {--limit=0 : Limit number of books processed (0 = all)}
                            {--force : Re-download even if cover_path already exists}
                            {--cleanup-missing : Clear cover_path values that point to missing files}
                            {--dry-run : Show what would change without writing files}
                            {--timeout=30 : HTTP timeout in seconds}';
    protected $description = 'Download book covers from external URLs (WordPress) to local storage';

    public function __construct(
        private BookStorageService $storageService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $timeout = max(5, (int) ($this->option('timeout') ?: config('books.cover_download_timeout', 30)));

        if ($this->option('cleanup-missing')) {
            $summary = $this->storageService->cleanupMissingCoverPaths($dryRun);
            $this->renderCleanupSummary($summary, $dryRun);
        }

        $query = Book::query()
            ->whereNotNull('google_drive_cover_url')
            ->where('google_drive_cover_url', '!=', '');

        if ($this->option('id')) {
            $query->where('id', $this->option('id'));
        }

        if (! $force) {
            $query->where(function ($builder): void {
                $builder->whereNull('cover_path')
                    ->orWhere('cover_path', '');
            });
        }

        $limit = (int) $this->option('limit');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $books = $query->get();

        if ($books->isEmpty()) {
            $this->info('No books need cover downloads.');
            return 0;
        }

        $this->info("Found {$books->count()} books to process.");
        $bar = $this->output->createProgressBar($books->count());
        $bar->start();

        $downloaded = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($books as $book) {
            $result = $this->downloadCover($book, $dryRun, $force, $timeout);

            if ($result['status'] === 'downloaded') {
                $downloaded++;
            } elseif ($result['status'] === 'failed') {
                $failed++;
                $this->newLine();
                $this->warn("Book #{$book->id} failed: {$result['message']}");
            } else {
                $skipped++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->table(
            ['Status', 'Jumlah'],
            [
                ['Downloaded', $downloaded],
                ['Skipped', $skipped],
                ['Failed', $failed],
            ]
        );
        $this->info($dryRun ? 'Dry-run cover download completed.' : 'Cover download process completed.');

        return 0;
    }

    private function downloadCover(Book $book, bool $dryRun, bool $force, int $timeout): array
    {
        $url = trim((string) $book->google_drive_cover_url);
        if (! filter_var($url, FILTER_VALIDATE_URL)) {
            return ['status' => 'skipped', 'message' => 'invalid cover URL'];
        }

        if (! $force && $book->cover_path && $this->storageService->coverExists($book->cover_path)) {
            return ['status' => 'skipped', 'message' => 'cover already exists'];
        }

        $filename = $this->buildFileName($book, $url, null);
        if ($dryRun) {
            return ['status' => 'downloaded', 'message' => "would store {$filename}"];
        }

        try {
            $response = Http::timeout($timeout)
                ->retry(2, 500, throw: false)
                ->withHeaders([
                    'Accept' => 'image/*,*/*;q=0.8',
                    'User-Agent' => 'NRE Cover Downloader/1.0',
                ])
                ->get($this->normalizeDownloadUrl($url));

            if (! $response->successful() || $response->body() === '') {
                return ['status' => 'failed', 'message' => 'http ' . $response->status()];
            }

            $filename = $this->buildFileName($book, $url, $response->header('Content-Type'));
            Storage::disk('public')->put($filename, $response->body());

            if ($book->cover_path && $book->cover_path !== $filename && Storage::disk('public')->exists($book->cover_path)) {
                Storage::disk('public')->delete($book->cover_path);
            }

            $book->update(['cover_path' => $filename]);

            return ['status' => 'downloaded', 'message' => $filename];
        } catch (\Throwable $exception) {
            return ['status' => 'failed', 'message' => $exception->getMessage()];
        }
    }

    private function normalizeDownloadUrl(string $url): string
    {
        if (! str_contains($url, 'drive.google.com')) {
            return $url;
        }

        if (preg_match('~/file/d/([^/]+)~', $url, $matches) === 1) {
            return 'https://drive.google.com/uc?export=download&id=' . $matches[1];
        }

        $query = parse_url($url, PHP_URL_QUERY);
        if ($query) {
            parse_str($query, $params);
            if (! empty($params['id'])) {
                return 'https://drive.google.com/uc?export=download&id=' . $params['id'];
            }
        }

        return $url;
    }

    private function buildFileName(Book $book, string $url, ?string $contentType): string
    {
        $slug = $book->slug ?: Str::slug($book->title) ?: 'book-' . $book->id;
        $extension = $this->detectExtension($url, $contentType);

        return "covers/{$slug}-{$book->id}.{$extension}";
    }

    private function detectExtension(string $url, ?string $contentType): string
    {
        $pathExtension = strtolower((string) pathinfo((string) parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION));
        if (in_array($pathExtension, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            return $pathExtension === 'jpeg' ? 'jpg' : $pathExtension;
        }

        $contentType = strtolower((string) $contentType);
        if (str_contains($contentType, 'image/png')) {
            return 'png';
        }
        if (str_contains($contentType, 'image/webp')) {
            return 'webp';
        }
        if (str_contains($contentType, 'image/gif')) {
            return 'gif';
        }

        return 'jpg';
    }

    private function renderCleanupSummary(array $summary, bool $dryRun): void
    {
        $this->info($dryRun ? 'Cleanup dry-run completed.' : 'Cleanup missing cover_path completed.');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Checked', $summary['checked']],
                ['Valid', $summary['valid']],
                ['External URLs', $summary['external']],
                ['Missing', $summary['missing']],
                ['Cleared', $summary['cleared']],
            ]
        );
    }
}

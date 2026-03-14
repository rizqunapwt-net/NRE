<?php

namespace App\Jobs;

use App\Models\Book;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class GenerateCoverThumbnails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    private array $fallbackSizes = [
        'large'  => [800, 1200],
        'medium' => [400, 600],
        'thumb'  => [200, 300],
    ];

    public function __construct(
        private Book   $book,
        private string $originalPath,
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $disk    = (string) config('books.disk', 'books');
        $manager = new ImageManager(new Driver());
        $sourceDisk = Storage::disk($disk)->exists($this->originalPath) ? $disk : 'public';

        if (! Storage::disk($sourceDisk)->exists($this->originalPath)) {
            Log::warning("GenerateCoverThumbnails skipped for book {$this->book->id}: original cover missing at {$this->originalPath}");
            return;
        }

        $originalContent = Storage::disk($sourceDisk)->get($this->originalPath);
        $sizes = config('books.cover_sizes', $this->fallbackSizes);

        foreach ($sizes as $sizeName => [$width, $height]) {
            $resized = $manager->read($originalContent)->cover($width, $height);

            $path = "covers/{$sizeName}/{$this->book->id}_{$sizeName}.jpg";

            Storage::disk($disk)->put(
                $path,
                $resized->toJpeg(85)->toString(),
                ['visibility' => 'private']
            );
        }
    }

    /**
     * Handler ketika job gagal setelah semua percobaan.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GenerateCoverThumbnails failed for book {$this->book->id}: {$exception->getMessage()}");
    }
}

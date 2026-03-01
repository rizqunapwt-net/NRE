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

    private array $sizes = [
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
        $disk    = 'books';
        $manager = new ImageManager(new Driver());

        // Download original dari storage
        $originalContent = Storage::disk($disk)->get($this->originalPath);
        $image           = $manager->read($originalContent);

        foreach ($this->sizes as $sizeName => [$width, $height]) {
            $resized = clone $image;
            $resized->cover($width, $height);

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

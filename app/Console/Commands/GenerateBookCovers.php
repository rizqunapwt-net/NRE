<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Services\BookStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateBookCovers extends Command
{
    protected $signature = 'books:generate-covers {--limit=100}';
    protected $description = 'Generate placeholder book covers for books without covers';

    public function __construct(
        private BookStorageService $storageService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $limit = $this->option('limit');
        
        $books = Book::whereNull('cover_path')
            ->published()
            ->limit($limit)
            ->get();

        $this->info("Generating covers for {$books->count()} books...");

        foreach ($books as $book) {
            try {
                // Create a simple placeholder cover as PNG
                $width = 300;
                $height = 450;
                $color = $this->getColorByCategory($book->category);
                
                // Convert hex to RGB
                $rgb = sscanf($color, "#%02x%02x%02x");
                
                // Create image using GD directly
                $image = imagecreatetruecolor($width, $height);
                $bgColor = imagecolorallocate($image, $rgb[0], $rgb[1], $rgb[2]);
                imagefill($image, 0, 0, $bgColor);
                
                // Save temporarily
                $tempPath = storage_path('temp/cover_' . $book->id . '.png');
                @mkdir(storage_path('temp'), 0755, true);
                imagepng($image, $tempPath);
                imagedestroy($image);

                // Store in S3/MinIO using file system
                $fileContent = file_get_contents($tempPath);
                $path = 'covers/original/cover_' . $book->id . '.png';
                
                \Illuminate\Support\Facades\Storage::disk('books')
                    ->put($path, $fileContent);

                $book->update(['cover_path' => $path]);

                @unlink($tempPath);

                $this->line("✓ Generated cover for: {$book->title}");
            } catch (\Exception $e) {
                $this->error("✗ Failed to generate cover for {$book->title}: " . $e->getMessage());
                Log::error("Cover generation failed for book {$book->id}", ['error' => $e->getMessage()]);
            }
        }

        $this->info('Cover generation complete!');
        return Command::SUCCESS;
    }

    /**
     * Get a color based on book category for visual variety
     */
    private function getColorByCategory(?object $category): string
    {
        $colors = [
            '#E8642B', // Orange - Edukasi
            '#2196F3', // Blue - Fiksi
            '#4CAF50', // Green - Sains
            '#FF5722', // Deep Orange - Bisnis
            '#9C27B0', // Purple - Teknologi
            '#00BCD4', // Cyan - Default
        ];

        if (!$category) {
            return $colors[5];
        }

        $hash = crc32($category->name);
        $index = abs($hash) % count($colors);

        return $colors[$index];
    }
}

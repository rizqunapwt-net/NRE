<?php

namespace App\Console\Commands;

use App\Models\Book;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DownloadBookCovers extends Command
{
    protected $signature = 'library:download-covers {--id= : Specific book ID}';
    protected $description = 'Download book covers from external URLs (WordPress) to local storage';

    public function handle()
    {
        $query = Book::whereNotNull('google_drive_cover_url')
                    ->whereNull('cover_path');

        if ($this->option('id')) {
            $query->where('id', $this->option('id'));
        }

        $books = $query->get();

        if ($books->isEmpty()) {
            $this->info('No books need cover downloads.');
            return 0;
        }

        $this->info("Found {$books->count()} books to download covers for.");
        $bar = $this->output->createProgressBar($books->count());
        $bar->start();

        foreach ($books as $book) {
            $url = $book->google_drive_cover_url;
            
            // Skip if not a valid URL
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                $bar->advance();
                continue;
            }

            try {
                $response = Http::timeout(30)->get($url);

                if ($response->successful()) {
                    $extension = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
                    $filename = 'covers/' . Str::slug($book->title) . '-' . $book->id . '.' . $extension;
                    
                    Storage::disk('public')->put($filename, $response->body());
                    
                    $book->update([
                        'cover_path' => $filename
                    ]);
                }
            } catch (\Exception $e) {
                // Silently fail for individual books
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Cover download process completed.');

        return 0;
    }
}

<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KatalogSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('seeders/katalog_data.json');

        if (! file_exists($jsonPath)) {
            $this->command->error("katalog_data.json not found at: {$jsonPath}");

            return;
        }

        $items = json_decode(file_get_contents($jsonPath), true);
        $this->command->info('Importing '.count($items).' books from Katalog Rizquna...');

        $authorCache = []; // name => Author model
        $bookCount = 0;
        $authorCount = 0;

        foreach ($items as $item) {
            // --- Create or find Author ---
            $authorName = trim($item['author_name'] ?? '');
            if (empty($authorName)) {
                continue;
            }

            $authorKey = mb_strtolower($authorName);

            if (! isset($authorCache[$authorKey])) {
                $author = Author::where('name', $authorName)->first();

                if (! $author) {
                    $author = Author::create([
                        'name' => $authorName,
                        'phone' => $item['phone'] ?? null,
                        'status' => 'active',
                    ]);
                    $authorCount++;
                } elseif (empty($author->phone) && ! empty($item['phone'])) {
                    // Update phone if previously empty
                    $author->update(['phone' => $item['phone']]);
                }

                $authorCache[$authorKey] = $author;
            }

            $author = $authorCache[$authorKey];

            // --- Create Book (skip if ISBN already exists) ---
            $isbn = trim($item['isbn'] ?? '');

            if (! empty($isbn) && Book::where('isbn', $isbn)->exists()) {
                continue; // Skip duplicate ISBN
            }

            $book = Book::create([
                'type' => 'publishing',
                'author_id' => $author->id,
                'title' => $item['title'],
                'isbn' => $isbn ?: null,
                'price' => ($item['price'] && $item['price'] > 0) ? $item['price'] : 50000, // Default price if 0
                'stock' => 100,
                'status' => 'published',
                'is_published' => true,
                'is_digital' => true,
                'published_at' => now(),
                'page_count' => $item['pages'] ?? null,
                'size' => $item['size'] ?? null,
                'published_year' => $item['year'] ?? null,
                'publisher' => $item['publisher'] ?? 'Rizquna Elfath',
                'publisher_city' => 'Cirebon',
                'description' => $item['title'] . ' karya ' . $authorName . '. Buku ini diterbitkan oleh Rizquna.',
                'tracking_code' => 'NRE-'.strtoupper(Str::random(8)),
            ]);

            // Check if actual file exists for this ID and link them
            $idFolderPath = $book->id . '/';
            $storageRoot = storage_path('app/private/books/');

            // 1. Cover
            $coverPath = $idFolderPath . 'cover_' . $book->id . '.png';
            if (file_exists($storageRoot . $coverPath)) {
                $book->update(['cover_path' => $coverPath]);
            }

            // 2. Full PDF
            $fullPdfPath = $idFolderPath . 'full_' . $book->id . '.pdf';
            if (file_exists($storageRoot . $fullPdfPath)) {
                $book->update(['pdf_full_path' => $fullPdfPath]);
            }

            // 3. Preview PDF (usually first 10 pages, if exist)
            $previewPdfPath = $idFolderPath . 'preview_' . $book->id . '.pdf';
            if (file_exists($storageRoot . $previewPdfPath)) {
                $book->update(['pdf_preview_path' => $previewPdfPath]);
            }

            $bookCount++;
        }

        $this->command->info("✅ Import selesai: {$bookCount} buku, {$authorCount} penulis baru");
    }
}

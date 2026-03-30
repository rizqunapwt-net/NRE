<?php

namespace Database\Seeders;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class RealBooksSeeder extends Seeder
{
    public function run(): void
    {
        $contentPath = '/tmp/nre_extract/NRE Books/Katalog NRE Books.xlsx';
        $metaPath = '/tmp/nre_extract/NRE Books/Katalog Rizquna.xlsx';
        
        if (!file_exists($contentPath)) {
            $this->command->error("Excel file not found at $contentPath");
            return;
        }

        $reader = IOFactory::createReader('Xlsx');
        
        // Load Meta Data first
        $metaLookup = [];
        if (file_exists($metaPath)) {
            $metaSpreadsheet = $reader->load($metaPath);
            $metaData = $metaSpreadsheet->getActiveSheet()->toArray();
            array_shift($metaData); // header
            foreach ($metaData as $row) {
                if (!empty($row[0])) {
                    $metaLookup[$row[0]] = [
                        'category' => $row[7] ?? '',
                        'size' => $row[8] ?? '',
                        'pages' => $row[9] ?? '',
                        'marketplace_url' => $row[19] ?? '', // Shopee link
                        'year' => $row[5] ?? '2026',
                    ];
                }
            }
        }

        $spreadsheet = $reader->load($contentPath);
        $data = $spreadsheet->getActiveSheet()->toArray();
        array_shift($data); // header
        
        $admin = User::where('username', 'admin')->first();
        
        $count = 0;
        foreach ($data as $row) {
            if (empty($row[1])) continue;

            $no = trim($row[0]);
            $noPad = str_pad($no, 2, '0', STR_PAD_LEFT);
            $title = trim($row[1]);
            
            // Clean author name: remove "penulis, " prefix if exists
            $authorRaw = $row[2] ?? '';
            $authorRaw = str_replace('penulis, ', '', $authorRaw);
            $authorNames = explode(',', $authorRaw);
            $primaryAuthorName = trim($authorNames[0]);
            
            $isbn = trim($row[3] ?? '');
            $price = floatval($row[4] ?? 0);
            $description = trim($row[5] ?? '');

            $meta = $metaLookup[$no] ?? [];

            // Find or create category
            $categoryName = !empty($meta['category']) ? $meta['category'] : 'Pendidikan';
            $category = Category::firstOrCreate(
                ['slug' => Str::slug($categoryName)],
                ['name' => $categoryName]
            );

            $author = Author::firstOrCreate(
                ['name' => $primaryAuthorName],
                [
                    'email' => Str::slug($primaryAuthorName) . '@rizquna.com',
                    'status' => 'active',
                ]
            );

            $coverFile = $this->findFile("/Users/macm4/Documents/Projek/NRE/storage/app/public/books/covers", $noPad);
            $pdfFile = $this->findFile("/Users/macm4/Documents/Projek/NRE/storage/app/public/books/pdfs", $noPad);

            $marketplaceLinks = [];
            if (!empty($meta['marketplace_url'])) {
                $marketplaceLinks[] = [
                    'marketplace_name' => 'Shopee',
                    'product_url' => $meta['marketplace_url']
                ];
            }

            // Unset slug to let model generate a unique one if it's a new record
            // or if we want to ensure it doesn't crash on existing slug.
            // Actually, we'll try to find by ISBN first if it exists, else Title.
            $book = null;
            if (!empty($isbn)) {
                $book = Book::where('isbn', $isbn)->first();
            }
            if (!$book) {
                $book = Book::where('title', $title)->first();
            }
            
            $bookData = [
                'type' => 'publishing',
                'author_id' => $author->id,
                'category_id' => $category->id,
                'title' => $title,
                'isbn' => $isbn,
                'description' => $description,
                'price' => $price,
                'stock' => rand(100, 500),
                'status' => 'published',
                'is_published' => true,
                'published_at' => now(),
                'published_year' => 2026,
                'page_count' => intval($meta['pages'] ?? 0),
                'size' => $meta['size'] ?? 'A5',
                'publisher' => 'Rizquna Pustaka',
                'publisher_city' => 'Cirebon',
                'cover_path' => $coverFile ? "books/covers/" . basename($coverFile) : null,
                'pdf_full_path' => $pdfFile ? "books/pdfs/" . basename($pdfFile) : null,
                'is_digital' => !empty($pdfFile),
            ];

            if ($book) {
                // Keep the old slug if it exists to preserve links
                $book->update($bookData);
            } else {
                $bookData['slug'] = Str::slug($title);
                // Ensure unique slug manually if needed, but model handles it mostly.
                if (Book::where('slug', $bookData['slug'])->exists()) {
                    $bookData['slug'] .= '-' . rand(1000, 9999);
                }
                $book = Book::create($bookData);
            }

            $count++;
        }

        $this->command->info("Successfully seeded $count real books.");
    }

    private function findFile($dir, $no)
    {
        if (!is_dir($dir)) return null;
        $files = scandir($dir);
        foreach ($files as $file) {
            if (str_starts_with($file, $no . " -")) {
                return $dir . "/" . $file;
            }
        }
        return null;
    }
}

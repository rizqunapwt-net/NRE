<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ImportExcelFromDrive extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'sheets:import 
                            {--file-id= : Google Drive file ID}
                            {--preview : Preview without importing}';

    /**
     * The console command description.
     */
    protected $description = 'Import books from Excel file on Google Drive';

    public function handle(): int
    {
        $this->info('═══════════════════════════════════════════');
        $this->info('📊 Excel Import - Google Drive');
        $this->info('═══════════════════════════════════════════');
        $this->newLine();

        // File ID dari spreadsheet yang di-share
        $fileId = $this->option('file-id') ?: '1yTahG4BuDuZs1a4lsm5dtCSM7Av_ijd5';
        
        $this->info("File ID: {$fileId}");
        $this->newLine();

        // Download file Excel dari Google Drive
        $this->info('1. Downloading Excel file from Google Drive...');
        
        $downloadUrl = "https://docs.google.com/spreadsheets/d/{$fileId}/export?format=xlsx";
        
        try {
            $response = Http::withOptions([
                'verify' => false,
            ])->get($downloadUrl);

            if ($response->status() !== 200) {
                $this->error('   ✗ Failed to download file');
                $this->error('   Make sure file is shared publicly or to service account');
                return Command::FAILURE;
            }

            // Save temporary file
            $tempPath = storage_path('app/temp/katalog.xlsx');
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0777, true);
            }
            
            file_put_contents($tempPath, $response->body());
            
            $this->info('   ✓ File downloaded successfully');
            $this->info("   Saved to: {$tempPath}");
            $this->newLine();

        } catch (\Exception $e) {
            $this->error('   ✗ Error downloading: ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Parse Excel file
        $this->info('2. Parsing Excel file...');
        
        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tempPath);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            if (empty($rows)) {
                $this->error('   ✗ No data found in Excel file');
                return Command::FAILURE;
            }

            $this->info("   ✓ Found " . count($rows) . " rows");
            $this->newLine();

            // Skip header row
            $header = array_shift($rows);
            
            // Preview mode
            if ($this->option('preview')) {
                $this->info('3. Preview (first 5 books):');
                $this->newLine();
                
                $this->table(
                    array_map(fn($h) => substr($h ?? '', 0, 20), $header),
                    array_slice($rows, 0, 5)
                );
                
                $this->warn('Preview mode - no data imported');
                unlink($tempPath);
                return Command::SUCCESS;
            }

            // Import to database
            $this->info('3. Importing to database...');
            
            $created = 0;
            $updated = 0;
            $errors = 0;
            
            foreach ($rows as $index => $row) {
                try {
                    // Skip empty rows
                    if (empty($row[0])) {
                        continue;
                    }

                    // Map columns based on Excel structure:
                    // NO | JUDUL BUKU | PENULIS | ISBN | HARGA | DESKRIPSI | ID_Cover_Drive | ID_PDF_Drive
                    $title = $row[1] ?? ''; // JUDUL BUKU (column B, index 1)
                    $author = $row[2] ?? ''; // PENULIS (column C, index 2)
                    $isbn = $row[3] ?? ''; // ISBN (column D, index 3)
                    $price = $row[4] ?? ''; // HARGA (column E, index 4)
                    $abstract = $row[5] ?? ''; // DESKRIPSI (column F, index 5)
                    $publisher = 'Penerbit Rizquna Elfath'; // Default publisher
                    $year = '2024'; // Default year
                    $category = 'Umum'; // Default category
                    
                    if (empty($title)) {
                        continue;
                    }

                    // Find or create author
                    $authorModel = \App\Models\Author::firstOrCreate(
                        ['name' => $author ?: 'Unknown Author']
                    );

                    // Find or create category
                    $categoryModel = null;
                    if (!empty($category)) {
                        $categoryModel = \App\Models\Category::firstOrCreate(
                            ['name' => $category]
                        );
                    }

                    // Generate slug
                    $slug = Str::slug($title) ?: 'book-' . time();
                    
                    // Check if exists
                    $existing = null;
                    if (!empty($isbn)) {
                        $existing = \App\Models\Book::where('isbn', $isbn)->first();
                    }
                    
                    if (!$existing) {
                        $existing = \App\Models\Book::where('slug', $slug)->first();
                    }

                    if ($existing) {
                        // Update
                        $existing->update([
                            'title' => $title,
                            'subtitle' => null,
                            'author_id' => $authorModel->id,
                            'category_id' => $categoryModel?->id,
                            'isbn' => $isbn ?: null,
                            'publisher' => $publisher ?: null,
                            'year' => $year ?: null,
                            'published_year' => $year ?: null,
                            'abstract' => $abstract ?: null,
                            'price' => str_replace('.', '', str_replace(',', '.', $price)) ?: null,
                            'is_published' => true,
                            'is_digital' => true,
                        ]);
                        $updated++;
                    } else {
                        // Create
                        \App\Models\Book::create([
                            'type' => 'publishing',
                            'title' => $title,
                            'subtitle' => null,
                            'slug' => $slug,
                            'author_id' => $authorModel->id,
                            'category_id' => $categoryModel?->id,
                            'isbn' => $isbn ?: null,
                            'publisher' => $publisher ?: null,
                            'year' => $year ?: null,
                            'published_year' => $year ?: null,
                            'abstract' => $abstract ?: null,
                            'price' => str_replace('.', '', str_replace(',', '.', $price)) ?: null,
                            'is_published' => true,
                            'is_digital' => true,
                        ]);
                        $created++;
                    }
                    
                } catch (\Exception $e) {
                    $this->error("   Row " . ($index + 2) . ": " . $e->getMessage());
                    $errors++;
                }
            }
            
            $this->newLine();
            $this->info('═══════════════════════════════════════════');
            $this->info('✅ Import Complete!');
            $this->info('═══════════════════════════════════════════');
            $this->info("   ➕ Created: {$created}");
            $this->info("   🔄 Updated: {$updated}");
            $this->info("   ⚠️  Errors: {$errors}");
            $this->info('═══════════════════════════════════════════');
            
            // Cleanup
            unlink($tempPath);

        } catch (\Exception $e) {
            $this->error('   ✗ Error parsing Excel: ' . $e->getMessage());
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}

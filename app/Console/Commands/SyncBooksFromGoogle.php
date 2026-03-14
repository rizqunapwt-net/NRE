<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SyncBooksFromGoogle extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'books:sync-google 
                            {--sheets-id=1yTahG4BuDuZs1a4lsm5dtCSM7Av_ijd5 : Google Sheets ID}
                            {--covers-folder=1taHQpDDNGm58RYnEOvAnfX4pLC4L5BoF : Google Drive Covers Folder ID}
                            {--pdfs-folder=1KCvyGY86FQZeh99et_1MNHNWZJ7nr7St : Google Drive PDFs Folder ID}
                            {--preview : Preview without importing}
                            {--force : Force re-import}';

    /**
     * The console command description.
     */
    protected $description = 'Sync books from Google Sheets with covers and PDFs from Google Drive';

    protected GoogleDriveService $driveService;

    public function handle(GoogleDriveService $driveService): int
    {
        $this->driveService = $driveService;
        
        $sheetsId = $this->option('sheets-id');
        $coversFolderId = $this->option('covers-folder');
        $pdfsFolderId = $this->option('pdfs-folder');

        $this->info('═══════════════════════════════════════════');
        $this->info('📚 Google Books Sync - Full Integration');
        $this->info('═══════════════════════════════════════════');
        $this->newLine();

        $this->info("📊 Sheets ID: {$sheetsId}");
        $this->info("📁 Covers Folder: {$coversFolderId}");
        $this->info("📄 PDFs Folder: {$pdfsFolderId}");
        $this->newLine();

        // Step 1: Get files from Google Drive folders
        $this->info('1. Fetching covers from Google Drive...');
        $covers = $this->getFilesFromFolder($coversFolderId);
        $this->info("   ✓ Found " . count($covers) . " cover files");
        
        $this->newLine();
        $this->info('2. Fetching PDFs from Google Drive...');
        $pdfs = $this->getFilesFromFolder($pdfsFolderId);
        $this->info("   ✓ Found " . count($pdfs) . " PDF files");
        $this->newLine();

        // Step 2: Download and parse Google Sheets
        $this->info('3. Downloading book data from Google Sheets...');
        $downloadUrl = "https://docs.google.com/spreadsheets/d/{$sheetsId}/export?format=xlsx";
        
        try {
            $response = Http::withOptions(['verify' => false])->get($downloadUrl);
            
            if ($response->status() !== 200) {
                $this->error('   ✗ Failed to download spreadsheet');
                return Command::FAILURE;
            }

            $tempPath = storage_path('app/temp/katalog.xlsx');
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0777, true);
            }
            
            file_put_contents($tempPath, $response->body());
            $this->info('   ✓ Spreadsheet downloaded');
            
        } catch (\Exception $e) {
            $this->error('   ✗ Error: ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Parse Excel
        try {
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tempPath);
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();
            
            // Skip header
            array_shift($rows);
            
            $this->info('   ✓ Parsed ' . count($rows) . ' books');
            
        } catch (\Exception $e) {
            $this->error('   ✗ Error parsing Excel: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->newLine();

        // Preview mode
        if ($this->option('preview')) {
            $this->info('4. Preview (first 5 books):');
            $this->newLine();
            
            $previewData = [];
            foreach (array_slice($rows, 0, 5) as $index => $row) {
                $title = $row[1] ?? '';
                $author = $row[2] ?? '';
                $isbn = $row[3] ?? '';
                
                // Find matching cover and PDF
                $cover = $this->findMatchingFile($covers, $title, $author, $isbn);
                $pdf = $this->findMatchingFile($pdfs, $title, $author, $isbn);
                
                $previewData[] = [
                    'No' => $index + 1,
                    'Title' => Str::limit($title, 50),
                    'Author' => Str::limit($author ?? '', 30),
                    'Cover' => $cover ? '✓' : '✗',
                    'PDF' => $pdf ? '✓' : '✗',
                ];
            }
            
            $this->table(['No', 'Title', 'Author', 'Cover', 'PDF'], $previewData);
            
            $this->warn('Preview mode - no data imported');
            unlink($tempPath);
            return Command::SUCCESS;
        }

        // Import to database
        $this->info('4. Importing to database...');
        
        $created = 0;
        $updated = 0;
        $errors = 0;
        $withCover = 0;
        $withPdf = 0;
        
        foreach ($rows as $index => $row) {
            try {
                // Skip empty rows
                $title = $row[1] ?? '';
                if (empty($title)) {
                    continue;
                }

                $author = $row[2] ?? '';
                $isbn = $row[3] ?? '';
                $price = $row[4] ?? '';
                $abstract = $row[5] ?? '';
                
                // Find matching cover and PDF
                $coverFile = $this->findMatchingFile($covers, $title, $author, $isbn);
                $pdfFile = $this->findMatchingFile($pdfs, $title, $author, $isbn);
                
                // Find or create author
                $authorModel = \App\Models\Author::firstOrCreate(
                    ['name' => $author ?: 'Unknown Author']
                );

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

                if ($existing && !$this->option('force')) {
                    // Skip if exists and not forcing
                    $updated++;
                    continue;
                }

                if ($existing) {
                    // Update
                    $existing->update([
                        'title' => $title,
                        'author_id' => $authorModel->id,
                        'isbn' => $isbn ?: null,
                        'abstract' => $abstract ?: null,
                        'price' => $this->parsePrice($price),
                        'is_published' => true,
                        'is_digital' => true,
                        'google_drive_cover_id' => $coverFile['id'] ?? null,
                        'google_drive_pdf_id' => $pdfFile['id'] ?? null,
                    ]);
                } else {
                    // Create
                    \App\Models\Book::create([
                        'type' => 'publishing',
                        'title' => $title,
                        'slug' => $slug,
                        'author_id' => $authorModel->id,
                        'isbn' => $isbn ?: null,
                        'abstract' => $abstract ?: null,
                        'price' => $this->parsePrice($price),
                        'is_published' => true,
                        'is_digital' => true,
                        'google_drive_cover_id' => $coverFile['id'] ?? null,
                        'google_drive_pdf_id' => $pdfFile['id'] ?? null,
                    ]);
                }
                
                $created++;
                if ($coverFile) $withCover++;
                if ($pdfFile) $withPdf++;
                
            } catch (\Exception $e) {
                $this->error("   Row " . ($index + 2) . ": " . $e->getMessage());
                $errors++;
            }
        }
        
        $this->newLine();
        $this->info('═══════════════════════════════════════════');
        $this->info('✅ Sync Complete!');
        $this->info('═══════════════════════════════════════════');
        $this->info("   ➕ Created: {$created}");
        $this->info("   🔄 Updated: {$updated}");
        $this->info("   ⚠️  Errors: {$errors}");
        $this->info("   📚 With Cover: {$withCover}");
        $this->info("   📄 With PDF: {$withPdf}");
        $this->info('═══════════════════════════════════════════');
        
        // Cleanup
        if (file_exists($tempPath)) {
            unlink($tempPath);
        }

        return Command::SUCCESS;
    }

    /**
     * Get files from Google Drive folder
     */
    protected function getFilesFromFolder(string $folderId): array
    {
        try {
            $files = $this->driveService->listFiles($folderId, 1000);
            
            // Map files by name for easier matching
            $mapped = [];
            foreach ($files as $file) {
                $name = $file['name'];
                $mapped[$name] = $file;
            }
            
            return $mapped;
            
        } catch (\Exception $e) {
            $this->error('   Warning: Could not fetch folder: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Find matching file by title, author, or ISBN
     */
    protected function findMatchingFile(array $files, string $title, ?string $author, ?string $isbn): ?array
    {
        // Try ISBN first (most accurate)
        if (!empty($isbn)) {
            foreach ($files as $name => $file) {
                if (stripos($name, $isbn) !== false) {
                    return $file;
                }
            }
        }
        
        // Try title
        $titleKeywords = explode(':', Str::limit($title, 30, ''));
        $titleKeywords = array_filter(array_map('trim', $titleKeywords));
        
        foreach ($titleKeywords as $keyword) {
            if (strlen($keyword) < 3) continue;
            
            foreach ($files as $name => $file) {
                if (stripos($name, $keyword) !== false) {
                    return $file;
                }
            }
        }
        
        // Try author + title words
        if (!empty($author)) {
            $authorLast = explode(' ', $author);
            $authorLast = end($authorLast);
            
            foreach ($files as $name => $file) {
                if (stripos($name, $authorLast) !== false) {
                    return $file;
                }
            }
        }
        
        return null;
    }

    /**
     * Parse price from Excel format
     */
    protected function parsePrice($price): ?float
    {
        if (empty($price)) {
            return null;
        }
        
        // Handle formats like "25000.000" or "25,000.00"
        $price = str_replace(',', '', (string) $price);
        $price = str_replace('.', '', $price);
        
        return (float) $price / 1000; // Convert from thousands
    }
}

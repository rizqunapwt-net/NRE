<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncBooksToGoogleDrive extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'books:sync-drive 
                            {--book= : Sync specific book by ID}
                            {--force : Force re-upload even if already synced}
                            {--dry-run : Show what would be synced without uploading}';

    /**
     * The console command description.
     */
    protected $description = 'Sync books (covers and PDFs) to Google Drive';

    protected GoogleDriveService $driveService;

    public function handle(GoogleDriveService $driveService): int
    {
        $this->driveService = $driveService;

        $this->info('📚 Starting Google Drive Sync for Books...');
        $this->newLine();

        // Get specific book or all books
        $bookId = $this->option('book');
        $books = $bookId 
            ? Book::where('id', $bookId)->get()
            : Book::whereNotNull('cover_path')
                ->orWhereNotNull('pdf_path')
                ->get();

        if ($books->isEmpty()) {
            $this->warn('No books found with files to sync.');
            return Command::SUCCESS;
        }

        $this->info("Found {$books->count()} book(s) to sync.");
        $this->newLine();

        $success = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($books as $book) {
            $this->line("📖 Processing: {$book->title} (ID: {$book->id})");
            
            try {
                $result = $this->syncBook($book);
                
                if ($result === 'skipped') {
                    $this->warn('   ⏭️  Skipped (already synced)');
                    $skipped++;
                } else {
                    $this->info('   ✅ Synced successfully');
                    $success++;
                }
            } catch (\Exception $e) {
                $this->error('   ❌ Failed: ' . $e->getMessage());
                $failed++;
            }

            $this->newLine();
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════');
        $this->info('📊 Sync Summary:');
        $this->info("   ✅ Success: {$success}");
        $this->info("   ⏭️  Skipped: {$skipped}");
        $this->error("   ❌ Failed: {$failed}");
        $this->info('═══════════════════════════════════════════');

        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Sync a single book to Google Drive
     */
    protected function syncBook(Book $book): string
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');
        $updated = false;

        // Sync cover
        if ($book->cover_path) {
            $coverSynced = $this->syncCover($book, $dryRun, $force);
            if ($coverSynced) {
                $updated = true;
            }
        }

        // Sync PDF
        if ($book->pdf_path) {
            $pdfSynced = $this->syncPdf($book, $dryRun, $force);
            if ($pdfSynced) {
                $updated = true;
            }
        }

        return $updated ? 'synced' : 'skipped';
    }

    /**
     * Sync book cover to Google Drive
     */
    protected function syncCover(Book $book, bool $dryRun = false, bool $force = false): bool
    {
        // Check if already synced
        if (!$force && $book->google_drive_cover_id) {
            // Verify file still exists
            try {
                $this->driveService->getFileInfo($book->google_drive_cover_id);
                $this->line('   Cover already synced ✓');
                return false;
            } catch (\Exception $e) {
                $this->line('   Cover file not found in Drive, re-uploading...');
                // File was deleted, will re-upload
            }
        }

        $localPath = Storage::disk('books')->path($book->cover_path);
        
        if (!file_exists($localPath)) {
            throw new \Exception("Cover file not found: {$localPath}");
        }

        if ($dryRun) {
            $this->line('   [DRY RUN] Would upload cover: ' . basename($book->cover_path));
            return true;
        }

        $this->line('   ↑ Uploading cover to Google Drive...');
        
        $result = $this->driveService->uploadBookCover(
            $localPath,
            $book->slug,
            pathinfo($book->cover_path, PATHINFO_EXTENSION)
        );

        $book->update([
            'google_drive_cover_id' => $result['id'],
            'google_drive_cover_url' => $result['webViewLink'],
        ]);

        $this->line('   ✓ Cover uploaded: ' . $result['webViewLink']);
        return true;
    }

    /**
     * Sync book PDF to Google Drive
     */
    protected function syncPdf(Book $book, bool $dryRun = false, bool $force = false): bool
    {
        // Check if already synced
        if (!$force && $book->google_drive_pdf_id) {
            // Verify file still exists
            try {
                $this->driveService->getFileInfo($book->google_drive_pdf_id);
                $this->line('   PDF already synced ✓');
                return false;
            } catch (\Exception $e) {
                $this->line('   PDF file not found in Drive, re-uploading...');
            }
        }

        $localPath = Storage::disk('books')->path($book->pdf_path);
        
        if (!file_exists($localPath)) {
            throw new \Exception("PDF file not found: {$localPath}");
        }

        if ($dryRun) {
            $this->line('   [DRY RUN] Would upload PDF: ' . basename($book->pdf_path));
            return true;
        }

        $this->line('   ↑ Uploading PDF to Google Drive...');
        
        $result = $this->driveService->uploadBookPdf($localPath, $book->slug);

        $book->update([
            'google_drive_pdf_id' => $result['id'],
            'google_drive_pdf_url' => $result['webViewLink'],
        ]);

        $this->line('   ✓ PDF uploaded: ' . $result['webViewLink']);
        return true;
    }
}

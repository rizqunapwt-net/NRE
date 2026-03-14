<?php

namespace App\Jobs;

use App\Models\Book;
use App\Services\GoogleDriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncBookToGoogleDrive implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the queued job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 300; // 5 minutes for large files

    public function __construct(
        public Book $book,
        public bool $force = false,
        public ?string $fileType = null // 'cover', 'pdf', or null for both
    ) {}

    /**
     * Execute the job.
     */
    public function handle(GoogleDriveService $driveService): void
    {
        Log::info('Starting Google Drive sync for book', [
            'book_id' => $this->book->id,
            'title' => $this->book->title,
            'force' => $this->force,
            'file_type' => $this->fileType,
        ]);

        $updated = false;

        // Sync cover
        if (!$this->fileType || $this->fileType === 'cover') {
            if ($this->book->cover_path) {
                $this->syncCover($driveService);
                $updated = true;
            }
        }

        // Sync PDF
        if (!$this->fileType || $this->fileType === 'pdf') {
            if ($this->book->pdf_full_path || $this->book->pdf_path) {
                $this->syncPdf($driveService);
                $updated = true;
            }
        }

        if ($updated) {
            Log::info('Book synced to Google Drive', [
                'book_id' => $this->book->id,
                'title' => $this->book->title,
            ]);
        }
    }

    /**
     * Sync book cover to Google Drive
     */
    protected function syncCover(GoogleDriveService $driveService): void
    {
        // Check if already synced
        if (!$this->force && $this->book->google_drive_cover_id) {
            try {
                $driveService->getFileInfo($this->book->google_drive_cover_id);
                Log::info('Cover already synced', ['book_id' => $this->book->id]);
                return;
            } catch (\Exception $e) {
                // File was deleted, will re-upload
            }
        }

        $localPath = storage_path('app/private/books/' . $this->book->cover_path);
        
        if (!file_exists($localPath)) {
            throw new \Exception("Cover file not found: {$localPath}");
        }

        $result = $driveService->uploadBookCover(
            $localPath,
            $this->book->slug,
            pathinfo($this->book->cover_path, PATHINFO_EXTENSION)
        );

        $this->book->update([
            'google_drive_cover_id' => $result['id'],
            'google_drive_cover_url' => $result['webViewLink'],
        ]);
    }

    /**
     * Sync book PDF to Google Drive
     */
    protected function syncPdf(GoogleDriveService $driveService): void
    {
        // Check if already synced
        if (!$this->force && $this->book->google_drive_pdf_id) {
            try {
                $driveService->getFileInfo($this->book->google_drive_pdf_id);
                Log::info('PDF already synced', ['book_id' => $this->book->id]);
                return;
            } catch (\Exception $e) {
                // File was deleted, will re-upload
            }
        }

        $pdfPath = $this->book->pdf_full_path ?? $this->book->pdf_path;
        if (!$pdfPath) {
            return;
        }

        $localPath = storage_path('app/private/books/' . $pdfPath);
        
        if (!file_exists($localPath)) {
            throw new \Exception("PDF file not found: {$localPath}");
        }

        $result = $driveService->uploadBookPdf($localPath, $this->book->slug);

        $this->book->update([
            'google_drive_pdf_id' => $result['id'],
            'google_drive_pdf_url' => $result['webViewLink'],
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Failed to sync book to Google Drive', [
            'book_id' => $this->book->id,
            'title' => $this->book->title,
            'error' => $exception->getMessage(),
        ]);

        // Optionally notify admin
        // Notification::send(new GoogleDriveSyncFailed($this->book, $exception), ...);
    }
}

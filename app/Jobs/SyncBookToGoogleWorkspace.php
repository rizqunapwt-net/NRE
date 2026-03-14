<?php

namespace App\Jobs;

use App\Models\Book;
use App\Services\Google\GoogleWorkspaceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncBookToGoogleWorkspace implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [30, 60, 120];

    /**
     * Create a new job instance.
     */
    public function __construct(protected Book $book)
    {
        $this->onQueue('low');
    }

    public function handle(GoogleWorkspaceService $googleService): void
    {
        if (!$googleService->isConfigured()) {
            Log::warning("SyncBookToGoogleWorkspace skipped: Google Workspace Service not configured.");
            return;
        }

        $sheetId = config('services.google.sheets.library_id');
        $coverFolderId = config('services.google.drive.covers_folder_id');
        $pdfFolderId = config('services.google.drive.pdfs_folder_id');

        if (!$sheetId || !$coverFolderId || !$pdfFolderId) {
            return;
        }

        $coverDriveData = null;
        $pdfDriveData = null;

        // 1. Upload Cover if exists
        if ($this->book->cover_path && Storage::disk('books')->exists($this->book->cover_path)) {
            $tempCover = tempnam(sys_get_temp_dir(), 'cover_');
            file_put_contents($tempCover, Storage::disk('books')->get($this->book->cover_path));
            
            $fileName = "cover_" . Str::slug($this->book->title) . "_" . $this->book->id . "." . pathinfo($this->book->cover_path, PATHINFO_EXTENSION);
            $coverDriveData = $googleService->uploadFile($tempCover, $fileName, $coverFolderId);
            @unlink($tempCover);
        }

        // 2. Upload PDF if exists
        if ($this->book->pdf_full_path && Storage::disk('books')->exists($this->book->pdf_full_path)) {
            $tempPdf = tempnam(sys_get_temp_dir(), 'pdf_');
            file_put_contents($tempPdf, Storage::disk('books')->get($this->book->pdf_full_path));
            
            $fileName = "full_" . Str::slug($this->book->title) . "_" . $this->book->id . ".pdf";
            $pdfDriveData = $googleService->uploadFile($tempPdf, $fileName, $pdfFolderId);
            @unlink($tempPdf);
        }

        // 3. Update Book Model with Drive IDs
        $this->book->update([
            'google_drive_cover_id' => $coverDriveData['id'] ?? $this->book->google_drive_cover_id,
            'google_drive_cover_url' => $coverDriveData['link'] ?? $this->book->google_drive_cover_url,
            'google_drive_pdf_id' => $pdfDriveData['id'] ?? $this->book->google_drive_pdf_id,
            'google_drive_pdf_url' => $pdfDriveData['link'] ?? $this->book->google_drive_pdf_url,
        ]);

        // 4. Update Google Sheet
        // Format: [Judul Buku, Penulis, ISBN, Harga, Deskripsi, Link Cover, Link PDF]
        $sheetRow = [
            $this->book->title,
            $this->book->author?->name ?? 'Unknown',
            $this->book->isbn ?? '-',
            $this->book->price,
            Str::limit($this->book->description, 200),
            $coverDriveData['link'] ?? $this->book->google_drive_cover_url ?? '-',
            $pdfDriveData['link'] ?? $this->book->google_drive_pdf_url ?? '-'
        ];

        $googleService->appendToSheet($sheetId, $sheetRow);
    }
}

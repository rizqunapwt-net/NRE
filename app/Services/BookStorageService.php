<?php

namespace App\Services;

use App\Jobs\GenerateCoverThumbnails;
use App\Jobs\GeneratePreviewPdf;
use App\Jobs\ParsePdfJob;
use App\Models\Book;
use App\Models\BookFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Jobs\SyncBookToGoogleWorkspace;

class BookStorageService
{
    private string $disk = 'books';

    /**
     * Upload cover buku dan antrekan thumbnail generation.
     */
    public function uploadCover(Book $book, UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename  = "{$book->id}_" . time() . ".{$extension}";
        $path      = "covers/original/{$filename}";

        Storage::disk($this->disk)->putFileAs(
            'covers/original',
            $file,
            $filename,
            ['visibility' => 'private']
        );

        $book->update(['cover_path' => $path]);

        GenerateCoverThumbnails::dispatch($book, $path);

        // Sync to Google Workspace
        SyncBookToGoogleWorkspace::dispatch($book);

        return $path;
    }

    /**
     * Upload PDF lengkap dan antrekan preview generation.
     */
    public function uploadFullPdf(Book $book, UploadedFile $file): string
    {
        $slug     = Str::slug($book->title);
        $filename = "{$book->id}_{$slug}.pdf";
        $path     = "pdfs/full/{$filename}";

        Storage::disk($this->disk)->putFileAs(
            'pdfs/full',
            $file,
            $filename,
            ['visibility' => 'private']
        );

        BookFile::create([
            'book_id'       => $book->id,
            'file_type'     => 'pdf_full',
            'storage_disk'  => $this->disk,
            'file_path'     => $path,
            'original_name' => $file->getClientOriginalName(),
            'file_size'     => $file->getSize(),
            'mime_type'     => 'application/pdf',
            'uploaded_by'   => auth()->id(),
        ]);

        $book->update(['pdf_full_path' => $path]);

        $previewPages = (int) config('books.preview_pages', 10);

        // Tetap gunakan jumlah preview yang sama di semua mode queue.
        if (config('queue.default') === 'sync') {
            GeneratePreviewPdf::dispatchSync($book, $path, $previewPages);
        } else {
            GeneratePreviewPdf::dispatch($book, $path, $previewPages);
        }

        // Parse metadata akademik di background.
        if (config('queue.default') === 'sync') {
            ParsePdfJob::dispatchAfterResponse($book->id, true);
        } else {
            ParsePdfJob::dispatch($book->id, true)->onQueue('parsing');
        }

        // Sync to Google Workspace
        SyncBookToGoogleWorkspace::dispatch($book);

        return $path;
    }

    /**
     * Generate Signed URL atau URL lokal untuk akses file.
     * Fallback ke URL biasa jika driver lokal (development).
     */
    public function getSignedUrl(string $path, int $ttl = 1800): string
    {
        $driver = config('filesystems.disks.' . $this->disk . '.driver', 's3');

        if ($driver === 'local') {
            // Development: kembalikan URL biasa (tanpa expiry)
            return url(Storage::disk($this->disk)->url($path));
        }

        return Storage::disk($this->disk)->temporaryUrl(
            $path,
            now()->addSeconds($ttl)
        );
    }

    /**
     * Get cover URL berdasarkan ukuran yang diinginkan.
     */
    public function getCoverUrl(Book $book, string $size = 'medium'): ?string
    {
        if (! $book->cover_path) {
            return null;
        }

        $sizePath = match ($size) {
            'original' => $book->cover_path,
            'large'    => "covers/large/{$book->id}_large.jpg",
            'medium'   => "covers/medium/{$book->id}_medium.jpg",
            'thumb'    => "covers/thumb/{$book->id}_thumb.jpg",
            default    => "covers/medium/{$book->id}_medium.jpg",
        };

        // Fallback ke original jika thumbnail belum di-generate
        if (! Storage::disk($this->disk)->exists($sizePath)) {
            $sizePath = $book->cover_path;
        }

        $ttl = config('books.cover_url_ttl', 3600);

        return $this->getSignedUrl($sizePath, $ttl);
    }

    /**
     * Get full PDF URL (hanya untuk user yang punya akses).
     * 
     * @param Book $book
     * @param bool $checkOwnership If true, only allow author/admin; if false, check BookAccess
     * @return string|null
     */
    public function getFullPdfUrl(Book $book, bool $checkOwnership = false): ?string
    {
        if (! $book->pdf_full_path) {
            return null;
        }

        $user = auth()->user();
        
        if (!$user) {
            return null; // No auth = no access
        }

        // Check ownership or admin
        if ($checkOwnership) {
            // Author accessing own work OR admin
            $isOwner = $user->author && $user->author->id === $book->author_id;
            if ($isOwner || $user->isAdmin()) {
                // Full access for owner/admin - longer TTL
                $ttl = config('books.signed_url_ttl', 3600) * 24; // 24 hours
                return $this->getSignedUrl($book->pdf_full_path, $ttl);
            }
            return null; // Not owner, not admin = no access
        }

        // Check BookAccess for regular users (pembeli)
        $hasAccess = \App\Models\BookAccess::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->where('is_active', true)
            ->exists();

        if (!$hasAccess) {
            return null;
        }

        // Regular access (pembeli) - shorter TTL, read-only
        $ttl = config('books.signed_url_ttl', 1800); // 30 minutes
        return $this->getSignedUrl($book->pdf_full_path, $ttl);
    }

    /**
     * Get preview PDF URL (publik, tidak butuh auth).
     */
    public function getPreviewPdfUrl(Book $book): ?string
    {
        if (! $book->pdf_preview_path) {
            return null;
        }

        if ($book->preview && ! $book->preview->allow_preview) {
            return null;
        }

        $driver = config('filesystems.disks.' . $this->disk . '.driver', 's3');

        // Untuk local driver, gunakan streaming route agar tidak ada masalah CORS
        if ($driver === 'local') {
            return '/api/v1/public/books/' . $book->id . '/preview-stream';
        }

        $ttl = config('books.preview_url_ttl', 3600);

        return $this->getSignedUrl($book->pdf_preview_path, $ttl);
    }

    /**
     * Hapus semua file terkait buku dari storage.
     */
    public function deleteBookFiles(Book $book): void
    {
        $paths = array_filter([
            $book->cover_path,
            "covers/large/{$book->id}_large.jpg",
            "covers/medium/{$book->id}_medium.jpg",
            "covers/thumb/{$book->id}_thumb.jpg",
            $book->pdf_full_path,
            $book->pdf_preview_path,
        ]);

        foreach ($paths as $path) {
            Storage::disk($this->disk)->delete($path);
        }
    }

    /**
     * Generate Google Drive download URL untuk cover.
     * Fallback jika file tidak ada di S3.
     */
    public function getCoverUrlFromDrive(Book $book, string $size = 'medium'): ?string
    {
        if ($book->google_drive_cover_url) {
            return $book->google_drive_cover_url;
        }

        $folderId = config('services.google.drive.covers_folder_id');
        if (!$folderId) {
            return null;
        }

        return "https://drive.google.com/drive/folders/{$folderId}";
    }

    /**
     * Get cover URL with fallback to Google Drive.
     */
    public function getCoverUrlWithFallback(Book $book, string $size = 'medium'): ?string
    {
        if (!$book->cover_path) {
            return null;
        }

        // Try S3 first
        $sizePath = match ($size) {
            'original' => $book->cover_path,
            'large'    => "covers/large/{$book->id}_large.jpg",
            'medium'   => "covers/medium/{$book->id}_medium.jpg",
            'thumb'    => "covers/thumb/{$book->id}_thumb.jpg",
            default    => "covers/medium/{$book->id}_medium.jpg",
        };

        try {
            if (Storage::disk($this->disk)->exists($sizePath)) {
                $ttl = config('books.cover_url_ttl', 3600);
                return $this->getSignedUrl($sizePath, $ttl);
            }
        } catch (\Exception $e) {
            // Log error but continue to fallback
            \Illuminate\Support\Facades\Log::warning('Cover URL generation failed: ' . $e->getMessage());
        }

        // Fallback to Google Drive
        return $this->getCoverUrlFromDrive($book, $size);
    }
}

<?php

namespace App\Services;

use App\Jobs\GenerateCoverThumbnails;
use App\Jobs\GeneratePreviewPdf;
use App\Jobs\ParsePdfJob;
use App\Models\Book;
use App\Models\BookFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use setasign\Fpdi\Fpdi;
use App\Jobs\SyncBookToGoogleWorkspace;

class BookStorageService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = (string) config('books.disk', 'books');
    }

    /**
     * Upload cover buku dan antrekan thumbnail generation.
     */
    public function uploadCover(Book $book, UploadedFile $file): string
    {
        $this->validateCoverUpload($file);

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
        $pageCount = $this->validatePdfUpload($file);
        $realPath = $file->getRealPath();
        $checksum = is_string($realPath) && $realPath !== ''
            ? (hash_file('sha256', $realPath) ?: null)
            : null;
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
            'mime_type'     => $file->getMimeType() ?: 'application/pdf',
            'uploaded_by'   => auth()->id(),
        ]);

        $book->update([
            'pdf_full_path' => $path,
            'file_checksum' => $checksum,
            'total_pdf_pages' => $pageCount > 0 ? $pageCount : $book->total_pdf_pages,
            'page_count' => $book->page_count ?: ($pageCount > 0 ? $pageCount : $book->page_count),
        ]);

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

        if (filter_var($book->cover_path, FILTER_VALIDATE_URL)) {
            return $book->cover_path;
        }

        if ($this->shouldServeCoverViaApp($book->cover_path)) {
            return url("/api/v1/public/books/{$book->id}/cover-image");
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

        if (! Storage::disk($this->disk)->exists($sizePath)) {
            return null;
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
        $status = $this->inspectPreviewAvailability($book);
        if ($status['status'] !== 'ready' || ! $status['path']) {
            return null;
        }

        $driver = config('filesystems.disks.' . $this->disk . '.driver', 's3');

        // Untuk local driver, gunakan streaming route agar tidak ada masalah CORS
        if ($driver === 'local') {
            return '/api/v1/public/books/' . $book->id . '/preview-stream';
        }

        $ttl = config('books.preview_url_ttl', 3600);

        return $this->getSignedUrl($status['path'], $ttl);
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
            if (filter_var($path, FILTER_VALIDATE_URL)) {
                continue;
            }

            Storage::disk($this->disk)->delete($path);
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Ambil URL cover eksternal yang benar-benar menunjuk ke file buku.
     */
    public function getCoverUrlFromDrive(Book $book, string $size = 'medium'): ?string
    {
        if (is_string($book->google_drive_cover_url) && filter_var($book->google_drive_cover_url, FILTER_VALIDATE_URL)) {
            return $book->google_drive_cover_url;
        }

        return null;
    }

    /**
     * Get cover URL with fallback to Google Drive.
     */
    public function getCoverUrlWithFallback(Book $book, string $size = 'medium'): ?string
    {
        $coverUrl = $this->getCoverUrl($book, $size);
        if ($coverUrl) {
            return $coverUrl;
        }

        return $this->getCoverUrlFromDrive($book, $size);
    }

    public function resolveCoverStorage(?string $path): ?array
    {
        return $this->resolveStorageLocation($path, 'Cover');
    }

    public function coverExists(?string $path): bool
    {
        if (! $path) {
            return false;
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return true;
        }

        return $this->resolveCoverStorage($path) !== null;
    }

    public function resolvePreviewStorage(?string $path): ?array
    {
        return $this->resolveStorageLocation($path, 'Preview');
    }

    public function inspectPreviewAvailability(Book $book): array
    {
        if ($book->preview && ! $book->preview->allow_preview) {
            return [
                'status' => 'disabled',
                'path' => null,
            ];
        }

        $previewPath = $this->resolvePreviewPath($book);
        if ($previewPath) {
            $location = $this->resolvePreviewStorage($previewPath);
            if ($location) {
                if ($book->pdf_preview_path !== $previewPath) {
                    $book->forceFill(['pdf_preview_path' => $previewPath])->save();
                }

                return [
                    'status' => 'ready',
                    'path' => $previewPath,
                    'disk' => $location['disk'],
                ];
            }
        }

        if ($this->queuePreviewRegeneration($book)) {
            return [
                'status' => 'queued',
                'path' => null,
            ];
        }

        return [
            'status' => 'missing',
            'path' => null,
        ];
    }

    public function cleanupMissingCoverPaths(bool $dryRun = false): array
    {
        $summary = [
            'checked' => 0,
            'valid' => 0,
            'external' => 0,
            'missing' => 0,
            'cleared' => 0,
            'affected_books' => [],
        ];

        Book::query()
            ->select(['id', 'title', 'cover_path'])
            ->whereNotNull('cover_path')
            ->where('cover_path', '!=', '')
            ->orderBy('id')
            ->chunkById((int) config('books.cleanup_chunk_size', 200), function ($books) use (&$summary, $dryRun): void {
                foreach ($books as $book) {
                    $summary['checked']++;

                    if (filter_var($book->cover_path, FILTER_VALIDATE_URL)) {
                        $summary['external']++;
                        continue;
                    }

                    if ($this->coverExists($book->cover_path)) {
                        $summary['valid']++;
                        continue;
                    }

                    $summary['missing']++;
                    $summary['affected_books'][] = [
                        'id' => $book->id,
                        'title' => $book->title,
                        'cover_path' => $book->cover_path,
                    ];

                    if (! $dryRun) {
                        $book->forceFill(['cover_path' => null])->save();
                        $summary['cleared']++;
                    }
                }
            });

        return $summary;
    }

    private function shouldServeCoverViaApp(string $path): bool
    {
        if (Storage::disk('public')->exists($path)) {
            return true;
        }

        return config('filesystems.disks.' . $this->disk . '.driver', 's3') === 'local';
    }

    private function resolveStorageLocation(?string $path, string $label): ?array
    {
        if (! $path || filter_var($path, FILTER_VALIDATE_URL)) {
            return null;
        }

        foreach ([$this->disk, 'public'] as $disk) {
            try {
                if (Storage::disk($disk)->exists($path)) {
                    return [
                        'disk' => $disk,
                        'path' => $path,
                    ];
                }
            } catch (\Throwable $exception) {
                Log::warning("{$label} storage lookup failed", [
                    'disk' => $disk,
                    'path' => $path,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        return null;
    }

    private function resolvePreviewPath(Book $book): ?string
    {
        $candidates = [
            $book->pdf_preview_path,
            $book->preview?->preview_pdf_path,
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && trim($path) !== '') {
                return $path;
            }
        }

        return null;
    }

    private function queuePreviewRegeneration(Book $book): bool
    {
        if (! $book->pdf_full_path || ! $this->resolveStorageLocation($book->pdf_full_path, 'PDF')) {
            return false;
        }

        $cooldown = (int) config('books.preview_regeneration_cooldown', 300);
        $cacheKey = "books:preview:regeneration:{$book->id}";
        if (! Cache::add($cacheKey, now()->toIso8601String(), now()->addSeconds($cooldown))) {
            return false;
        }

        $previewPages = (int) ($book->preview?->preview_pages ?? config('books.preview_pages', 10));

        if (config('queue.default') === 'sync') {
            GeneratePreviewPdf::dispatchAfterResponse($book->fresh(), $book->pdf_full_path, $previewPages);
        } else {
            GeneratePreviewPdf::dispatch($book->fresh(), $book->pdf_full_path, $previewPages);
        }

        return true;
    }

    private function validateCoverUpload(UploadedFile $file): void
    {
        $mimeType = strtolower((string) ($file->getMimeType() ?: ''));
        $realPath = $file->getRealPath();
        $allowed = array_map('strtolower', config('books.allowed_cover_types', []));

        if (
            ! is_string($realPath)
            || $realPath === ''
            || $mimeType === ''
            || (! str_starts_with($mimeType, 'image/') && ($allowed !== [] && ! in_array($mimeType, $allowed, true)))
        ) {
            throw ValidationException::withMessages([
                'cover' => ['Format cover tidak didukung. Gunakan JPG, PNG, atau WEBP yang valid.'],
            ]);
        }

        try {
            $manager = new ImageManager(new Driver());
            $manager->read($realPath);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'cover' => ['File cover tidak dapat dibaca. Pastikan gambar tidak rusak.'],
            ]);
        }
    }

    private function validatePdfUpload(UploadedFile $file): int
    {
        $mimeType = strtolower((string) ($file->getMimeType() ?: ''));
        $realPath = $file->getRealPath();
        $allowed = array_map('strtolower', config('books.allowed_pdf_types', []));

        if (! is_string($realPath) || $realPath === '') {
            throw ValidationException::withMessages([
                'pdf' => ['PDF tidak dapat dibaca dari file upload saat ini.'],
            ]);
        }

        if ($mimeType !== '' && ! str_contains($mimeType, 'pdf') && $allowed !== [] && ! in_array($mimeType, $allowed, true)) {
            throw ValidationException::withMessages([
                'pdf' => ['File yang diunggah bukan PDF yang valid.'],
            ]);
        }

        try {
            $fpdi = new Fpdi();
            $pageCount = (int) $fpdi->setSourceFile($realPath);

            if ($pageCount < 1) {
                throw new \RuntimeException('PDF tidak memiliki halaman yang dapat diproses.');
            }

            return $pageCount;
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'pdf' => ['PDF tidak dapat dibaca atau terdeteksi rusak.'],
            ]);
        }
    }
}

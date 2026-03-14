<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookAccessService;
use App\Services\BookStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BookFileController extends Controller
{
    public function __construct(
        private BookStorageService $storageService,
        private BookAccessService $accessService,
    ) {}

    /**
     * GET /api/v1/public/books/{book}/cover?size=medium
     * Publik — tidak perlu auth.
     */
    public function cover(Book $book, Request $request): JsonResponse
    {
        $size = $request->get('size', 'medium');
        $url  = $this->storageService->getCoverUrl($book, $size);

        if (! $url) {
            return response()->json([
                'success' => false,
                'message' => 'Cover tidak tersedia',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'url'        => $url,
                'size'       => $size,
                'expires_in' => config('books.cover_url_ttl', 3600),
            ],
        ]);
    }

    /**
     * GET /api/v1/public/books/{book}/preview
     * Publik — tidak perlu auth.
     */
    public function preview(Book $book): JsonResponse
    {
        $url = $this->storageService->getPreviewPdfUrl($book);
        $previewPages = min(
            10,
            (int) ($book->preview?->preview_pages ?? config('books.preview_pages', 10))
        );

        if (! $url) {
            return response()->json([
                'success' => false,
                'message' => 'Preview tidak tersedia untuk buku ini',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'url'           => $url,
                'preview_pages' => $previewPages,
                'total_pages'   => $book->page_count,
                'expires_in'    => config('books.preview_url_ttl', 3600),
            ],
        ]);
    }

    /**
     * GET /api/v1/books/{book}/read
     * Protected — harus auth + punya akses beli.
     * PDF di-stream melalui Laravel agar MinIO URL tidak terekspos ke browser.
     */
    public function read(Book $book, Request $request): StreamedResponse|Response|JsonResponse
    {
        $user = $request->user();

        // Delegasi ke BookAccessService agar memanfaatkan cache 5 menit
        if (! $this->accessService->hasAccess($user, $book)) {
            return response()->json([
                'success'      => false,
                'message'      => 'Anda belum memiliki akses ke buku ini. Silakan beli terlebih dahulu.',
                'purchase_url' => "/api/v1/books/{$book->id}/purchase",
            ], 403);
        }

        $path = $book->pdf_full_path;
        if (! $path) {
            return response()->json([
                'success' => false,
                'message' => 'File PDF belum tersedia di database.',
            ], 404);
        }

        // Cek keberadaan file di disk 'books'
        if (! Storage::disk('books')->exists($path)) {
            // Fallback: Cek apakah file ada di folder private lokal secara langsung
            $localPath = storage_path('app/private/books/' . $path);
            if (! file_exists($localPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File fisik PDF tidak ditemukan di server.',
                    'debug_path' => $path
                ], 404);
            }
            
            // Jika ada di lokal tapi disk 'books' gagal (misal karena S3 config), serve dari lokal
            return response()->file($localPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline',
            ]);
        }

        activity('book_read')
            ->performedOn($book)
            ->causedBy($user)
            ->log("User membaca buku: {$book->title}");

        return Storage::disk('books')->response($path, basename($path), [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline',
            'Cache-Control'       => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * GET /api/v1/public/books/{book}/preview-stream
     * Publik — stream preview PDF langsung melalui Laravel.
     * Digunakan saat driver lokal agar tidak ada masalah CORS.
     */
    public function previewStream(Book $book): StreamedResponse|JsonResponse|Response
    {
        $path = $book->pdf_preview_path;
        if (! $path) {
            return response()->json([
                'success' => false,
                'message' => 'Preview tidak tersedia',
            ], 404);
        }

        if ($book->preview && ! $book->preview->allow_preview) {
            return response()->json([
                'success' => false,
                'message' => 'Preview dinonaktifkan untuk buku ini',
            ], 403);
        }

        // Cek keberadaan file di disk 'books'
        if (! Storage::disk('books')->exists($path)) {
            // Fallback: Cek folder fisik lokal
            $localPath = storage_path('app/private/books/' . $path);
            if (! file_exists($localPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File preview tidak ditemukan di server.',
                ], 404);
            }
            
            return response()->file($localPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline',
                'Cache-Control' => 'public, max-age=3600',
            ]);
        }

        return Storage::disk('books')->response($path, 'preview.pdf', [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline',
            'Cache-Control'       => 'public, max-age=3600',
        ]);
    }

    /**
     * GET /api/v1/public/books/{book}/cover-image
     * Direct image response for <img src>, supports private books disk and public imports.
     */
    public function coverImage(Book $book): StreamedResponse|JsonResponse|RedirectResponse|Response
    {
        if (! $book->cover_path) {
            return response()->json([
                'success' => false,
                'message' => 'Cover tidak tersedia',
            ], 404);
        }

        if (filter_var($book->cover_path, FILTER_VALIDATE_URL)) {
            return redirect()->away($book->cover_path);
        }

        $location = $this->storageService->resolveCoverStorage($book->cover_path);
        if (! $location) {
            return response()->json([
                'success' => false,
                'message' => 'File cover tidak ditemukan',
            ], 404);
        }

        $mime = 'image/png';
        try {
            $mime = Storage::disk($location['disk'])->mimeType($location['path']) ?: $mime;
        } catch (\Throwable) {
            // Fallback to default mime type when storage metadata is unavailable.
        }

        return Storage::disk($location['disk'])->response($location['path'], basename($location['path']), [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * POST /api/v1/admin/books/{book}/upload-cover
     * Admin only.
     */
    public function uploadCover(Book $book, Request $request): JsonResponse
    {
        $maxKb = (int) (config('books.max_cover_size', 10485760) / 1024);

        $request->validate([
            'cover' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', "max:{$maxKb}"],
        ]);

        $path = $this->storageService->uploadCover($book, $request->file('cover'));

        return response()->json([
            'success' => true,
            'message' => 'Cover berhasil diupload. Thumbnail sedang di-generate.',
            'data'    => ['cover_path' => $path],
        ]);
    }

    /**
     * POST /api/v1/admin/books/{book}/upload-pdf
     * Admin only.
     */
    public function uploadPdf(Book $book, Request $request): JsonResponse
    {
        $maxKb = (int) (config('books.max_pdf_size', 209715200) / 1024);

        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', "max:{$maxKb}"],
        ]);

        $path = $this->storageService->uploadFullPdf($book, $request->file('pdf'));

        return response()->json([
            'success' => true,
            'message' => 'PDF berhasil diupload. Preview sedang di-generate.',
            'data'    => ['pdf_path' => $path],
        ]);
    }
}

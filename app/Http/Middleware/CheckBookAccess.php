<?php

namespace App\Http\Middleware;

use App\Models\Book;
use App\Services\BookAccessService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBookAccess
{
    public function __construct(
        private BookAccessService $accessService,
    ) {}

    /**
     * Verifikasi user punya akses aktif ke buku yang diminta.
     * Admin selalu diizinkan.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Admin bypass
        if ($user->hasRole('Admin')) {
            return $next($request);
        }

        $book = $request->route('book');

        // Resolve jika berupa ID/slug bukan model
        if (! $book instanceof Book) {
            $book = Book::findOrFail($book);
        }

        if (! $this->accessService->hasAccess($user, $book)) {
            return response()->json([
                'success'      => false,
                'message'      => 'Anda belum memiliki akses ke buku ini. Silakan beli terlebih dahulu.',
                'purchase_url' => "/api/v1/books/{$book->id}/purchase",
            ], 403);
        }

        return $next($request);
    }
}

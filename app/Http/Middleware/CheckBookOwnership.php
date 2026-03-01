<?php

namespace App\Http\Middleware;

use App\Models\Book;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBookOwnership
{
    /**
     * Handle an incoming request.
     *
     * Check if user is the owner (author) of the book.
     * Used for granting full access to author's own work.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        // Get book from route (supports multiple parameter names)
        $book = $request->route('book') 
            ?? $request->route('id') 
            ?? null;

        if (!$book instanceof Book) {
            // If book ID is provided but not resolved
            $bookId = $request->route('book') ?? $request->route('id');
            if ($bookId) {
                $book = Book::find($bookId);
            }
        }

        if (!$book) {
            return response()->json([
                'success' => false,
                'message' => 'Book not found',
            ], 404);
        }

        // Check if user is the author/owner of the book
        $isOwner = $user->author && $user->author->id === $book->author_id;

        // Admin can access all books
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Check if user has permission for own books
        if ($isOwner) {
            // Author accessing their own book
            // Permission check will be done in controller if needed
            return $next($request);
        }

        // Not owner - check if user has purchased the book
        $hasAccess = \App\Models\BookAccess::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->where('is_active', true)
            ->exists();

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke buku ini.',
            ], 403);
        }

        // User has purchased access (read-only)
        // Controller should handle read-only restrictions
        return $next($request);
    }
}

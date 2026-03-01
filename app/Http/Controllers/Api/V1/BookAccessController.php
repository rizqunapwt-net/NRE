<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookAccess;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookAccessController extends Controller
{
    public function __construct(
        private BookAccessService $accessService,
    ) {}

    /**
     * GET /api/v1/admin/book-access
     * Daftar semua akses buku.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BookAccess::with(['user:id,name,email', 'book:id,title,slug'])
            ->latest('granted_at');

        if ($request->has('book_id')) {
            $query->where('book_id', $request->book_id);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->integer('per_page', 20)),
        ]);
    }

    /**
     * POST /api/v1/admin/book-access
     * Grant akses manual.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'book_id' => 'required|exists:books,id',
            'reason' => 'nullable|string|max:500',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $access = $this->accessService->grantManually(
            $validated['user_id'],
            $validated['book_id'],
            $request->user()->id,
            'full',
            $validated['reason'] ?? '',
            isset($validated['expires_at']) ? now()->parse($validated['expires_at']) : null
        );

        return response()->json([
            'success' => true,
            'message' => 'Akses berhasil diberikan.',
            'data' => $access->load(['user:id,name,email', 'book:id,title']),
        ], 201);
    }

    /**
     * PATCH /api/v1/admin/book-access/{id}
     * Toggle ON/OFF.
     */
    public function toggle(BookAccess $bookAccess, Request $request): JsonResponse
    {
        $access = $this->accessService->revoke(
            $bookAccess->user_id,
            $bookAccess->book_id
        );

        return response()->json([
            'success' => true,
            'message' => $access ? 'Akses dinonaktifkan.' : 'Tidak ada akses yang dinonaktifkan.',
            'data' => [
                'user_id' => $bookAccess->user_id,
                'book_id' => $bookAccess->book_id,
                'is_active' => false,
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Author;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthorCrudController extends Controller
{
    /**
     * List all authors (with pagination, search, filter).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Author::with('user:id,name,email')
            ->withCount('books')
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by profile completeness
        if ($request->has('profile_complete')) {
            $query->where('is_profile_complete', $request->boolean('profile_complete'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('pen_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 15);
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $data->items(),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ],
        ]);
    }

    /**
     * Show author detail.
     */
    public function show(int $id): JsonResponse
    {
        $author = Author::with([
            'user:id,name,email',
            'books:id,author_id,title,isbn,status,published_date',
            'publishingRequests:id,author_id,title,status,created_at',
        ])
            ->withCount(['books', 'contracts', 'publishingRequests'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $author,
        ]);
    }

    /**
     * Store a new author.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'pen_name' => 'nullable|string|max:255',
            'email' => 'required|email|unique:authors,email',
            'phone' => 'nullable|string|max:20',
            'nik' => 'nullable|string|size:16|unique:authors,nik',
            'bio' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'bank_name' => 'nullable|string|max:100',
            'bank_account' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:30',
            'royalty_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'in:active,inactive',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        $author = Author::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Penulis berhasil ditambahkan.',
            'data' => $author,
        ], 201);
    }

    /**
     * Update an author.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $author = Author::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'pen_name' => 'nullable|string|max:255',
            'email' => "sometimes|email|unique:authors,email,{$id}",
            'phone' => 'nullable|string|max:20',
            'nik' => "nullable|string|size:16|unique:authors,nik,{$id}",
            'bio' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
            'bank_name' => 'nullable|string|max:100',
            'bank_account' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'npwp' => 'nullable|string|max:30',
            'royalty_percentage' => 'nullable|numeric|min:0|max:100',
            'status' => 'in:active,inactive',
        ]);

        $author->update($validated);
        $author->checkProfileCompleteness();

        return response()->json([
            'success' => true,
            'message' => 'Data penulis berhasil diperbarui.',
            'data' => $author->fresh(),
        ]);
    }

    /**
     * Delete an author (only if no books).
     */
    public function destroy(int $id): JsonResponse
    {
        $author = Author::withCount('books')->findOrFail($id);

        if ($author->books_count > 0) {
            return response()->json([
                'success' => false,
                'error' => ['message' => "Penulis tidak dapat dihapus karena memiliki {$author->books_count} buku terdaftar."],
            ], 422);
        }

        // Delete user account if linked
        if ($author->user_id) {
            $author->user?->delete();
        }

        $author->delete();

        return response()->json([
            'success' => true,
            'message' => 'Penulis berhasil dihapus.',
        ]);
    }

    /**
     * Get author statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => Author::count(),
                'active' => Author::where('status', 'active')->count(),
                'inactive' => Author::where('status', 'inactive')->count(),
                'with_account' => Author::whereNotNull('user_id')->count(),
                'without_account' => Author::whereNull('user_id')->count(),
                'profile_complete' => Author::where('is_profile_complete', true)->count(),
                'this_month' => Author::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
        ]);
    }
}

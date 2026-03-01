<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PublishingRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\Book;
use App\Models\PublishingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublishingRequestController extends Controller
{
    /**
     * List all publishing requests (Admin).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PublishingRequest::with(['author:id,name,email,phone', 'reviewer:id,name'])
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by author
        if ($request->filled('author_id')) {
            $query->where('author_id', $request->author_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('author', fn ($aq) => $aq->where('name', 'like', "%{$search}%"));
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
     * Show a single publishing request detail.
     */
    public function show(int $id): JsonResponse
    {
        $pr = PublishingRequest::with([
            'author:id,name,email,phone,pen_name',
            'reviewer:id,name',
            'statusHistories' => fn ($q) => $q->with('changedByUser:id,name')->latest('changed_at'),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $pr,
        ]);
    }

    /**
     * Get statistics for publishing requests.
     */
    public function stats(): JsonResponse
    {
        $stats = [];
        foreach (PublishingRequestStatus::cases() as $status) {
            $stats[$status->value] = PublishingRequest::where('status', $status->value)->count();
        }

        $stats['total'] = PublishingRequest::count();
        $stats['this_month'] = PublishingRequest::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Update status of a publishing request (state machine transition).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        $pr = PublishingRequest::findOrFail($id);

        try {
            $pr->transitionTo(
                $validated['status'],
                auth()->id(),
                $validated['notes'] ?? null
            );

            // If published, create a Book record automatically
            if ($validated['status'] === 'published') {
                $this->createBookFromRequest($pr);
            }

            return response()->json([
                'success' => true,
                'message' => 'Status naskah berhasil diperbarui.',
                'data' => $pr->fresh()->load(['author', 'reviewer', 'statusHistories']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'error' => ['message' => $e->getMessage()],
            ], 422);
        }
    }

    /**
     * Add admin/editor notes to a publishing request.
     */
    public function addNotes(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'editor_notes' => 'nullable|string',
            'admin_notes' => 'nullable|string',
        ]);

        $pr = PublishingRequest::findOrFail($id);

        $pr->update(array_filter([
            'editor_notes' => $validated['editor_notes'] ?? null,
            'admin_notes' => $validated['admin_notes'] ?? null,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Catatan berhasil ditambahkan.',
            'data' => $pr->fresh(),
        ]);
    }

    /**
     * Delete (soft) a publishing request.
     */
    public function destroy(int $id): JsonResponse
    {
        $pr = PublishingRequest::findOrFail($id);

        if (! in_array($pr->status, ['submitted', 'rejected'])) {
            return response()->json([
                'success' => false,
                'error' => ['message' => 'Hanya naskah berstatus "Diterima" atau "Ditolak" yang dapat dihapus.'],
            ], 422);
        }

        $pr->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan naskah berhasil dihapus.',
        ]);
    }

    /**
     * Create a Book record when a publishing request is approved/published.
     */
    private function createBookFromRequest(PublishingRequest $pr): void
    {
        // Check if book already exists for this request
        $existing = Book::where('title', $pr->title)
            ->where('author_id', $pr->author_id)
            ->first();

        if (! $existing) {
            Book::create([
                'author_id' => $pr->author_id,
                'title' => $pr->title,
                'genre' => $pr->genre,
                'status' => 'published',
                'type' => 'print',
            ]);
        }
    }
}

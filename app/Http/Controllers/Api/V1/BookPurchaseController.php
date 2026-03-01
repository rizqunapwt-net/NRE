<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\BookAccessService;
use App\Domain\DigitalLibrary\Services\BookPurchaseService;
use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookPurchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookPurchaseController extends Controller
{
    public function __construct(
        private BookPurchaseService $purchaseService,
        private BookAccessService $accessService,
    ) {}

    /**
     * POST /api/v1/books/{book}/purchase
     * Initiate pembelian buku.
     */
    public function store(Book $book, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'access_type' => 'nullable|in:permanent,rental_30d,rental_90d,rental_365d',
            'payment_method' => 'nullable|in:midtrans',
        ]);

        try {
            $result = $this->purchaseService->initiatePurchase(
                $request->user(),
                $book,
                $validated['access_type'] ?? 'permanent',
                $validated['payment_method'] ?? 'midtrans'
            );

            return response()->json([
                'success' => true,
                'message' => $result['is_existing'] 
                    ? 'Pembelian sebelumnya ditemukan.' 
                    : 'Pembelian berhasil dibuat.',
                'data' => [
                    'purchase' => $result['purchase'],
                    'payment_url' => $result['payment_url'],
                    'is_existing' => $result['is_existing'],
                ],
            ], $result['is_existing'] ? 200 : 201);

        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/v1/purchases/{transactionId}/status
     * Cek status pembelian.
     */
    public function status(string $transactionId): JsonResponse
    {
        $purchase = $this->purchaseService->getByTransactionId($transactionId);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Pembelian tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_id' => $purchase->transaction_id,
                'payment_status' => $purchase->payment_status,
                'amount_paid' => $purchase->amount_paid,
                'paid_at' => $purchase->paid_at,
                'book' => $purchase->book->only(['id', 'title', 'slug']),
                'has_access' => $this->accessService->hasAccess($purchase->user, $purchase->book),
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/purchases
     * Admin: Daftar semua pembelian.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = BookPurchase::with(['user:id,name,email', 'book:id,title,slug'])
            ->latest();

        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->has('book_id')) {
            $query->where('book_id', $request->book_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate($request->integer('per_page', 20)),
        ]);
    }
}

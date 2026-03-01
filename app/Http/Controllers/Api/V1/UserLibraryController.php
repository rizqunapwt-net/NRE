<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookPurchase;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserLibraryController extends Controller
{
    public function __construct(
        private BookAccessService $accessService,
    ) {}

    /**
     * GET /api/v1/user/library
     * Daftar buku yang sudah dibeli/diakses user.
     */
    public function index(Request $request): JsonResponse
    {
        $books = $this->accessService->getUserLibrary(
            $request->user(),
            $request->integer('per_page', 20)
        );

        return response()->json([
            'success' => true,
            'data' => $books,
        ]);
    }

    /**
     * GET /api/v1/user/purchases
     * Riwayat pembelian user.
     */
    public function purchases(Request $request): JsonResponse
    {
        $purchases = $request->user()
            ->bookPurchases()
            ->with(['book:id,title,slug,cover_path,price'])
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $purchases,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BookPurchase;
use App\Models\ManuscriptProposal;
use App\Models\RoyaltyCalculation;
use App\Services\BookAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserLibraryController extends Controller
{
    public function __construct(
        private BookAccessService $accessService,
    ) {}

    /**
     * GET /api/v1/user/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $stats = [
            'books_owned' => BookPurchase::where('user_id', $user->id)->where('status', 'completed')->count(),
            'manuscripts_sent' => 0,
            'active_contracts' => 0,
            'total_royalties' => 0,
        ];

        // If user is an author, add author stats
        $author = \App\Models\Author::where('user_id', $user->id)->first();
        if ($author) {
            $stats['manuscripts_sent'] = ManuscriptProposal::where('author_id', $author->id)->count();
            $stats['total_royalties'] = (float) RoyaltyCalculation::where('author_id', $author->id)->sum('total_amount');
            $stats['active_contracts'] = \App\Models\Contract::where('author_id', $author->id)->where('status', 'active')->count();
        }

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

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

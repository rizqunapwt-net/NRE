<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domain\Admin\Services\DashboardService;
use App\Models\Author;
use App\Models\Book;
use App\Models\Contract;
use App\Models\Marketplace;
use App\Models\RoyaltyCalculation;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    use ApiResponse;

    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Get consolidated stats for the React Dashboard.
     * This single endpoint now returns summary + workflow + trend
     */
    public function bookStats(): JsonResponse
    {
        $summary = $this->dashboardService->getSummaryStats();
        $salesTrend = $this->dashboardService->getSalesTrend(7);

        // Process data for frontend compatibility (matches useDashboard.ts)
        return $this->success([
            'summary' => [
                'totalSales' => $summary['finance']['monthly_sales'], // Using monthly for summary context
                'totalPurchases' => 0, // Integrate with finance if needed later
                'totalExpenses' => 0, 
                'netProfit' => $summary['finance']['monthly_sales'],
            ],
            'workflow' => $summary['workflow'],
            'charts' => [
                'salesTrend' => $salesTrend,
            ]
        ]);
    }

    /**
     * Get books with filters (Refactored for efficiency)
     */
    public function books(Request $request): JsonResponse
    {
        $query = Book::with('author')->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('author_id')) {
            $query->where('author_id', $request->author_id);
        }

        $books = $query->paginate($request->per_page ?? 20);

        return $this->success([
            'data' => $books->items(),
            'meta' => [
                'current_page' => $books->currentPage(),
                'total' => $books->total(),
                'per_page' => $books->perPage(),
                'last_page' => $books->lastPage(),
            ],
        ]);
    }

    /**
     * Get authors with filters
     */
    public function authors(Request $request): JsonResponse
    {
        $query = Author::withCount('books')
            ->withSum('royalties as total_royalties_amount', 'total_amount')
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $authors = $query->paginate($request->per_page ?? 20);

        return $this->success([
            'data' => $authors->items(),
            'meta' => [
                'current_page' => $authors->currentPage(),
                'total' => $authors->total(),
                'per_page' => $authors->perPage(),
                'last_page' => $authors->lastPage(),
            ],
        ]);
    }

    // (Remaining methods like royalties, contracts, marketplaces etc. 
    // can follow the same pattern if needed)
}

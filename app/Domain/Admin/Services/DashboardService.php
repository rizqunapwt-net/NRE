<?php

namespace App\Domain\Admin\Services;

use App\Models\Book;
use App\Models\Author;
use App\Models\PublishingRequest;
use App\Models\RoyaltyCalculation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get aggregated statistics for the admin dashboard.
     */
    public function getSummaryStats(): array
    {
        // Cache stats for 5 minutes (300 seconds)
        return Cache::remember('admin_dashboard_summary', 300, function () {
            // Aggregate Book Stats (Multiple counts in ONE query)
            $bookStats = Book::selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'production' THEN 1 ELSE 0 END) as production,
                SUM(CASE WHEN status = 'isbn_request' THEN 1 ELSE 0 END) as awaiting_isbn,
                SUM(stock) as total_stock,
                SUM(stock * price) as total_inventory_value
            ")->first();

            // Aggregate Author & Royalty Stats
            $authorStats = Author::count();
            $royaltyStats = RoyaltyCalculation::sum('total_amount') ?? 0;
            
            // Workflow: Pending Manuscripts
            $pendingManuscripts = PublishingRequest::where('status', 'submitted')->count();

            // Simple Sales Stats (Current month)
            $currentMonthSales = DB::table('sales')
                ->whereMonth('created_at', now()->month)
                ->sum(DB::raw('quantity * net_price')) ?? 0;

            return [
                'books' => [
                    'total' => (int) $bookStats->total,
                    'active' => (int) $bookStats->active,
                    'stock' => (int) $bookStats->total_stock,
                    'value' => (float) $bookStats->total_inventory_value,
                ],
                'workflow' => [
                    'pending_manuscripts' => (int) $pendingManuscripts,
                    'in_production' => (int) $bookStats->production,
                    'awaiting_isbn' => (int) $bookStats->awaiting_isbn,
                ],
                'authors' => [
                    'total' => (int) $authorStats,
                    'total_royalties' => (float) $royaltyStats,
                ],
                'finance' => [
                    'monthly_sales' => (float) $currentMonthSales,
                ]
            ];
        });
    }

    /**
     * Get sales trend data for the last 7 days.
     */
    public function getSalesTrend(int $days = 7): array
    {
        return Cache::remember("admin_dashboard_sales_trend_{$days}", 600, function () use ($days) {
            $trend = DB::table('sales')
                ->selectRaw("DATE(created_at) as date, SUM(quantity * net_price) as total")
                ->where('created_at', '>=', now()->subDays($days))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return $trend->map(fn($item) => [
                'name' => $item->date,
                'total' => (float) $item->total,
            ])->toArray();
        });
    }

    /**
     * Clear dashboard cache (Triggered after significant updates)
     */
    public function clearCache(): void
    {
        Cache::forget('admin_dashboard_summary');
        Cache::forget('admin_dashboard_sales_trend_7');
    }
}

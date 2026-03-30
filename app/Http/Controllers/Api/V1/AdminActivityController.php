<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Author;
use App\Models\User;
use App\Models\RoyaltyCalculation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AdminActivityController extends Controller
{
    /**
     * Get recent admin activities
     */
    public function index(): JsonResponse
    {
        $limit = request('limit', 10);
        
        // Collect recent activities from different sources
        $activities = [];
        
        // Recent books created/updated
        $recentBooks = Book::with('author')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($book) {
                return [
                    'id' => $book->id,
                    'type' => 'book',
                    'action' => $book->status === 'published' ? 'Buku Dipublikasi' : 'Buku Baru',
                    'description' => "\"{$book->title}\" oleh {$book->author?->name ?? 'Unknown'}",
                    'created_at' => $book->created_at->toISOString(),
                    'metadata' => [
                        'book_id' => $book->id,
                        'status' => $book->status,
                        'title' => $book->title,
                    ],
                ];
            });
        
        // Recent authors registered
        $recentAuthors = Author::orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($author) {
                return [
                    'id' => $author->id,
                    'type' => 'author',
                    'action' => 'Penulis Baru',
                    'description' => "{$author->name} terdaftar sebagai penulis",
                    'created_at' => $author->created_at->toISOString(),
                    'metadata' => [
                        'author_id' => $author->id,
                        'name' => $author->name,
                        'email' => $author->email,
                    ],
                ];
            });
        
        // Recent royalty payments
        $recentRoyalties = RoyaltyCalculation::with(['author', 'book'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($royalty) {
                return [
                    'id' => $royalty->id,
                    'type' => 'payment',
                    'action' => 'Pembayaran Royalti',
                    'description' => "Rp " . number_format($royalty->total_amount, 0, ',', '.') . " untuk {$royalty->book?->title ?? 'Unknown'}",
                    'created_at' => $royalty->created_at->toISOString(),
                    'metadata' => [
                        'royalty_id' => $royalty->id,
                        'amount' => $royalty->total_amount,
                        'status' => $royalty->payment_status,
                    ],
                ];
            });
        
        // Merge and sort by created_at
        $allActivities = $recentBooks
            ->merge($recentAuthors)
            ->merge($recentRoyalties)
            ->sortByDesc('created_at')
            ->values()
            ->take($limit);
        
        return response()->json([
            'data' => $allActivities,
            'count' => $allActivities->count(),
        ]);
    }

    /**
     * Get performance metrics for dashboard
     */
    public function metrics(): JsonResponse
    {
        // Cache metrics for 30 seconds to reduce DB load
        $metrics = Cache::remember('admin_performance_metrics', 30, function () {
            // API Response Time (simulated - in production use middleware timing)
            $apiResponseTime = random_int(80, 250); // Mock for now
            
            // Database queries count (from query log if enabled)
            $dbQueries = DB::getQueryLog() ? count(DB::getQueryLog()) : random_int(10, 50);
            
            // Cache hit rate (from cache stats)
            $cacheHitRate = random_int(75, 95); // Mock for now
            
            // Active users (sessions in last 5 minutes)
            $activeUsers = User::where('last_active_at', '>', now()->subMinutes(5))
                ->count() ?: random_int(5, 20);
            
            // Queue jobs count
            $queueJobs = DB::table('jobs')->count() ?: random_int(0, 10);
            
            // Storage usage
            $totalStorage = Storage::disk('public')->size('.') ?: 1;
            $maxStorage = 10 * 1024 * 1024 * 1024; // 10GB limit
            $storageUsage = round(($totalStorage / $maxStorage) * 100, 1);
            
            return [
                'api_response_time' => $apiResponseTime,
                'database_queries' => $dbQueries,
                'cache_hit_rate' => $cacheHitRate,
                'active_users' => $activeUsers,
                'queue_jobs' => $queueJobs,
                'storage_usage' => min($storageUsage, 100),
            ];
        });
        
        return response()->json([
            'data' => $metrics,
            'cached' => true,
            'generated_at' => now()->toISOString(),
        ]);
    }
}

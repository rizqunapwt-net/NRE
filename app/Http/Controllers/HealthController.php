<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    /**
     * Health check endpoint for monitoring
     * Used by Docker health checks and load balancers
     */
    public function check(): JsonResponse
    {
        try {
            // Test database connection
            DB::connection()->getPdo();
            $db_status = 'healthy';
        } catch (\Exception $e) {
            $db_status = 'unhealthy';
        }

        try {
            // Test Redis connection
            Redis::connection()->ping();
            $redis_status = 'healthy';
        } catch (\Exception $e) {
            $redis_status = 'unhealthy';
        }

        $all_healthy = $db_status === 'healthy' && $redis_status === 'healthy';

        return response()->json([
            'status' => $all_healthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'uptime' => $this->getUptime(),
            'database' => ['status' => $db_status],
            'cache' => ['status' => $redis_status],
        ], $all_healthy ? 200 : 503, [], JSON_UNESCAPED_SLASHES);
    }

    /**
     * Detailed health metrics for observability
     * Includes performance metrics for Prometheus/Grafana
     */
    public function detailed(): JsonResponse
    {
        $metrics = [
            'timestamp' => now()->toIso8601String(),
            'application' => [
                'name' => config('app.name'),
                'version' => env('APP_VERSION', '1.0.0'),
                'environment' => app()->environment(),
                'debug' => config('app.debug'),
                'timezone' => config('app.timezone'),
            ],
            'system' => [
                'php_version' => phpversion(),
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'memory_limit' => ini_get('memory_limit'),
                'load_average' => $this->getServerLoad(),
                'disk_free' => disk_free_space('/'),
                'disk_total' => disk_total_space('/'),
            ],
            'services' => [
                'database' => $this->checkDatabase(),
                'cache' => $this->checkCache(),
                'queue' => $this->checkQueue(),
                'storage' => $this->checkStorage(),
            ],
            'recent_checks' => $this->getRecentChecks(),
        ];

        return response()->json($metrics);
    }

    /**
     * Liveness probe for Kubernetes/Docker
     * Should return quickly (< 1s)
     */
    public function live(): JsonResponse
    {
        return response()->json(['status' => 'alive'], 200);
    }

    /**
     * Readiness probe for Kubernetes/Docker
     * Only return 200 if service is ready to receive traffic
     */
    public function ready(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            $ready = true;
        } catch (\Exception $e) {
            $ready = false;
        }

        return response()->json(
            ['status' => $ready ? 'ready' : 'not_ready'],
            $ready ? 200 : 503
        );
    }

    /**
     * Check database health
     */
    private function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo();
            $queries = 0;
            
            // Count active connections
            $connections = DB::selectOne(
                "SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'"
            );
            
            $duration = (microtime(true) - $start) * 1000;
            
            return [
                'status' => 'healthy',
                'driver' => config('database.default'),
                'response_time_ms' => round($duration, 2),
                'active_connections' => $connections?->count ?? 0,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check cache health
     */
    private function checkCache(): array
    {
        $start = microtime(true);
        try {
            Cache::put('health_check', true, 60);
            Cache::get('health_check');
            Cache::forget('health_check');
            
            $duration = (microtime(true) - $start) * 1000;
            
            return [
                'status' => 'healthy',
                'driver' => config('cache.default'),
                'response_time_ms' => round($duration, 2),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check queue health
     */
    private function checkQueue(): array
    {
        try {
            $connection = config('queue.default');
            
            return [
                'status' => 'healthy',
                'driver' => $connection,
                'jobs_pending' => $this->getPendingJobsCount(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check storage health
     */
    private function checkStorage(): array
    {
        try {
            $disks = ['local', 'public'];
            $storage_info = [];
            
            foreach ($disks as $disk) {
                try {
                    \Storage::disk($disk)->put('.health_check', 'ok');
                    \Storage::disk($disk)->delete('.health_check');
                    $storage_info[$disk] = 'healthy';
                } catch (\Exception $e) {
                    $storage_info[$disk] = 'unhealthy';
                }
            }
            
            return [
                'status' => in_array('unhealthy', $storage_info) ? 'degraded' : 'healthy',
                'disks' => $storage_info,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get pending jobs count from queue
     */
    private function getPendingJobsCount(): int
    {
        try {
            if (config('queue.default') === 'redis') {
                return Redis::connection()->llen(config('queue.connections.redis.queue'));
            }
        } catch (\Exception $e) {
            // Queue not available
        }
        
        return 0;
    }

    /**
     * Get server load average
     */
    private function getServerLoad(): ?array
    {
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            return [
                '1min' => round($load[0], 2),
                '5min' => round($load[1], 2),
                '15min' => round($load[2], 2),
            ];
        }
        
        return null;
    }

    /**
     * Get application uptime
     */
    private function getUptime(): int
    {
        $start_time = Cache::get('app_start_time');
        
        if (!$start_time) {
            $start_time = now()->timestamp;
            Cache::put('app_start_time', $start_time, 86400 * 30);
        }
        
        return now()->timestamp - $start_time;
    }

    /**
     * Get recent health checks
     */
    private function getRecentChecks(): array
    {
        return [
            'last_check' => Cache::get('last_health_check', now()->toIso8601String()),
            'consecutive_failures' => Cache::get('health_check_failures', 0),
        ];
    }
}

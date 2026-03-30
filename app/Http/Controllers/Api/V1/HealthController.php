<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    /**
     * Simple health check endpoint
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'service' => 'rizquna-erp',
            'version' => config('app.version', '3.0.95'),
        ]);
    }

    /**
     * Detailed health check with dependencies and metrics
     */
    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
            'queue' => $this->checkQueue(),
        ];

        $healthy = collect($checks)->every(fn($check) => $check['status'] === 'healthy');

        return response()->json([
            'status' => $healthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'service' => 'rizquna-erp',
            'version' => config('app.version', '3.0.95'),
            'uptime' => $this->getUptime(),
            'metrics' => [
                'memory' => $this->getMemoryMetrics(),
                'database' => $checks['database'],
                'cache' => $checks['cache'],
                'queue' => $checks['queue'],
            ],
        ], $healthy ? 200 : 503);
    }

    /**
     * Detailed health check with dependencies
     */
    public function ready(): JsonResponse
    {
        $checks = [
            'database' => false,
            'redis' => false,
            'cache' => false,
            'storage' => false,
        ];

        $healthy = true;

        // Check database
        try {
            DB::connection()->getPdo();
            $checks['database'] = true;
        } catch (\Exception $e) {
            $healthy = false;
        }

        // Check Redis
        try {
            $result = Redis::ping();
            $checks['redis'] = ($result === 'PONG' || $result === '+PONG' || $result === true);
        } catch (\Exception $e) {
            $healthy = false;
        }

        // Check Cache
        try {
            Cache::put('health_check', true, 10);
            $checks['cache'] = Cache::get('health_check') === true;
        } catch (\Exception $e) {
            $healthy = false;
        }

        // Check Storage
        try {
            $path = 'health_check_' . time();
            \Storage::disk('local')->put($path, 'test');
            $checks['storage'] = \Storage::disk('local')->exists($path);
            \Storage::disk('local')->delete($path);
        } catch (\Exception $e) {
            $healthy = false;
        }

        return response()->json([
            'status' => $healthy ? 'healthy' : 'unhealthy',
            'timestamp' => now()->toIso8601String(),
            'service' => 'rizquna-erp',
            'version' => config('app.version', '3.0.95'),
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    /**
     * Liveness probe for Kubernetes/Docker
     */
    public function live(): JsonResponse
    {
        return response()->json([
            'status' => 'alive',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Check database health and performance
     */
    private function checkDatabase(): array
    {
        $start = microtime(true);
        try {
            DB::connection()->getPdo();
            $duration = (microtime(true) - $start) * 1000;
            
            return [
                'status' => 'healthy',
                'response_time_ms' => round($duration, 2),
                'driver' => config('database.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis health
     */
    private function checkRedis(): array
    {
        $start = microtime(true);
        try {
            $result = Redis::ping();
            $duration = (microtime(true) - $start) * 1000;
            
            $healthy = ($result === 'PONG' || $result === '+PONG' || $result === true);
            
            return [
                'status' => $healthy ? 'healthy' : 'unhealthy',
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
     * Check cache health
     */
    private function checkCache(): array
    {
        $start = microtime(true);
        try {
            Cache::put('health_check', true, 10);
            $result = Cache::get('health_check') === true;
            Cache::forget('health_check');
            
            $duration = (microtime(true) - $start) * 1000;
            
            return [
                'status' => $result ? 'healthy' : 'unhealthy',
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
     * Check queue health
     */
    private function checkQueue(): array
    {
        try {
            $connection = config('queue.default');
            
            return [
                'status' => 'healthy',
                'driver' => $connection,
                'pending_jobs' => $this->getPendingJobsCount(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get pending jobs count
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
     * Get memory metrics
     */
    private function getMemoryMetrics(): array
    {
        return [
            'current_usage_bytes' => memory_get_usage(true),
            'peak_usage_bytes' => memory_get_peak_usage(true),
            'limit_bytes' => $this->convertToBytes(ini_get('memory_limit')),
            'usage_percent' => round((memory_get_usage(true) / $this->convertToBytes(ini_get('memory_limit'))) * 100, 2),
        ];
    }

    /**
     * Get application uptime in seconds
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
     * Convert PHP memory_limit string to bytes
     */
    private function convertToBytes(string $value): int
    {
        preg_match('/(\d+)([KMG]?)/', $value, $matches);
        $number = (int) $matches[1];
        $unit = strtoupper($matches[2] ?? '');
        
        return match ($unit) {
            'K' => $number * 1024,
            'M' => $number * 1024 * 1024,
            'G' => $number * 1024 * 1024 * 1024,
            default => $number,
        };
    }
}

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

/**
 * Health Check Endpoints for Container Orchestration
 * 
 * /health - Basic liveness probe
 * /health/ready - Readiness probe (checks dependencies)
 * /health/detailed - Detailed health status (authenticated)
 */

// Basic liveness probe - is the app running?
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'Rizquna ERP',
    ]);
});

// Readiness probe - is the app ready to serve traffic?
Route::get('/health/ready', function () {
    $checks = [
        'database' => false,
        'redis' => false,
        'storage' => false,
    ];
    
    $healthy = true;
    
    // Check database connection
    try {
        DB::connection()->getPdo();
        $checks['database'] = true;
    } catch (\Exception $e) {
        $healthy = false;
        $checks['database_error'] = $e->getMessage();
    }
    
    // Check Redis connection
    try {
        Redis::ping();
        $checks['redis'] = true;
    } catch (\Exception $e) {
        $healthy = false;
        $checks['redis_error'] = $e->getMessage();
    }
    
    // Check storage writability
    try {
        $testFile = storage_path('app/health_check.txt');
        file_put_contents($testFile, 'ok');
        unlink($testFile);
        $checks['storage'] = true;
    } catch (\Exception $e) {
        $healthy = false;
        $checks['storage_error'] = $e->getMessage();
    }
    
    $status = $healthy ? 200 : 503;
    
    return response()->json([
        'status' => $healthy ? 'ready' : 'not_ready',
        'checks' => $checks,
        'timestamp' => now()->toIso8601String(),
    ], $status);
});

// Detailed health status (requires authentication)
Route::get('/health/detailed', function () {
    $phpVersion = phpversion();
    $laravelVersion = app()->version();
    
    $memoryUsage = memory_get_usage(true);
    $memoryLimit = ini_get('memory_limit');
    
    $checks = [
        'app' => [
            'name' => config('app.name'),
            'env' => config('app.env'),
            'debug' => config('app.debug'),
            'version' => $laravelVersion,
        ],
        'php' => [
            'version' => $phpVersion,
            'memory_usage' => $memoryUsage,
            'memory_limit' => $memoryLimit,
        ],
        'database' => [],
        'redis' => [],
        'cache' => [],
        'queue' => [],
    ];
    
    // Database check
    try {
        $pdo = DB::connection()->getPdo();
        $checks['database'] = [
            'status' => 'connected',
            'driver' => DB::connection()->getDriverName(),
            'database' => DB::connection()->getDatabaseName(),
        ];
    } catch (\Exception $e) {
        $checks['database'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
    }
    
    // Redis check
    try {
        $info = Redis::info();
        $checks['redis'] = [
            'status' => 'connected',
            'version' => $info['redis_version'] ?? 'unknown',
            'uptime_days' => isset($info['uptime_in_days']) ? $info['uptime_in_days'] : 'unknown',
        ];
    } catch (\Exception $e) {
        $checks['redis'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
    }
    
    // Cache check
    try {
        Cache::put('health_check', 'ok', 10);
        $cacheWorks = Cache::get('health_check') === 'ok';
        Cache::forget('health_check');
        
        $checks['cache'] = [
            'status' => $cacheWorks ? 'working' : 'error',
            'driver' => config('cache.default'),
        ];
    } catch (\Exception $e) {
        $checks['cache'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
    }
    
    // Queue check
    try {
        $checks['queue'] = [
            'driver' => config('queue.default'),
            'status' => 'configured',
        ];
    } catch (\Exception $e) {
        $checks['queue'] = [
            'status' => 'error',
            'message' => $e->getMessage(),
        ];
    }
    
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'checks' => $checks,
    ]);
})->middleware('auth:sanctum');

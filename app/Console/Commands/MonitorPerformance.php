<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MonitorPerformance extends Command
{
    protected $signature = 'monitor:performance {--json : Output as JSON}';
    protected $description = 'Monitor application performance metrics';

    public function handle(): int
    {
        $metrics = $this->collectMetrics();

        if ($this->option('json')) {
            $this->outputJson($metrics);
        } else {
            $this->outputHuman($metrics);
        }

        // Log metrics for monitoring systems
        Log::channel('production')->info('Performance Metrics', $metrics);

        return 0;
    }

    private function collectMetrics(): array
    {
        return [
            'timestamp' => now()->toIso8601String(),
            'server' => [
                'hostname' => gethostname(),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
            ],
            'database' => $this->getDatabaseMetrics(),
            'cache' => $this->getCacheMetrics(),
            'memory' => $this->getMemoryMetrics(),
            'queries' => $this->getSlowQueries(),
            'horizon' => $this->getHorizonMetrics(),
        ];
    }

    private function getDatabaseMetrics(): array
    {
        try {
            $size = DB::select("
                SELECT pg_size_pretty(pg_database_size(?)) as size,
                       pg_database_size(?) as size_bytes
            ", [config('database.connections.pgsql.database'), config('database.connections.pgsql.database')])[0];

            $connections = DB::select("
                SELECT count(*) as active_connections
                FROM pg_stat_activity
                WHERE datname = ?
            ", [config('database.connections.pgsql.database')])[0];

            return [
                'size' => $size->size,
                'size_bytes' => (int) $size->size_bytes,
                'active_connections' => (int) $connections->active_connections,
                'max_connections' => config('database.connections.pgsql.pooling.max_connections', 100),
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function getCacheMetrics(): array
    {
        try {
            $driver = config('cache.default');
            
            if ($driver === 'redis') {
                $redis = app()->make('redis');
                $info = $redis->info();
                
                return [
                    'driver' => 'redis',
                    'connected_clients' => $info['connected_clients'] ?? 0,
                    'used_memory' => $info['used_memory_human'] ?? 'unknown',
                    'hit_rate' => 'N/A',
                ];
            }

            return [
                'driver' => $driver,
                'status' => 'active',
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function getMemoryMetrics(): array
    {
        $memoryUsage = memory_get_usage(true);
        $memoryPeak = memory_get_peak_usage(true);
        $memoryLimit = ini_get('memory_limit');

        return [
            'current_usage' => $this->formatBytes($memoryUsage),
            'current_usage_bytes' => $memoryUsage,
            'peak_usage' => $this->formatBytes($memoryPeak),
            'peak_usage_bytes' => $memoryPeak,
            'memory_limit' => $memoryLimit,
        ];
    }

    private function getSlowQueries(): array
    {
        try {
            $slowQueries = DB::select("
                SELECT query,
                       calls,
                       mean_exec_time,
                       total_exec_time,
                       rows
                FROM pg_stat_statements
                WHERE mean_exec_time > 100
                ORDER BY mean_exec_time DESC
                LIMIT 10
            ");

            return collect($slowQueries)->map(function ($query) {
                return [
                    'query' => substr($query->query, 0, 200),
                    'calls' => $query->calls,
                    'avg_time_ms' => round($query->mean_exec_time, 2),
                    'total_time_ms' => round($query->total_exec_time, 2),
                    'rows' => $query->rows,
                ];
            })->toArray();
        } catch (\Exception $e) {
            return ['error' => 'pg_stat_statements not available or query failed'];
        }
    }

    private function getHorizonMetrics(): array
    {
        try {
            if (!class_exists('Laravel\Horizon\Horizon')) {
                return ['status' => 'not_installed'];
            }

            $stats = \Laravel\Horizon\Horizon::stats();
            
            return [
                'status' => 'active',
                'jobs_per_minute' => $stats->jobsPerMinute ?? 0,
                'processes_running' => $stats->processes ?? 0,
                'total_jobs' => $stats->totalJobs ?? 0,
                'failed_jobs' => $stats->failedJobs ?? 0,
                'wait_time' => $stats->wait ?? 0,
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private function outputJson(array $metrics): void
    {
        $this->line(json_encode($metrics, JSON_PRETTY_PRINT));
    }

    private function outputHuman(array $metrics): void
    {
        $this->info('═══════════════════════════════════════════════════════════');
        $this->info('           PERFORMANCE MONITORING REPORT');
        $this->info('═══════════════════════════════════════════════════════════');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Timestamp', $metrics['timestamp']],
                ['Hostname', $metrics['server']['hostname']],
                ['PHP Version', $metrics['server']['php_version']],
                ['Laravel Version', $metrics['server']['laravel_version']],
            ]
        );

        $this->info('Database:');
        if (isset($metrics['database']['error'])) {
            $this->error("  Error: {$metrics['database']['error']}");
        } else {
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Size', $metrics['database']['size']],
                    ['Active Connections', $metrics['database']['active_connections']],
                    ['Max Connections', $metrics['database']['max_connections']],
                ]
            );
        }

        $this->info('Memory Usage:');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Current Usage', $metrics['memory']['current_usage']],
                ['Peak Usage', $metrics['memory']['peak_usage']],
                ['Memory Limit', $metrics['memory']['memory_limit']],
            ]
        );

        $this->info('Slow Queries (>100ms):');
        if (empty($metrics['queries']) || isset($metrics['queries']['error'])) {
            $this->warn('  No slow queries found or pg_stat_statements not available');
        } else {
            $this->table(
                ['Query', 'Calls', 'Avg Time (ms)', 'Total Time (ms)'],
                collect($metrics['queries'])->map(function ($q) {
                    return [
                        substr($q['query'], 0, 50) . '...',
                        $q['calls'],
                        $q['avg_time_ms'],
                        $q['total_time_ms'],
                    ];
                })->toArray()
            );
        }

        $this->info('Horizon Queue:');
        if (isset($metrics['horizon']['error'])) {
            $this->error("  Error: {$metrics['horizon']['error']}");
        } elseif ($metrics['horizon']['status'] === 'not_installed') {
            $this->warn('  Horizon not installed');
        } else {
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Jobs/Minute', $metrics['horizon']['jobs_per_minute']],
                    ['Processes Running', $metrics['horizon']['processes_running']],
                    ['Failed Jobs', $metrics['horizon']['failed_jobs']],
                    ['Wait Time', $metrics['horizon']['wait_time'] . 's'],
                ]
            );
        }

        $this->info('═══════════════════════════════════════════════════════════');
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

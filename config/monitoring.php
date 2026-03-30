<?php

return [
    
    /*
    |--------------------------------------------------------------------------
    | Analytics & Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration controls monitoring, metrics, logging, and alerting
    | for the Rizquna ERP system. Managed by Agent 7.
    |
    */

    'enabled' => env('MONITORING_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Error Tracking (Sentry)
    |--------------------------------------------------------------------------
    */
    'error_tracking' => [
        'driver' => 'sentry',
        'enabled' => env('SENTRY_LARAVEL_DSN') !== null,
        'sample_rate' => (float) env('SENTRY_SAMPLE_RATE', 1.0),
        'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.1),
        'environment' => env('APP_ENV', 'production'),
    ],

    /*
    |--------------------------------------------------------------------------
    | APM (Application Performance Monitoring)
    |--------------------------------------------------------------------------
    */
    'apm' => [
        'enabled' => env('APM_ENABLED', env('APP_ENV') !== 'production'),
        'driver' => env('APM_DRIVER', 'telescope'), // 'telescope' or 'newrelic'
        'sample_rate' => (float) env('APM_SAMPLE_RATE', 1.0),
        
        'slow_query_threshold' => (int) env('SLOW_QUERY_THRESHOLD', 1000), // ms
        'slow_request_threshold' => (int) env('SLOW_REQUEST_THRESHOLD', 5000), // ms
        'n_plus_one_detection' => env('NPO_DETECTION', env('APP_ENV') !== 'production'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics & Prometheus
    |--------------------------------------------------------------------------
    */
    'metrics' => [
        'enabled' => env('METRICS_ENABLED', true),
        'driver' => 'prometheus',
        'endpoint' => env('METRICS_ENDPOINT', 'http://localhost:9090'),
        
        'expose_endpoint' => true, // GET /api/metrics
        'expose_path' => '/metrics',
        
        'retention_days' => env('METRICS_RETENTION_DAYS', 30),
        
        'collect' => [
            'http_requests' => true,
            'database_queries' => true,
            'cache_operations' => true,
            'job_execution' => true,
            'system_resources' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging & Log Aggregation
    |--------------------------------------------------------------------------
    */
    'logging' => [
        'enabled' => env('LOG_AGGREGATION_ENABLED', true),
        'driver' => env('LOG_DRIVER', 'stack'), // 'single', 'daily', 'syslog', 'errorlog'
        
        'aggregate' => [
            'enabled' => env('ELK_ENABLED', env('APP_ENV') === 'production'),
            'type' => 'elk', // 'elk' or 'cloudwatch'
            'endpoint' => env('ELK_ENDPOINT', 'http://localhost:9200'),
            'index_prefix' => env('LOG_INDEX_PREFIX', 'nre'),
        ],
        
        'channels' => [
            'app' => 'stack',
            'database' => 'single',
            'queries' => 'daily',
            'activity' => 'daily',
        ],
        
        'retention_days' => env('LOG_RETENTION_DAYS', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Dashboards & Visualization
    |--------------------------------------------------------------------------
    */
    'dashboards' => [
        'enabled' => env('DASHBOARD_ENABLED', true),
        'driver' => 'grafana',
        'endpoint' => env('GRAFANA_ENDPOINT', 'http://localhost:3000'),
        'api_key' => env('GRAFANA_API_KEY', ''),
        
        'dashboards' => [
            'system_health' => true,
            'api_performance' => true,
            'database_metrics' => true,
            'business_metrics' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Alerting & Notifications
    |--------------------------------------------------------------------------
    */
    'alerts' => [
        'enabled' => env('ALERTS_ENABLED', true),
        
        'thresholds' => [
            'error_rate' => (float) env('ALERT_ERROR_RATE', 0.05), // 5%
            'response_time_p95' => (int) env('ALERT_P95_MS', 1000), // 1 second
            'response_time_p99' => (int) env('ALERT_P99_MS', 5000), // 5 seconds
            'database_slow_query' => (int) env('ALERT_SLOW_QUERY_MS', 1000), // 1 second
            'memory_usage' => (int) env('ALERT_MEMORY_PERCENT', 80), // 80%
            'disk_usage' => (int) env('ALERT_DISK_PERCENT', 90), // 90%
            'database_connections' => (int) env('ALERT_DB_CONNECTIONS', 20),
        ],
        
        'channels' => [
            'slack' => [
                'enabled' => env('SLACK_ALERTS_ENABLED', false),
                'webhook' => env('SLACK_ALERTS_WEBHOOK'),
                'channel' => env('SLACK_ALERTS_CHANNEL', '#alerts'),
            ],
            'email' => [
                'enabled' => env('EMAIL_ALERTS_ENABLED', false),
                'recipients' => explode(',', env('ALERT_EMAIL_RECIPIENTS', '')),
            ],
            'pagerduty' => [
                'enabled' => env('PAGERDUTY_ENABLED', false),
                'integration_key' => env('PAGERDUTY_INTEGRATION_KEY'),
            ],
        ],
        
        'quiet_hours' => [
            'enabled' => false,
            'start' => '22:00',
            'end' => '06:00',
            'timezone' => 'Asia/Jakarta',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Activity Logging
    |--------------------------------------------------------------------------
    */
    'activity' => [
        'enabled' => env('ACTIVITY_LOGGING_ENABLED', true),
        'log_all_changes' => true,
        'log_auth_events' => true,
        'log_admin_actions' => true,
        'log_api_requests' => env('LOG_API_REQUESTS', env('APP_DEBUG')),
        'retention_days' => 90,
    ],

    /*
    |--------------------------------------------------------------------------
    | Security & Privacy
    |--------------------------------------------------------------------------
    */
    'privacy' => [
        'mask_email' => true,
        'mask_phone' => true,
        'mask_credit_card' => true,
        'exclude_paths' => [
            '/api/auth/*',
            '/admin/login',
            '/password/reset',
        ],
        'exclude_headers' => [
            'Authorization',
            'X-API-Key',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance & Storage
    |--------------------------------------------------------------------------
    */
    'performance' => [
        'batching_enabled' => true,
        'batch_size' => 100,
        'async_enabled' => true, // Use queue for heavy operations
        
        'cache' => [
            'enabled' => true,
            'ttl' => 3600, // 1 hour
        ],
    ],

];

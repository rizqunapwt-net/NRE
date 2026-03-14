<?php

/**
 * Sentry Laravel Configuration
 * Docs: https://docs.sentry.io/platforms/php/guides/laravel/
 */
return [
    'dsn' => env('SENTRY_LARAVEL_DSN', env('SENTRY_DSN')),

    // Capture bindings on SQL queries
    'breadcrumbs' => [
        'logs' => true,
        'sql_queries' => true,
        'sql_bindings' => true,
        'queue_info' => true,
        'command_info' => true,
        'http_client_requests' => true,
    ],

    // Set sample rate to 1.0 for capturing 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production.
    'traces_sample_rate' => ($sampleRate = env('SENTRY_TRACES_SAMPLE_RATE')) !== null
        ? (float) $sampleRate
        : 0.2,

    // Define the environments where Sentry should be active
    'environment' => env('APP_ENV'),

    'send_default_pii' => false,

    'ignore_exceptions' => [
        // Illuminate\Auth\AuthenticationException::class,
        // Illuminate\Validation\ValidationException::class,
    ],

    'ignore_transactions' => [
        // 'GET /health',
        // 'GET /api/v1/health',
    ],
];

<?php

return [
    // Storage
    'disk'   => env('BOOKS_DISK', 'books'),
    'bucket' => env('BOOKS_BUCKET', 'rizquna-books'),

    // Signed URL TTL (seconds)
    'signed_url_ttl'  => env('BOOKS_SIGNED_URL_TTL', 1800),   // 30 min (PDF full)
    'preview_url_ttl' => env('BOOKS_PREVIEW_URL_TTL', 3600),  // 1 hour (preview)
    'cover_url_ttl'   => env('BOOKS_COVER_URL_TTL', 3600),    // 1 hour (cover)

    // Upload limits
    'max_pdf_size'   => env('BOOKS_MAX_PDF_SIZE', 209715200),  // 200MB
    'max_cover_size' => env('BOOKS_MAX_COVER_SIZE', 10485760), // 10MB

    // Preview
    'preview_pages' => env('BOOKS_PREVIEW_PAGES', 10),

    // Maintenance
    'cleanup_chunk_size' => env('BOOKS_CLEANUP_CHUNK_SIZE', 200),
    'cover_download_timeout' => env('BOOKS_COVER_DOWNLOAD_TIMEOUT', 30),

    // Allowed MIME types
    'allowed_cover_types' => ['image/jpeg', 'image/png', 'image/webp'],
    'allowed_pdf_types'   => ['application/pdf'],

    // Cover thumbnail sizes [width, height]
    'cover_sizes' => [
        'large'  => [800, 1200],
        'medium' => [400, 600],
        'thumb'  => [200, 300],
    ],
];

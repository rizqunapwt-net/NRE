<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Service Account Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for Google Service Account
    | authentication. You can either provide the JSON credentials directly
    | via environment variable or reference a file path.
    |
    */

    'service_account' => [
        // Path to service account JSON key file
        'key_path' => env('GOOGLE_SERVICE_ACCOUNT_KEY_PATH', storage_path('app/google/service-account.json')),

        // Or provide JSON string directly (useful for cloud deployments)
        'json' => env('GOOGLE_SERVICE_ACCOUNT_JSON', null),

        // The email address of the service account
        'client_email' => env('GOOGLE_SERVICE_ACCOUNT_EMAIL', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Drive Configuration
    |--------------------------------------------------------------------------
    |
    | Configure Google Drive folders and settings for file storage.
    | Used for Digital Library book covers and PDFs.
    |
    */

    'drive' => [
        // Root folder ID for books (optional - will create if not exists)
        'books_root_folder_id' => env('GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID', null),

        // Folder ID for book covers
        'covers_folder_id' => env('GOOGLE_DRIVE_COVERS_FOLDER_ID', null),

        // Folder ID for book PDFs
        'pdfs_folder_id' => env('GOOGLE_DRIVE_PDFS_FOLDER_ID', null),

        // Default visibility for uploaded files
        'visibility' => env('GOOGLE_DRIVE_VISIBILITY', 'private'),

        // Chunk size for large file uploads (2MB default)
        'chunk_size' => (int) env('GOOGLE_DRIVE_CHUNK_SIZE', 2097152),

        // Scopes required for Drive API
        'scopes' => [
            \Google\Service\Drive::DRIVE,
            \Google\Service\Drive::DRIVE_FILE,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Sheets Configuration
    |--------------------------------------------------------------------------
    |
    | For library catalog synchronization.
    |
    */

    'sheets' => [
        // Spreadsheet ID for library catalog
        'library_id' => env('GOOGLE_SHEETS_LIBRARY_ID', null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Google OAuth Configuration
    |--------------------------------------------------------------------------
    |
    | For user authentication via Google.
    |
    */

    'oauth' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
    ],
];

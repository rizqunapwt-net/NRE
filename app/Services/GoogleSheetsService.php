<?php

namespace App\Services;

use Google_Client;
use Google_Service_Sheets;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class GoogleSheetsService
{
    protected Google_Client $client;
    protected Google_Service_Sheets $service;
    protected ?string $spreadsheetId;

    public function __construct()
    {
        $this->client = $this->createClient();
        $this->service = new Google_Service_Sheets($this->client);
        $this->spreadsheetId = config('google.sheets.library_id');
    }

    /**
     * Create and configure Google Client
     */
    protected function createClient(): Google_Client
    {
        $client = new Google_Client();
        $client->setApplicationName(config('app.name', 'Rizquna ERP'));
        $client->setScopes([
            Google_Service_Sheets::SPREADSHEETS_READONLY,
        ]);
        $client->setAccessType('offline');

        // Load credentials from JSON string or file path
        $json = config('google.service_account.json');
        $keyPath = config('google.service_account.key_path');

        if ($json) {
            $client->setAuthConfig(json_decode($json, true));
        } elseif (file_exists($keyPath)) {
            $client->setAuthConfig($keyPath);
        } else {
            throw new InvalidArgumentException(
                'Google service account credentials not configured. ' .
                'Set GOOGLE_SERVICE_ACCOUNT_JSON or create file at ' . $keyPath
            );
        }

        return $client;
    }

    /**
     * Get data from Google Sheets
     *
     * @param string $range Range like 'Sheet1!A:Z' or 'Sheet1!A2:Z1000'
     * @return array
     */
    public function getData(string $range = 'Sheet1!A2:Z1000'): array
    {
        $cacheKey = 'google_sheets_' . md5($this->spreadsheetId . '_' . $range);
        
        return Cache::remember($cacheKey, 3600, function () use ($range) {
            try {
                $response = $this->service->spreadsheets_values->get(
                    $this->spreadsheetId,
                    $range
                );

                $values = $response->getValues();
                
                Log::info('Google Sheets data fetched', [
                    'spreadsheet_id' => $this->spreadsheetId,
                    'range' => $range,
                    'rows' => count($values),
                ]);

                return $values;
            } catch (\Exception $e) {
                Log::error('Failed to fetch Google Sheets data', [
                    'error' => $e->getMessage(),
                    'spreadsheet_id' => $this->spreadsheetId,
                ]);

                return [];
            }
        });
    }

    /**
     * Get sheet metadata
     */
    public function getMetadata(): array
    {
        try {
            $spreadsheet = $this->service->spreadsheets->get($this->spreadsheetId);
            
            return [
                'title' => $spreadsheet->getProperties()->getTitle(),
                'sheets' => collect($spreadsheet->getSheets())
                    ->map(fn($sheet) => [
                        'title' => $sheet->getProperties()->getTitle(),
                        'rows' => $sheet->getProperties()->getGridProperties()['rowCount'] ?? 0,
                        'columns' => $sheet->getProperties()->getGridProperties()['columnCount'] ?? 0,
                    ])
                    ->toArray(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get Google Sheets metadata', [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Parse books data from Google Sheets
     * Assumes columns: Title, Subtitle, Author, ISBN, Publisher, Year, Category, Abstract, etc.
     */
    public function parseBooksData(): array
    {
        $rows = $this->getData();
        
        if (empty($rows)) {
            return [];
        }

        $books = [];
        
        foreach ($rows as $index => $row) {
            // Skip empty rows
            if (empty($row) || empty(trim($row[0] ?? ''))) {
                continue;
            }

            // Map columns (adjust based on your sheet structure)
            $book = [
                'row_number' => $index + 2, // +2 because we start from A2 and Excel is 1-indexed
                'title' => $row[0] ?? '',
                'subtitle' => $row[1] ?? '',
                'author' => $row[2] ?? '',
                'isbn' => $row[3] ?? '',
                'publisher' => $row[4] ?? '',
                'publisher_city' => $row[5] ?? '',
                'year' => $row[6] ?? '',
                'edition' => $row[7] ?? '',
                'pages' => $row[8] ?? '',
                'language' => $row[9] ?? '',
                'category' => $row[10] ?? '',
                'abstract' => $row[11] ?? '',
                'description' => $row[12] ?? '',
                'price' => $row[13] ?? '',
                'stock' => $row[14] ?? '',
                'cover_url' => $row[15] ?? '',
                'pdf_url' => $row[16] ?? '',
                'google_drive_id' => $row[17] ?? '',
                'status' => $row[18] ?? 'published',
                'notes' => $row[19] ?? '',
            ];

            // Only add if title exists
            if (!empty($book['title'])) {
                $books[] = $book;
            }
        }

        Log::info('Parsed books from Google Sheets', [
            'total' => count($books),
        ]);

        return $books;
    }

    /**
     * Sync books from Google Sheets to database
     */
    public function syncToDatabase(): array
    {
        $booksData = $this->parseBooksData();
        
        if (empty($booksData)) {
            return ['success' => false, 'message' => 'No data found in Google Sheets'];
        }

        $created = 0;
        $updated = 0;
        $errors = 0;

        foreach ($booksData as $bookData) {
            try {
                // Find or create author
                $author = \App\Models\Author::firstOrCreate(
                    ['name' => $bookData['author'] ?: 'Unknown Author']
                );

                // Find or create category
                $category = null;
                if (!empty($bookData['category'])) {
                    $category = \App\Models\Category::firstOrCreate(
                        ['name' => $bookData['category']]
                    );
                }

                // Generate slug
                $slug = \Str::slug($bookData['title']) ?: 'book-' . time();
                
                // Check if book exists by ISBN or slug
                $existingBook = null;
                if (!empty($bookData['isbn'])) {
                    $existingBook = \App\Models\Book::where('isbn', $bookData['isbn'])->first();
                }
                
                if (!$existingBook) {
                    $existingBook = \App\Models\Book::where('slug', $slug)->first();
                }

                if ($existingBook) {
                    // Update existing
                    $existingBook->update([
                        'title' => $bookData['title'],
                        'subtitle' => $bookData['subtitle'] ?: null,
                        'author_id' => $author->id,
                        'category_id' => $category?->id,
                        'isbn' => $bookData['isbn'] ?: null,
                        'publisher' => $bookData['publisher'] ?: null,
                        'publisher_city' => $bookData['publisher_city'] ?: null,
                        'year' => $bookData['year'] ?: null,
                        'published_year' => $bookData['year'] ?: null,
                        'edition' => $bookData['edition'] ?: null,
                        'page_count' => $bookData['pages'] ?: null,
                        'language' => $bookData['language'] ?: null,
                        'abstract' => $bookData['abstract'] ?: null,
                        'description' => $bookData['description'] ?: null,
                        'price' => $bookData['price'] ?: null,
                        'stock' => $bookData['stock'] ?: 0,
                        'is_published' => true,
                        'is_digital' => true,
                        'google_drive_cover_id' => $bookData['google_drive_id'] ?: null,
                    ]);
                    $updated++;
                } else {
                    // Create new
                    \App\Models\Book::create([
                        'type' => 'publishing',
                        'title' => $bookData['title'],
                        'subtitle' => $bookData['subtitle'] ?: null,
                        'slug' => $slug,
                        'author_id' => $author->id,
                        'category_id' => $category?->id,
                        'isbn' => $bookData['isbn'] ?: null,
                        'publisher' => $bookData['publisher'] ?: null,
                        'publisher_city' => $bookData['publisher_city'] ?: null,
                        'year' => $bookData['year'] ?: null,
                        'published_year' => $bookData['year'] ?: null,
                        'edition' => $bookData['edition'] ?: null,
                        'page_count' => $bookData['pages'] ?: null,
                        'language' => $bookData['language'] ?: null,
                        'abstract' => $bookData['abstract'] ?: null,
                        'description' => $bookData['description'] ?: null,
                        'price' => $bookData['price'] ?: null,
                        'stock' => $bookData['stock'] ?: 0,
                        'is_published' => true,
                        'is_digital' => true,
                        'google_drive_cover_id' => $bookData['google_drive_id'] ?: null,
                    ]);
                    $created++;
                }
            } catch (\Exception $e) {
                Log::error('Failed to sync book from Google Sheets', [
                    'book' => $bookData['title'],
                    'error' => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        return [
            'success' => true,
            'message' => "Synced: {$created} created, {$updated} updated, {$errors} errors",
            'created' => $created,
            'updated' => $updated,
            'errors' => $errors,
            'total' => count($booksData),
        ];
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncLibraryFromGoogle extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'library:sync-google';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync books and authors metadata from Google Sheets and files from Google Drive';

    private $driveService;
    private $sheetsService;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $spreadsheetId = env('GOOGLE_SHEETS_LIBRARY_ID');
        if (!$spreadsheetId) {
            $this->error('GOOGLE_SHEETS_LIBRARY_ID not set in .env');
            return 1;
        }

        $this->info('Initializing Google Client...');
        try {
            $client = $this->getGoogleClient();
            $this->sheetsService = new Sheets($client);
            $this->driveService = new Drive($client);
        } catch (\Exception $e) {
            $this->error('Failed to initialize Google Client: ' . $e->getMessage());
            return 1;
        }

        $this->info('Fetching data from Google Sheets...');
        $range = 'Books!A2:L100'; // Adjust range as needed
        $response = $this->sheetsService->spreadsheets_values->get($spreadsheetId, $range);
        $values = $response->getValues();

        if (empty($values)) {
            $this->warn('No data found in Google Sheets.');
            return 0;
        }

        $headers = ['title', 'author_name', 'author_email', 'isbn', 'price', 'category', 'description', 'language', 'is_digital', 'is_published', 'cover_drive_id', 'pdf_drive_id'];

        foreach ($values as $row) {
            // Pad row to match headers count
            $row = array_pad($row, count($headers), '');
            $data = array_combine($headers, $row);

            if (empty($data['title'])) continue;

            $this->info("Processing Book: {$data['title']}");

            // 1. Sync Author
            $author = Author::updateOrCreate(
                ['email' => $data['author_email']],
                ['name' => $data['author_name']]
            );

            // 2. Sync Category
            $category = Category::firstOrCreate(['name' => $data['category'] ?: 'Uncategorized']);

            // 3. Process Book Metadata
            $book = Book::updateOrCreate(
                ['title' => $data['title'], 'author_id' => $author->id],
                [
                    'isbn' => $data['isbn'],
                    'price' => floatval($data['price']),
                    'category_id' => $category->id,
                    'description' => $data['description'],
                    'language' => $data['language'] ?: 'Indonesia',
                    'is_digital' => strtolower($data['is_digital']) !== 'no',
                    'is_published' => strtolower($data['is_published']) !== 'no',
                    'published_at' => now(),
                    'type' => 'publishing',
                    'status' => 'published',
                ]
            );

            // 4. Download Cover
            if (!empty($data['cover_drive_id'])) {
                $this->downloadFileFromDrive($data['cover_drive_id'], $book, 'cover');
            }

            // 5. Download PDF
            if (!empty($data['pdf_drive_id'])) {
                $this->downloadFileFromDrive($data['pdf_drive_id'], $book, 'pdf');
            }

            $this->line("Successfully synced: {$book->title}");
        }

        $this->info('Library sync completed!');
        return 0;
    }

    private function getGoogleClient()
    {
        $client = new Client();
        $keyFile = storage_path('app/google/service-account.json');
        
        if (!file_exists($keyFile)) {
            throw new \Exception("Service account file not found at $keyFile");
        }

        $client->setAuthConfig($keyFile);
        $client->addScope(Drive::DRIVE_READONLY);
        $client->addScope(Sheets::SPREADSHEETS_READONLY);
        
        return $client;
    }

    private function downloadFileFromDrive($fileId, Book $book, $type)
    {
        try {
            $driveFile = $this->driveService->files->get($fileId, ['fields' => 'name,mimeType,size']);
            $extension = $type === 'cover' ? 'jpg' : 'pdf'; // Generic
            
            // Try to extract actual extension if possible
            if (str_contains($driveFile->getName(), '.')) {
                $extension = pathinfo($driveFile->getName(), PATHINFO_EXTENSION);
            }

            $fileName = "books/{$book->id}/" . ($type === 'cover' ? "cover_{$book->id}.{$extension}" : "full_{$book->id}.{$extension}");
            
            $this->comment("   Downloading {$type} for '{$book->title}'...");
            
            $content = $this->driveService->files->get($fileId, ['alt' => 'media']);
            $body = $content->getBody()->getContents();

            Storage::disk('books')->put($fileName, $body);

            if ($type === 'cover') {
                $book->update(['cover_path' => $fileName]);
            } else {
                $book->update(['pdf_full_path' => $fileName]);
                
                // Dispatch preview generation job
                \App\Jobs\GeneratePreviewPdf::dispatch($book, $fileName, (int) config('books.preview_pages', 10));
                $this->comment("   Preview generation dispatched.");
            }

        } catch (\Exception $e) {
            $this->error("   Failed to download {$type} ($fileId): " . $e->getMessage());
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use App\Models\BookPreview;
use App\Services\Google\GoogleWorkspaceService;
use Google\Service\Drive;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportBooksFromDrive extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'library:import-drive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import existing books from Google Drive folders (PDFs and Covers)';

    /**
     * Execute the console command.
     */
    public function handle(GoogleWorkspaceService $googleService)
    {
        if (!$googleService->isConfigured()) {
            $this->error('Google Workspace Service is not configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON or place service-account.json in storage/app/google/');
            return 1;
        }

        $coverFolderId = config('services.google.drive.covers_folder_id');
        $pdfFolderId = config('services.google.drive.pdfs_folder_id');

        if (!$coverFolderId || !$pdfFolderId) {
            $this->error('GOOGLE_DRIVE_COVERS_FOLDER_ID or GOOGLE_DRIVE_PDFS_FOLDER_ID not set in .env');
            return 1;
        }

        $this->info('Starting import from Google Drive...');

        // Initialize Google Drive Service from the client
        $drive = $googleService->drive();

        // 1. Fetch PDFs
        $this->info('Fetching PDF files...');
        $pdfs = $this->listFiles($drive, $pdfFolderId);
        $this->info('Found ' . count($pdfs) . ' PDF files.');

        // 2. Fetch Covers
        $this->info('Fetching Cover files...');
        $covers = $this->listFiles($drive, $coverFolderId);
        $this->info('Found ' . count($covers) . ' Cover files.');

        // 3. Match and Create/Update Books
        foreach ($pdfs as $pdf) {
            $baseName = $this->cleanName($pdf->getName());
            $this->comment("Processing: {$baseName}");

            // Find matching book in DB by title (loose match)
            $book = Book::where('title', 'like', '%' . trim($baseName) . '%')->first();

            if (!$book) {
                // Try to find author from filename or use a default
                $authorName = 'Rizquna Author';
                if (str_contains($pdf->getName(), '-')) {
                    $parts = explode('-', $pdf->getName());
                    $authorName = trim($parts[0]);
                }

                $author = Author::firstOrCreate(
                    ['name' => $authorName],
                    ['email' => Str::slug($authorName) . '@rizquna.id']
                );

                // Create Book
                $book = Book::create([
                    'title' => $baseName,
                    'author_id' => $author->id,
                    'type' => 'publishing',
                    'status' => 'published',
                    'is_digital' => true,
                    'is_published' => true,
                    'published_at' => now(),
                    'price' => 50000,
                    'description' => 'Buku digital impor dari Google Drive.',
                    'tracking_code' => 'NRE-' . strtoupper(Str::random(8)),
                ]);
            }

            if ($book->pdf_full_path && $book->cover_path) {
                continue;
            }

            // Download PDF if missing
            if (!$book->pdf_full_path || !Storage::disk('books')->exists($book->pdf_full_path)) {
                $this->downloadFile($googleService, $pdf->getId(), "{$book->id}/full_{$book->id}.pdf", $book, 'pdf');
            }

            // Find matching cover if missing
            if (!$book->cover_path || !Storage::disk('books')->exists($book->cover_path)) {
                $bestMatch = null;
                $highestScore = 0;

                foreach ($covers as $c) {
                    $cleanCover = $this->cleanName($c->getName());
                    if ($cleanCover == '') continue;

                    $bookWords = explode(' ', strtolower($baseName));
                    $coverWords = explode(' ', strtolower($cleanCover));
                    
                    // Filter out short words (min 3 chars) to avoid noise
                    $bookWords = array_filter($bookWords, fn($w) => strlen($w) > 2);
                    $coverWords = array_filter($coverWords, fn($w) => strlen($w) > 2);
                    
                    if (empty($coverWords)) continue;

                    $intersect = array_intersect($coverWords, $bookWords);
                    $score = count($intersect) / count($coverWords);

                    if ($score > 0.5 && $score > $highestScore) {
                        $highestScore = $score;
                        $bestMatch = $c;
                    }
                }

                if ($bestMatch) {
                    $this->info("   Found cover (Score: " . round($highestScore * 100) . "%): " . $bestMatch->getName());
                    $ext = pathinfo($bestMatch->getName(), PATHINFO_EXTENSION) ?: 'jpg';
                    $this->downloadFile($googleService, $bestMatch->getId(), "{$book->id}/cover_{$book->id}.{$ext}", $book, 'cover');
                } else {
                    $this->warn("   No cover found for: " . $baseName);
                }
            }
        }

        $this->info('Import process finished!');
        return 0;
    }

    private function listFiles($drive, $folderId)
    {
        $query = "'{$folderId}' in parents and trashed = false";
        $files = [];
        $pageToken = null;

        do {
            $response = $drive->files->listFiles([
                'q' => $query,
                'fields' => 'nextPageToken, files(id, name)',
                'pageToken' => $pageToken
            ]);
            $files = array_merge($files, (array) $response->getFiles());
            $pageToken = $response->getNextPageToken();
        } while ($pageToken);

        return $files;
    }

    private function cleanName($fileName)
    {
        $name = pathinfo($fileName, PATHINFO_FILENAME);
        
        // Normalize dashes and symbols
        $name = str_replace(['–', '—', '_', '.', '-'], ' ', $name);
        
        // Remove brackets and content inside
        $name = preg_replace('/\(.*?\)/', '', $name);
        $name = preg_replace('/\[.*?\]/', '', $name);

        // Common noise words (Case Insensitive)
        $noise = [
            'full_', 'cover_', 'PDF_', 'IMG_', 'Ebook', 'E-book', 'ISBN', 'PDF', 'A.png', 'A.jpg', 
            'Rev', 'Fix', 'Cetak', 'E Book', 'A -', 'A-', 'Buku', 'E-Book', 'Digital'
        ];
        
        foreach ($noise as $word) {
            $name = str_ireplace($word, '', $name);
        }

        // Remove special chars but keep numbers and letters
        $name = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        
        // Remove multi-spaces and trim
        $name = preg_replace('/\s+/', ' ', $name);
        
        return trim(ucwords(strtolower($name)));
    }

    private function downloadFile(GoogleWorkspaceService $googleService, $fileId, $storagePath, Book $book, $type)
    {
        try {
            $this->line("   Downloading {$type}...");
            
            $client = $googleService->client();
            $tokenArray = $client->fetchAccessTokenWithAssertion();
            $accessToken = $tokenArray['access_token'] ?? null;
            
            if (!$accessToken) {
                $this->error("      Failed to get access token.");
                return;
            }

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://www.googleapis.com/drive/v3/files/{$fileId}?alt=media");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $accessToken
            ]);
            
            $body = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || !$body) {
                $this->error("      Failed to download file content (HTTP $httpCode).");
                return;
            }

            Storage::disk('books')->put($storagePath, $body);

            if ($type === 'pdf') {
                $book->update(['pdf_full_path' => $storagePath]);
                // Antrekan Preview Generation
                \App\Jobs\GeneratePreviewPdf::dispatch($book, $storagePath, (int) config('books.preview_pages', 10));
            } else {
                $book->update(['cover_path' => $storagePath]);
            }
        } catch (\Exception $e) {
            $this->error("   Error downloading {$fileId}: " . $e->getMessage());
        }
    }
}

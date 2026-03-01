<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use App\Services\Google\GoogleWorkspaceService;
use Google\Service\Drive;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;

class ImportBooksFromExcel extends Command
{
    protected $signature = 'library:import-excel {--file= : Path to xlsx file} {--download : Download files from Drive}';
    protected $description = 'Import books from Katalog NRE Books Excel file with metadata + Drive file matching';

    private $accessToken = null;

    public function handle(GoogleWorkspaceService $googleService)
    {
        $filePath = $this->option('file') ?: storage_path('app/google/katalog.xlsx');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $this->info("Reading Excel: {$filePath}");

        $reader = new Xlsx();
        $spreadsheet = $reader->load($filePath);
        $sheet = $spreadsheet->getActiveSheet();
        $highestRow = $sheet->getHighestRow();

        $this->info("Found " . ($highestRow - 1) . " rows.");

        // Setup Google Drive
        if ($googleService->isConfigured()) {
            $drive = $googleService->drive();
            
            // Get access token for downloads
            $client = $googleService->client();
            $tokenArray = $client->fetchAccessTokenWithAssertion();
            $this->accessToken = $tokenArray['access_token'] ?? null;
        } else {
            $this->warn("Google Workspace Service not configured. Drive features will be disabled.");
            $drive = null;
        }

        // Fetch all files from Drive folders
        $coversFolderId = config('services.google.drive.covers_folder_id');
        $pdfsFolderId = config('services.google.drive.pdfs_folder_id');
        $covers = [];
        $pdfs = [];

        if ($drive && $coversFolderId) {
            $this->info("Fetching Cover files from Drive...");
            $covers = $this->listFiles($drive, $coversFolderId);
            $this->info("Found " . count($covers) . " covers.");
        } elseif (!$coversFolderId) {
            $this->warn("GOOGLE_DRIVE_COVERS_FOLDER_ID not set, skipping Drive covers.");
        }

        if ($drive && $pdfsFolderId) {
            $this->info("Fetching PDF files from Drive...");
            $pdfs = $this->listFiles($drive, $pdfsFolderId);
            $this->info("Found " . count($pdfs) . " PDFs.");
        } elseif (!$pdfsFolderId) {
            $this->warn("GOOGLE_DRIVE_PDFS_FOLDER_ID not set, skipping Drive PDFs.");
        }

        $imported = 0;
        $skipped = 0;
        $errors = 0;

        for ($row = 2; $row <= $highestRow; $row++) {
            $no        = $sheet->getCell("A{$row}")->getValue();
            $title     = trim($sheet->getCell("B{$row}")->getValue() ?? '');
            $authorName = trim($sheet->getCell("C{$row}")->getValue() ?? 'Rizquna Author');
            $isbn      = trim($sheet->getCell("D{$row}")->getValue() ?? '');
            $price     = (float) ($sheet->getCell("E{$row}")->getValue() ?? 50000);
            $desc      = trim($sheet->getCell("F{$row}")->getValue() ?? '');
            $coverId   = trim($sheet->getCell("G{$row}")->getValue() ?? '');
            $pdfId     = trim($sheet->getCell("H{$row}")->getValue() ?? '');

            if (empty($title)) {
                $this->warn("  Row {$row}: Empty title, skipping.");
                $skipped++;
                continue;
            }

            $this->comment("[{$no}] {$title}");

            // Create or find Author
            if (empty($authorName)) $authorName = 'Rizquna Author';
            
            // Handle multiple authors (separated by comma)
            $primaryAuthor = trim(explode(',', $authorName)[0]);
            $author = Author::where('name', $primaryAuthor)->first();
            if (!$author) {
                $slug = Str::slug($primaryAuthor);
                $email = $slug . '-' . Str::random(4) . '@rizquna.id';
                $author = Author::create([
                    'name' => $primaryAuthor,
                    'email' => $email,
                ]);
            }

            // Create or Update Book
            $book = Book::where('title', $title)->first();
            if (!$book) {
                $book = Book::create([
                    'title'        => $title,
                    'author_id'    => $author->id,
                    'type'         => 'publishing',
                    'status'       => 'published',
                    'is_digital'   => true,
                    'is_published' => true,
                    'published_at' => now(),
                    'year'         => date('Y'),
                    'published_year' => (int) date('Y'),
                    'publisher'    => 'Penerbit Rizquna Elfath',
                    'publisher_city' => 'Cirebon',
                    'price'        => $price > 0 ? $price : 50000,
                    'description'  => $desc,
                    'isbn'         => $isbn && $isbn !== '-' ? $isbn : null,
                    'tracking_code' => 'NRE-' . strtoupper(Str::random(8)),
                ]);
            } else {
                $book->update([
                    'author_id'    => $author->id,
                    'price'        => $price > 0 ? $price : $book->price,
                    'description'  => $desc ?: $book->description,
                    'isbn'         => ($isbn && $isbn !== '-') ? $isbn : $book->isbn,
                    'published_year' => $book->published_year ?: (int) date('Y'),
                    'publisher'    => $book->publisher ?: 'Penerbit Rizquna Elfath',
                    'publisher_city' => $book->publisher_city ?: 'Cirebon',
                ]);
            }

            // Match and download files only if --download is set
            if ($this->option('download')) {
                // Match PDF
                if (!$book->pdf_full_path || !Storage::disk('books')->exists($book->pdf_full_path)) {
                    $matchedPdf = $pdfId ? $this->findById($pdfs, $pdfId) : $this->findBestMatch($pdfs, $title);

                    if ($matchedPdf) {
                        $this->info("  PDF: " . $matchedPdf->getName());
                        $this->downloadFile($matchedPdf->getId(), "{$book->id}/full_{$book->id}.pdf", $book, 'pdf');
                    } else {
                        $this->warn("  No PDF match found.");
                    }
                }

                // Match Cover
                if (!$book->cover_path || !Storage::disk('books')->exists($book->cover_path)) {
                    $matchedCover = $coverId ? $this->findById($covers, $coverId) : $this->findBestMatch($covers, $title);

                    if ($matchedCover) {
                        $ext = pathinfo($matchedCover->getName(), PATHINFO_EXTENSION) ?: 'png';
                        $this->info("  Cover: " . $matchedCover->getName());
                        $this->downloadFile($matchedCover->getId(), "{$book->id}/cover_{$book->id}.{$ext}", $book, 'cover');
                    } else {
                        $this->warn("  No cover match found.");
                    }
                }
            }

            $imported++;
        }

        $this->newLine();
        $this->info("=== Import Complete ===");
        $this->info("Imported: {$imported}");
        $this->info("Skipped: {$skipped}");
        $this->info("Errors: {$errors}");

        return 0;
    }

    private function findById($files, $fileId)
    {
        foreach ($files as $f) {
            if ($f->getId() === $fileId) return $f;
        }
        return null;
    }

    private function findBestMatch($files, $bookTitle)
    {
        $cleanBook = $this->cleanName($bookTitle);
        $bookWords = array_filter(explode(' ', strtolower($cleanBook)), fn($w) => strlen($w) > 2);

        $bestMatch = null;
        $highestScore = 0;

        foreach ($files as $f) {
            $cleanFile = $this->cleanName($f->getName());
            if ($cleanFile == '') continue;

            $fileWords = array_filter(explode(' ', strtolower($cleanFile)), fn($w) => strlen($w) > 2);
            if (empty($fileWords)) continue;

            $intersect = array_intersect($fileWords, $bookWords);
            $score = count($intersect) / max(count($fileWords), 1);

            // Also check containment
            $b = strtolower($cleanBook);
            $f_name = strtolower($cleanFile);
            if (str_contains($b, $f_name) || str_contains($f_name, $b)) {
                $score = 1.0;
            }

            // Similarity fallback
            if ($score < 0.5) {
                similar_text($b, $f_name, $percent);
                if ($percent > 70) {
                    $score = $percent / 100;
                }
            }

            if ($score > 0.5 && $score > $highestScore) {
                $highestScore = $score;
                $bestMatch = $f;
            }
        }

        return $bestMatch;
    }

    private function cleanName($fileName)
    {
        $name = pathinfo($fileName, PATHINFO_FILENAME);
        $name = str_replace(['–', '—', '_', '.', '-'], ' ', $name);
        $name = preg_replace('/\(.*?\)/', '', $name);
        $name = preg_replace('/\[.*?\]/', '', $name);

        $noise = ['full_', 'cover_', 'PDF_', 'IMG_', 'Ebook', 'E-book', 'ISBN', 'PDF',
            'A.png', 'A.jpg', 'Rev', 'Fix', 'Cetak', 'E Book', 'A ', 'Buku', 'E-Book', 'Digital'];
        foreach ($noise as $word) {
            $name = str_ireplace($word, '', $name);
        }

        $name = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);
        return trim(strtolower($name));
    }

    private function downloadFile($fileId, $storagePath, Book $book, $type)
    {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, "https://www.googleapis.com/drive/v3/files/{$fileId}?alt=media");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $this->accessToken]);

            $body = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || !$body) {
                $this->error("    Download failed (HTTP {$httpCode}).");
                return;
            }

            Storage::disk('books')->put($storagePath, $body);

            if ($type === 'pdf') {
                $book->update(['pdf_full_path' => $storagePath]);
            } else {
                $book->update(['cover_path' => $storagePath]);
            }
        } catch (\Exception $e) {
            $this->error("    Error: " . $e->getMessage());
        }
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
}

<?php

namespace App\Console\Commands;

use App\Models\Author;
use App\Models\Book;
use App\Models\Category;
use App\Services\BookStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportBooksFromFolder extends Command
{
    protected $signature = 'books:import
        {path : Path ke folder buku di local PC}
        {--dry-run : Simulasi tanpa menyimpan data}
        {--skip-upload : Skip upload file ke MinIO}';

    protected $description = 'Import buku dari folder lokal ke database dan MinIO (2-phase commit)';

    private int $success = 0;
    private int $failed = 0;
    private int $skipped = 0;
    private string $batchId;

    public function handle(BookStorageService $storage): int
    {
        $basePath = $this->argument('path');
        $isDryRun = $this->option('dry-run');
        $skipUpload = $this->option('skip-upload');

        if (!is_dir($basePath)) {
            $this->error("Folder tidak ditemukan: {$basePath}");
            return 1;
        }

        $this->batchId = 'import_' . now()->format('Ymd_His');
        $this->info("📚 Import Batch: {$this->batchId}");
        $this->info("📂 Scanning folder: {$basePath}");
        
        if ($isDryRun) {
            $this->warn("🔸 DRY RUN MODE — tidak ada data yang disimpan");
        }

        $folders = glob("{$basePath}/*/", GLOB_ONLYDIR);
        $this->info("📁 Ditemukan " . count($folders) . " subfolder");

        $bar = $this->output->createProgressBar(count($folders));

        foreach ($folders as $folder) {
            try {
                $this->processFolder($folder, $storage, $isDryRun, $skipUpload);
                $this->success++;
            } catch (\Throwable $e) {
                $this->failed++;
                $this->error("\n❌ Error di {$folder}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Status', 'Jumlah'],
            [
                ['✅ Berhasil', $this->success],
                ['❌ Gagal', $this->failed],
                ['⏭️ Dilewati', $this->skipped],
                ['📊 Total', $this->success + $this->failed + $this->skipped],
            ]
        );

        return 0;
    }

    /**
     * Process satu folder buku (2-phase commit: DB first, then upload).
     */
    private function processFolder(
        string $folder,
        BookStorageService $storage,
        bool $isDryRun,
        bool $skipUpload
    ): void {
        $folderName = basename($folder);

        // Cari file di folder
        $coverFile = $this->findFile($folder, ['jpg', 'jpeg', 'png', 'webp']);
        $pdfFile = $this->findFile($folder, ['pdf']);
        $metadataFile = $this->findFile($folder, ['xlsx', 'csv', 'json']);

        if (!$pdfFile && !$coverFile) {
            $this->skipped++;
            $this->line("\n⏭️ Skip {$folderName}: tidak ada PDF atau cover");
            return;
        }

        // Parse metadata
        $metadata = $this->parseMetadata($folder, $folderName, $metadataFile);

        $this->line("\n📖 Processing: {$metadata['title']}");

        // ─── PHASE 1: Database Transaction (Cepat, <10ms) ───
        $book = null;
        $uploadData = [];

        DB::transaction(function () use ($metadata, $coverFile, $pdfFile, &$book, &$uploadData, $isDryRun, $folderName) {
            if ($isDryRun) {
                $this->info("  [DRY RUN] Would create book: {$metadata['title']}");
                return;
            }

            // Cek duplicate (idempotent import)
            $existing = $this->findExistingBook($metadata, $coverFile, $pdfFile);
            if ($existing) {
                $this->skipped++;
                $this->warn("  ⏭️ Skipped (already exists): {$metadata['title']} (ID: {$existing->id})");
                throw new \Exception('Book already exists');
            }

            // Create/find author
            $author = Author::firstOrCreate(
                ['name' => $metadata['author']],
                ['email' => Str::slug($metadata['author']) . '@placeholder.local']
            );

            // Create/find category
            $category = null;
            if (!empty($metadata['category'])) {
                $category = Category::firstOrCreate(
                    ['name' => $metadata['category']],
                    ['slug' => Str::slug($metadata['category'])]
                );
            }

            // Create book (PHASE 1 - DB only)
            $book = Book::create([
                'type' => 'publishing',
                'status' => 'importing', // ← Status importing, bukan published
                'title' => $metadata['title'],
                'slug' => Str::slug($metadata['title']) . '-' . Str::random(5),
                'author_id' => $author->id,
                'category_id' => $category?->id,
                'isbn' => $metadata['isbn'] ?? null,
                'price' => $metadata['price'] ?? 0,
                'original_price' => $metadata['original_price'] ?? null,
                'description' => $metadata['description'] ?? null,
                'page_count' => $metadata['page_count'] ?? null,
                'language' => $metadata['language'] ?? 'Bahasa Indonesia',
                'dimension' => $metadata['dimension'] ?? null,
                'published_year' => $metadata['year'] ?? date('Y'),
                'is_published' => false, // ← Published setelah upload selesai
                'is_digital' => true,
                'import_batch_id' => $this->batchId,
                'import_source' => 'folder:' . $folderName,
            ]);

            // Simpan data untuk upload (PHASE 2)
            $uploadData = [
                'coverFile' => $coverFile,
                'pdfFile' => $pdfFile,
            ];
        });

        if ($isDryRun || $skipUpload || !$book) {
            return;
        }

        // ─── PHASE 2: Upload Files (Di luar DB Transaction) ───
        try {
            if ($coverFile) {
                $uploaded = new \Illuminate\Http\UploadedFile(
                    $coverFile,
                    basename($coverFile),
                    null,
                    null,
                    true
                );
                $storage->uploadCover($book, $uploaded);
                $this->info("  ✅ Cover uploaded");
            }

            if ($pdfFile) {
                $uploaded = new \Illuminate\Http\UploadedFile(
                    $pdfFile,
                    basename($pdfFile),
                    null,
                    null,
                    true
                );
                $storage->uploadFullPdf($book, $uploaded);
                $this->info("  ✅ PDF uploaded (preview will be generated via queue)");
            }

            // Update status menjadi published setelah upload berhasil
            $book->update([
                'status' => 'published',
                'is_published' => true,
                'published_at' => now(),
            ]);

            $this->success++;

        } catch (\Throwable $e) {
            // Upload gagal - update status error
            $book->update([
                'status' => 'upload_failed',
                'import_error' => $e->getMessage(),
            ]);

            $this->error("  ❌ Upload failed: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Cari buku yang sudah ada (duplicate check).
     */
    private function findExistingBook(array $metadata, ?string $coverFile, ?string $pdfFile): ?Book
    {
        // Cek by ISBN
        if (!empty($metadata['isbn'])) {
            $existing = Book::where('isbn', $metadata['isbn'])->first();
            if ($existing) {
                return $existing;
            }
        }

        // Cek by title + author
        $author = Author::where('nama', $metadata['author'])->first();
        if ($author) {
            $existing = Book::where('title', $metadata['title'])
                ->where('author_id', $author->id)
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        // Cek by PDF checksum (jika ada)
        if ($pdfFile) {
            $checksum = hash_file('sha256', $pdfFile);
            $existing = Book::where('file_checksum', $checksum)->first();
            if ($existing) {
                return $existing;
            }
        }

        return null;
    }

    private function findFile(string $folder, array $extensions): ?string
    {
        foreach ($extensions as $ext) {
            $files = glob("{$folder}/*.{$ext}", GLOB_BRACE);
            if (!empty($files)) {
                return $files[0];
            }
        }
        return null;
    }

    private function parseMetadata(string $folder, string $folderName, ?string $metadataFile): array
    {
        // Default: parse dari nama folder
        $metadata = [
            'title' => str_replace(['-', '_'], ' ', $folderName),
            'author' => 'Unknown Author',
            'price' => 0,
            'original_price' => null,
            'category' => null,
            'description' => null,
            'page_count' => null,
            'language' => 'Bahasa Indonesia',
            'dimension' => null,
            'year' => date('Y'),
            'isbn' => null,
        ];

        // Jika ada file metadata JSON
        if ($metadataFile && str_ends_with($metadataFile, '.json')) {
            $json = json_decode(file_get_contents($metadataFile), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $metadata = array_merge($metadata, $json);
            }
        }

        // Jika ada info.txt di folder
        $infoFile = "{$folder}/info.txt";
        if (file_exists($infoFile)) {
            $lines = file($infoFile, FILE_IGNORE_NEW_LINES);
            foreach ($lines as $line) {
                if (str_contains($line, ':')) {
                    [$key, $value] = explode(':', $line, 2);
                    $metadata[strtolower(trim($key))] = trim($value);
                }
            }
        }

        return $metadata;
    }
}

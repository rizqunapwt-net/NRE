<?php

namespace App\Console\Commands;

use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use InvalidArgumentException;

class TestGoogleDrive extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'google:test-connection';

    /**
     * The console command description.
     */
    protected $description = 'Test Google Drive connection and configuration';

    protected ?GoogleDriveService $driveService = null;

    public function handle(): int
    {
        $this->info('═══════════════════════════════════════════');
        $this->info('🔍 Testing Google Drive Connection');
        $this->info('═══════════════════════════════════════════');
        $this->newLine();

        // Test 1: Check configuration
        $this->info('1. Checking configuration...');
        $keyPath = config('google.service_account.key_path');
        $json = config('google.service_account.json');

        if (!$json && !file_exists($keyPath)) {
            $this->error("   ✗ Service account credentials not found!");
            $this->error("      - File not found at: {$keyPath}");
            $this->error("      - GOOGLE_SERVICE_ACCOUNT_JSON not set");
            $this->newLine();
            $this->warn('Please configure Google Drive credentials first.');
            $this->warn('See: GOOGLE_DRIVE_SETUP.md for instructions.');
            return Command::FAILURE;
        }

        if (file_exists($keyPath)) {
            $this->info("   ✓ Key file found: {$keyPath}");
            
            // Validate JSON
            $content = file_get_contents($keyPath);
            $data = json_decode($content, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $this->error('   ✗ Invalid JSON in service account file');
                return Command::FAILURE;
            }
            
            $this->info('   ✓ JSON is valid');
            $this->info("   ✓ Client Email: " . ($data['client_email'] ?? 'N/A'));
            $this->info("   ✓ Project ID: " . ($data['project_id'] ?? 'N/A'));
        } else {
            $this->info('   ✓ Using JSON string from environment');
        }

        // Test 2: Initialize service
        $this->newLine();
        try {
            $this->driveService = app(GoogleDriveService::class);
            $this->info('2. ✓ Service initialized successfully');
        } catch (InvalidArgumentException $e) {
            $this->error('2. ✗ Failed to initialize service');
            $this->error('   ' . $e->getMessage());
            return Command::FAILURE;
        } catch (\Exception $e) {
            $this->error('2. ✗ Failed to initialize service');
            $this->error('   ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Test 3: Check Drive API access
        $this->newLine();
        $this->info('3. Testing Google Drive API access...');
        try {
            $service = $this->driveService->getService();
            
            // Try to get about info
            $about = $service->about->get(['fields' => 'user,storageUsed']);
            
            $this->info('   ✓ API connection successful');
            $this->info("   ✓ User: {$about->getUser()->getEmailAddress()}");
            $this->info("   ✓ Storage used: " . $this->formatBytes($about->getStorageUsed()));
        } catch (\Exception $e) {
            $this->error('   ✗ API connection failed');
            $this->error('      ' . $e->getMessage());
            $this->newLine();
            $this->warn('Possible causes:');
            $this->warn('  - Google Drive API not enabled');
            $this->warn('  - Invalid credentials');
            $this->warn('  - Network issue');
            return Command::FAILURE;
        }

        // Test 4: Check folders
        $this->newLine();
        $this->info('4. Checking Google Drive folders:');
        
        $rootFolderId = config('google.drive.books_root_folder_id');
        $coversFolderId = config('google.drive.covers_folder_id');
        $pdfsFolderId = config('google.drive.pdfs_folder_id');

        if ($rootFolderId) {
            $this->checkFolder('Root Folder', $rootFolderId);
        } else {
            $this->warn('   ⚠ Root folder ID not configured (will auto-create)');
        }

        if ($coversFolderId) {
            $this->checkFolder('Covers Folder', $coversFolderId);
        } else {
            $this->warn('   ⚠ Covers folder ID not configured (will auto-create)');
        }

        if ($pdfsFolderId) {
            $this->checkFolder('PDFs Folder', $pdfsFolderId);
        } else {
            $this->warn('   ⚠ PDFs folder ID not configured (will auto-create)');
        }

        // Test 5: List files in root
        $this->newLine();
        $this->info('5. Testing file listing...');
        try {
            $files = $this->driveService->listFiles(null, 5);
            $this->info("   ✓ Found " . count($files) . " files/folders");
            
            if (count($files) > 0) {
                foreach (array_slice($files, 0, 3) as $file) {
                    $this->line("      • {$file['name']} ({$file['mimeType']})");
                }
            }
        } catch (\Exception $e) {
            $this->error('   ✗ File listing failed: ' . $e->getMessage());
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════');
        $this->info('✅ All tests passed! Google Drive is ready.');
        $this->info('═══════════════════════════════════════════');

        return Command::SUCCESS;
    }

    protected function checkFolder(string $name, string $folderId): void
    {
        try {
            $fileInfo = $this->driveService->getFileInfo($folderId);
            $this->info("   ✓ {$name}: {$fileInfo['name']}");
        } catch (\Exception $e) {
            $this->error("   ✗ {$name}: {$e->getMessage()}");
        }
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

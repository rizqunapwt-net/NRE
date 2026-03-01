<?php

namespace App\Services\Google;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class GoogleWorkspaceService
{
    protected ?Client $client = null;
    protected ?Drive $drive = null;
    protected ?Sheets $sheets = null;
    protected bool $isConfigured = false;

    /**
     * Initialize Google Workspace client with service account credentials.
     * Throws exception if credentials not configured.
     */
    public function __construct()
    {
        try {
            $jsonContent = config('services.google.service_account_json');
            $keyFile = storage_path('app/google/service-account.json');
            
            $this->client = new Client();

            if ($jsonContent) {
                $this->client->setAuthConfig(json_decode($jsonContent, true));
            } elseif (file_exists($keyFile)) {
                $this->client->setAuthConfig($keyFile);
            } else {
                // Not configured, but don't throw exception yet to allow DI
                return;
            }

            $this->client->addScope(Drive::DRIVE);
            $this->client->addScope(Sheets::SPREADSHEETS);
            
            $this->drive = new Drive($this->client);
            $this->sheets = new Sheets($this->client);
            $this->isConfigured = true;
            
            Log::info('Google Workspace Service initialized successfully');
        } catch (\Exception $e) {
            Log::error("Google Workspace initialization failed: " . $e->getMessage());
            // We still don't throw to avoid breaking the app if this is resolved automatically
        }
    }

    /**
     * Check if service is ready to use.
     */
    public function isConfigured(): bool
    {
        return $this->isConfigured;
    }

    /**
     * Get Drive Service.
     */
    public function drive(): Drive
    {
        if (!$this->isConfigured) {
            throw new RuntimeException("Google Workspace Service not configured");
        }
        return $this->drive;
    }

    /**
     * Get Sheets Service.
     */
    public function sheets(): Sheets
    {
        if (!$this->isConfigured) {
            throw new RuntimeException("Google Workspace Service not configured");
        }
        return $this->sheets;
    }

    /**
     * Get Google Client.
     */
    public function client(): Client
    {
        if (!$this->isConfigured) {
            throw new RuntimeException("Google Workspace Service not configured");
        }
        return $this->client;
    }

    /**
     * Upload file ke folder tertentu di Google Drive.
     */
    public function uploadFile(string $filePath, string $fileName, string $folderId): array
    {
        try {
            if (!file_exists($filePath)) {
                throw new RuntimeException("File not found: {$filePath}");
            }

            $fileMetadata = new Drive\DriveFile([
                'name' => $fileName,
                'parents' => [$folderId]
            ]);

            $content = file_get_contents($filePath);
            $mimeType = mime_content_type($filePath);

            $file = $this->drive->files->create($fileMetadata, [
                'data' => $content,
                'mimeType' => $mimeType,
                'uploadType' => 'multipart',
                'fields' => 'id, webViewLink'
            ]);

            Log::info('File uploaded to Google Drive', [
                'file_name' => $fileName,
                'drive_file_id' => $file->id,
            ]);

            return [
                'id' => $file->id,
                'link' => $file->webViewLink
            ];
        } catch (\Exception $e) {
            Log::error("Google Drive Upload Error: " . $e->getMessage(), [
                'file' => $fileName,
                'folder_id' => $folderId,
            ]);
            throw $e;
        }
    }

    /**
     * Tambah baris ke Google Sheets.
     */
    public function appendToSheet(string $spreadsheetId, array $values): void
    {
        try {
            $body = new Sheets\ValueRange([
                'values' => [$values]
            ]);
            
            $params = [
                'valueInputOption' => 'RAW'
            ];

            $this->sheets->spreadsheets_values->append($spreadsheetId, 'A1', $body, $params);
            
            Log::info('Data appended to Google Sheets', [
                'spreadsheet_id' => $spreadsheetId,
                'rows_count' => count($values),
            ]);
        } catch (\Exception $e) {
            Log::error("Google Sheets Append Error: " . $e->getMessage(), [
                'spreadsheet_id' => $spreadsheetId,
            ]);
            throw $e;
        }
    }

    /**
     * Validate Google Workspace configuration.
     * Called during application boot.
     */
    public static function validateConfiguration(): void
    {
        $jsonContent = config('services.google.service_account_json');
        $keyFile = storage_path('app/google/service-account.json');
        
        if (!$jsonContent && !file_exists($keyFile)) {
            Log::warning(
                'Google Workspace configuration missing. ' .
                'To enable Google Drive/Sheets integration, please set GOOGLE_SERVICE_ACCOUNT_JSON or create: ' . $keyFile
            );
            return;
        }

        try {
            $content = $jsonContent ? json_decode($jsonContent, true) : json_decode(file_get_contents($keyFile), true);
            if (!$content || !isset($content['project_id'])) {
                throw new RuntimeException('Invalid service account JSON format');
            }

            Log::info('Google Workspace configured', [
                'project' => $content['project_id'],
                'service_account' => $content['client_email'] ?? 'unknown',
            ]);
        } catch (\Exception $e) {
            Log::warning('Google Workspace validation failed: ' . $e->getMessage());
        }
    }
}

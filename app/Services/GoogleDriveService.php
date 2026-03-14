<?php

namespace App\Services;

use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_DriveFile;
use Google_Service_Drive_Permission;
use Google_Http_MediaFileUpload;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;

class GoogleDriveService
{
    protected Google_Client $client;
    protected Google_Service_Drive $service;
    protected ?string $coversFolderId;
    protected ?string $pdfsFolderId;
    protected ?string $booksRootFolderId;
    protected string $visibility;
    protected int $chunkSize;

    public function __construct()
    {
        $this->client = $this->createClient();
        $this->service = new Google_Service_Drive($this->client);
        
        $this->coversFolderId = config('google.drive.covers_folder_id');
        $this->pdfsFolderId = config('google.drive.pdfs_folder_id');
        $this->booksRootFolderId = config('google.drive.books_root_folder_id');
        $this->visibility = config('google.drive.visibility', 'private');
        $this->chunkSize = config('google.drive.chunk_size', 2097152);
    }

    /**
     * Create and configure Google Client
     */
    protected function createClient(): Google_Client
    {
        $client = new Google_Client();
        $client->setApplicationName(config('app.name', 'Rizquna ERP'));
        $client->setScopes(config('google.drive.scopes'));
        $client->setAccessType('offline');
        $client->setPrompt('select_account consent');

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
     * Get the Google Drive service instance
     */
    public function getService(): Google_Service_Drive
    {
        return $this->service;
    }

    /**
     * Get the Google Client instance
     */
    public function getClient(): Google_Client
    {
        return $this->client;
    }

    /**
     * Upload a file to Google Drive
     *
     * @param string $filePath Path to the local file
     * @param string $filename Name for the file in Drive
     * @param string|null $folderId Folder ID to upload to (null = root)
     * @param string $mimeType MIME type of the file
     * @return array File information including ID and webContentLink
     */
    public function uploadFile(
        string $filePath,
        string $filename,
        ?string $folderId = null,
        string $mimeType = 'application/octet-stream'
    ): array {
        if (!file_exists($filePath)) {
            throw new InvalidArgumentException("File not found: {$filePath}");
        }

        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $filename,
            'description' => 'Uploaded by Rizquna ERP - ' . now()->format('Y-m-d H:i:s'),
        ]);

        if ($folderId) {
            $fileMetadata->setParents([$folderId]);
        }

        $content = file_get_contents($filePath);
        $fileSize = filesize($filePath);

        // Use chunked upload for large files
        $upload = $this->createMediaUpload($fileMetadata, $mimeType, $content, $fileSize);
        $uploadedFile = $upload->nextChunk();

        // Set file visibility
        if ($this->visibility === 'anyone_with_link') {
            $this->setPublicPermission($uploadedFile->getId());
        }

        Log::info('File uploaded to Google Drive', [
            'filename' => $filename,
            'file_id' => $uploadedFile->getId(),
            'folder_id' => $folderId,
            'size' => $fileSize,
        ]);

        return [
            'id' => $uploadedFile->getId(),
            'name' => $uploadedFile->getName(),
            'mimeType' => $uploadedFile->getMimeType(),
            'size' => $uploadedFile->getSize(),
            'webContentLink' => $uploadedFile->getWebContentLink(),
            'webViewLink' => $uploadedFile->getWebViewLink(),
            'thumbnailLink' => $uploadedFile->getThumbnailLink(),
            'folder_id' => $folderId,
        ];
    }

    /**
     * Upload book cover to Google Drive
     */
    public function uploadBookCover(string $filePath, string $bookSlug, string $extension = 'jpg'): array
    {
        $filename = "{$bookSlug}-cover.{$extension}";
        $folderId = $this->getCoversFolderId();
        
        return $this->uploadFile($filePath, $filename, $folderId, 'image/' . $extension);
    }

    /**
     * Upload book PDF to Google Drive
     */
    public function uploadBookPdf(string $filePath, string $bookSlug): array
    {
        $filename = "{$bookSlug}.pdf";
        $folderId = $this->getPdfsFolderId();
        
        return $this->uploadFile($filePath, $filename, $folderId, 'application/pdf');
    }

    /**
     * Delete a file from Google Drive
     */
    public function deleteFile(string $fileId): bool
    {
        try {
            $this->service->files->delete($fileId);
            Log::info('File deleted from Google Drive', ['file_id' => $fileId]);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete file from Google Drive', [
                'file_id' => $fileId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete book cover from Google Drive
     */
    public function deleteBookCover(string $bookSlug): bool
    {
        $fileId = $this->findFileByName("{$bookSlug}-cover", $this->getCoversFolderId());
        if ($fileId) {
            return $this->deleteFile($fileId);
        }
        return false;
    }

    /**
     * Delete book PDF from Google Drive
     */
    public function deleteBookPdf(string $bookSlug): bool
    {
        $fileId = $this->findFileByName("{$bookSlug}", $this->getPdfsFolderId(), '.pdf');
        if ($fileId) {
            return $this->deleteFile($fileId);
        }
        return false;
    }

    /**
     * Get a download URL for a file
     */
    public function getDownloadUrl(string $fileId): string
    {
        $file = $this->service->files->get($fileId, ['fields' => 'webContentLink']);
        return $file->getWebContentLink() ?? '';
    }

    /**
     * Get a view URL for a file
     */
    public function getViewUrl(string $fileId): string
    {
        $file = $this->service->files->get($fileId, ['fields' => 'webViewLink']);
        return $file->getWebViewLink() ?? '';
    }

    /**
     * Create a folder in Google Drive
     */
    public function createFolder(string $name, ?string $parentFolderId = null): string
    {
        $fileMetadata = new Google_Service_Drive_DriveFile([
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
        ]);

        if ($parentFolderId) {
            $fileMetadata->setParents([$parentFolderId]);
        }

        $folder = $this->service->files->create($fileMetadata, ['fields' => 'id']);
        
        Log::info('Folder created in Google Drive', [
            'name' => $name,
            'folder_id' => $folder->getId(),
            'parent_id' => $parentFolderId,
        ]);

        return $folder->getId();
    }

    /**
     * Get or create the covers folder
     */
    public function getCoversFolderId(): string
    {
        if ($this->coversFolderId) {
            return $this->coversFolderId;
        }

        // Try to find existing folder
        $folderId = $this->findFolderByName('Book Covers');
        
        if (!$folderId) {
            $folderId = $this->createFolder('Book Covers', $this->booksRootFolderId);
        }

        $this->coversFolderId = $folderId;
        return $folderId;
    }

    /**
     * Get or create the PDFs folder
     */
    public function getPdfsFolderId(): string
    {
        if ($this->pdfsFolderId) {
            return $this->pdfsFolderId;
        }

        // Try to find existing folder
        $folderId = $this->findFolderByName('Book PDFs');
        
        if (!$folderId) {
            $folderId = $this->createFolder('Book PDFs', $this->booksRootFolderId);
        }

        $this->pdfsFolderId = $folderId;
        return $folderId;
    }

    /**
     * Find a folder by name
     */
    protected function findFolderByName(string $name, ?string $parentFolderId = null): ?string
    {
        $query = "mimeType='application/vnd.google-apps.folder' and name='{$name}' and trashed=false";
        
        if ($parentFolderId) {
            $query .= " and '{$parentFolderId}' in parents";
        }

        $response = $this->service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name)',
            'pageSize' => 1,
        ]);

        $files = $response->getFiles();
        return !empty($files) ? $files[0]->getId() : null;
    }

    /**
     * Find a file by name in a specific folder
     */
    protected function findFileByName(string $name, ?string $folderId = null, string $extension = ''): ?string
    {
        $query = "name contains '{$name}' and trashed=false";
        
        if ($folderId) {
            $query .= " and '{$folderId}' in parents";
        }

        if ($extension) {
            $query .= " and name endsWith '{$extension}'";
        }

        $response = $this->service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name)',
            'pageSize' => 10,
        ]);

        $files = $response->getFiles();
        return !empty($files) ? $files[0]->getId() : null;
    }

    /**
     * Set public permission for a file (anyone with link can view)
     */
    protected function setPublicPermission(string $fileId): void
    {
        $permission = new Google_Service_Drive_Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]);

        $this->service->permissions->create($fileId, $permission, [
            'fields' => 'id',
        ]);

        Log::info('Public permission set for file', ['file_id' => $fileId]);
    }

    /**
     * Share file with specific email/domain
     */
    public function shareFile(string $fileId, string $emailOrDomain, string $role = 'reader', string $type = 'user'): void
    {
        $permission = new Google_Service_Drive_Permission([
            'type' => $type,
            'role' => $role,
            'emailAddress' => $type === 'user' || $type === 'group' ? $emailOrDomain : null,
            'domain' => $type === 'domain' ? $emailOrDomain : null,
        ]);

        $this->service->permissions->create($fileId, $permission, [
            'fields' => 'id',
        ]);

        Log::info('File shared', [
            'file_id' => $fileId,
            'shared_with' => $emailOrDomain,
            'role' => $role,
        ]);
    }

    /**
     * List files in a folder
     */
    public function listFiles(?string $folderId = null, int $pageSize = 100): array
    {
        $query = "trashed=false";
        
        if ($folderId) {
            $query .= " and '{$folderId}' in parents";
        }

        $response = $this->service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink)',
            'pageSize' => $pageSize,
            'orderBy' => 'createdTime desc',
        ]);

        return collect($response->getFiles())->map(function ($file) {
            return [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'mimeType' => $file->getMimeType(),
                'size' => $file->getSize(),
                'createdTime' => $file->getCreatedTime(),
                'modifiedTime' => $file->getModifiedTime(),
                'webViewLink' => $file->getWebViewLink(),
                'webContentLink' => $file->getWebContentLink(),
            ];
        })->toArray();
    }

    /**
     * Create chunked media upload for large files
     */
    protected function createMediaUpload(
        Google_Service_Drive_DriveFile $metadata,
        string $mimeType,
        string $content,
        int $fileSize
    ): Google_Http_MediaFileUpload {
        return new Google_Http_MediaFileUpload(
            $this->client,
            $metadata,
            $mimeType,
            $content,
            [
                'chunkSize' => $this->chunkSize,
                'definedSize' => $fileSize,
                'resume' => true,
            ]
        );
    }

    /**
     * Get file information
     */
    public function getFileInfo(string $fileId): array
    {
        $file = $this->service->files->get($fileId, [
            'fields' => 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, parents',
        ]);

        return [
            'id' => $file->getId(),
            'name' => $file->getName(),
            'mimeType' => $file->getMimeType(),
            'size' => $file->getSize(),
            'createdTime' => $file->getCreatedTime(),
            'modifiedTime' => $file->getModifiedTime(),
            'webViewLink' => $file->getWebViewLink(),
            'webContentLink' => $file->getWebContentLink(),
            'thumbnailLink' => $file->getThumbnailLink(),
            'parents' => $file->getParents(),
        ];
    }

    /**
     * Search files by query
     */
    public function searchFiles(string $query, int $pageSize = 50): array
    {
        $response = $this->service->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id, name, mimeType, size, createdTime, webViewLink)',
            'pageSize' => $pageSize,
            'orderBy' => 'createdTime desc',
        ]);

        return collect($response->getFiles())->map(function ($file) {
            return [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'mimeType' => $file->getMimeType(),
                'size' => $file->getSize(),
                'createdTime' => $file->getCreatedTime(),
                'webViewLink' => $file->getWebViewLink(),
            ];
        })->toArray();
    }
}

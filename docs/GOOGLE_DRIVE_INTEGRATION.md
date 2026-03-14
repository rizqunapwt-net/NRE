# Google Drive Integration - Rizquna ERP

## 📋 Overview

Integrasi Google Drive untuk penyimpanan dan distribusi file buku digital (cover dan PDF) secara terpusat.

## 🎯 Fitur

- **Auto-upload** cover dan PDF buku ke Google Drive
- **Sync command** untuk migrasi file existing
- **Public/Private sharing** dengan link
- **Chunked upload** untuk file besar (>2MB)
- **Automatic folder management** (Book Covers, Book PDFs)

## 📦 Setup

### 1. Install Dependencies

Google API client sudah terinstall via Composer:
```bash
composer require google/apiclient
```

### 2. Setup Service Account

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project `rizquna` atau buat baru
3. Enable **Google Drive API**
4. Buat **Service Account**:
   - IAM & Admin → Service Accounts → Create Service Account
   - Name: `Rizquna Books Sync`
   - Email: `databaserizquna@rizquna.iam.gserviceaccount.com`
5. Buat **JSON Key**:
   - Klik service account → Keys → Add Key → Create new key
   - Pilih JSON → Download
   - Simpan sebagai `storage/app/google/service-account.json`

### 3. Setup Google Drive Folders

1. Buka [Google Drive](https://drive.google.com/)
2. Buat folder baru: `Rizquna Books` (atau gunakan folder yang ada)
3. Buat subfolder:
   - `Book Covers` - untuk cover buku
   - `Book PDFs` - untuk PDF buku
4. Copy **Folder ID** dari URL:
   - URL: `https://drive.google.com/drive/folders/1ABC123xyz...`
   - Folder ID: `1ABC123xyz...`

### 4. Share Folder ke Service Account

1. Klik kanan folder `Rizquna Books` → Share
2. Masukkan email service account: `databaserizquna@rizquna.iam.gserviceaccount.com`
3. Berikan permission: **Editor**
4. Klik Share

### 5. Configure Environment

Edit file `.env`:

```env
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=storage/app/google/service-account.json
GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID=1ABC123xyz...  # Folder "Rizquna Books"
GOOGLE_DRIVE_COVERS_FOLDER_ID=1DEF456abc...      # Folder "Book Covers"
GOOGLE_DRIVE_PDFS_FOLDER_ID=1GHI789def...        # Folder "Book PDFs"
GOOGLE_DRIVE_VISIBILITY=private  # atau 'anyone_with_link'
GOOGLE_DRIVE_CHUNK_SIZE=2097152  # 2MB
```

## 🚀 Usage

### Manual Sync (Command Line)

**Sync semua buku:**
```bash
php artisan books:sync-drive
```

**Sync buku tertentu:**
```bash
php artisan books:sync-drive --book=123
```

**Force re-upload (meski sudah synced):**
```bash
php artisan books:sync-drive --force
```

**Dry run (preview tanpa upload):**
```bash
php artisan books:sync-drive --dry-run
```

### Programmatic Usage

```php
use App\Services\GoogleDriveService;
use Illuminate\Support\Facades\Storage;

// Inject service
$driveService = app(GoogleDriveService::class);

// Upload cover
$coverPath = Storage::disk('books')->path($book->cover_path);
$result = $driveService->uploadBookCover($coverPath, $book->slug);

// Upload PDF
$pdfPath = Storage::disk('books')->path($book->pdf_full_path);
$result = $driveService->uploadBookPdf($pdfPath, $book->slug);

// Get file info
$fileInfo = $driveService->getFileInfo($book->google_drive_pdf_id);

// Delete file
$driveService->deleteFile($book->google_drive_cover_id);

// Share file dengan user tertentu
$driveService->shareFile($fileId, 'user@example.com', 'reader');
```

## 📁 File Structure

```
Google Drive/
└── Rizquna Books/               (GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID)
    ├── Book Covers/             (GOOGLE_DRIVE_COVERS_FOLDER_ID)
    │   ├── buku-saya-cover.jpg
    │   └── buku-lain-cover.png
    └── Book PDFs/               (GOOGLE_DRIVE_PDFS_FOLDER_ID)
        ├── buku-saya.pdf
        └── buku-lain.pdf
```

## 🔐 Permissions & Security

### Visibility Options

- **private**: Hanya service account yang bisa akses
- **anyone_with_link**: Siapa saja dengan link bisa view/download

### Best Practices

1. **Jangan commit** file JSON key ke Git
2. Gunakan **environment variables** untuk credentials
3. Set **visibility=private** untuk buku berbayar
4. Gunakan **signed URLs** atau **access control** di aplikasi

## 🛠️ Troubleshooting

### Error: "Credentials not configured"

```
InvalidArgumentException: Google service account credentials not configured
```

**Solusi:**
- Pastikan file `storage/app/google/service-account.json` ada
- Atau set `GOOGLE_SERVICE_ACCOUNT_JSON` dengan JSON string

### Error: "File not found"

```
Google_Service_Exception: File not found
```

**Solusi:**
- Pastikan folder sudah di-share ke service account
- Cek Folder ID benar (dari URL Google Drive)

### Error: "Insufficient Permission"

```
Google_Service_Exception: Insufficient Permission
```

**Solusi:**
- Enable Google Drive API di Google Cloud Console
- Pastikan service account punya akses Editor ke folder

### Upload Timeout untuk File Besar

**Solusi:**
- Increase `max_execution_time` di PHP
- Gunakan chunked upload (sudah enabled by default)
- Set `GOOGLE_DRIVE_CHUNK_SIZE` lebih besar

## 📊 Monitoring

### Check Sync Status

```sql
-- Buku yang sudah synced ke Google Drive
SELECT id, title, slug, 
       google_drive_cover_id, 
       google_drive_pdf_id,
       is_published
FROM books
WHERE google_drive_cover_id IS NOT NULL
   OR google_drive_pdf_id IS NOT NULL;

-- Buku yang belum synced (padahal punya file)
SELECT id, title, slug, cover_path, pdf_full_path
FROM books
WHERE (cover_path IS NOT NULL OR pdf_full_path IS NOT NULL)
  AND google_drive_cover_id IS NULL
  AND google_drive_pdf_id IS NULL;
```

### Logs

Check Laravel logs untuk activity:
```bash
tail -f storage/logs/laravel.log | grep "Google Drive"
```

## 🔄 Auto-Sync (Optional)

Untuk auto-sync saat buku di-publish, uncomment code di `Book.php`:

```php
// In app/Models/Book.php - booted() method
static::saved(function (self $book) {
    if (config('google.drive.books_root_folder_id') && $book->is_published) {
        SyncBooksToGoogleDrive::dispatch($book);
    }
});
```

## 📝 Migration

Jalankan migration untuk menambahkan kolom Google Drive:

```bash
php artisan migrate
```

## 🔗 Related Files

- **Service:** `app/Services/GoogleDriveService.php`
- **Command:** `app/Console/Commands/SyncBooksToGoogleDrive.php`
- **Config:** `config/google.php`
- **Model:** `app/Models/Book.php`
- **Migration:** `database/migrations/2026_03_02_000000_add_google_drive_columns_to_books_table.php`

## 📚 Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [PHP Google API Client](https://github.com/googleapis/google-api-php-client)
- [Service Account Authentication](https://cloud.google.com/docs/authentication/production)

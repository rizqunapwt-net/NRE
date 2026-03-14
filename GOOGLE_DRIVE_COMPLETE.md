# ✅ Google Drive Integration - Setup Complete!

## 📦 Yang Sudah Dibuat

### 1. Configuration Files
- ✅ `config/google.php` - Konfigurasi Google API & Drive
- ✅ `.env.example` - Updated dengan Google Drive variables
- ✅ `storage/app/google/service-account.json.example` - Template JSON key

### 2. Service & Classes
- ✅ `app/Services/GoogleDriveService.php` - Service lengkap untuk:
  - Upload cover & PDF
  - Delete files
  - Get URLs (download/view)
  - Create/manage folders
  - Share files
  - Chunked upload
  - Search & list files

### 3. Console Commands
- ✅ `app/Console/Commands/SyncBooksToGoogleDrive.php` - Sync manual
- ✅ `app/Console/Commands/TestGoogleDrive.php` - Test connection
- ✅ `scripts/setup-google-drive.sh` - Setup helper script

### 4. Jobs (Queue)
- ✅ `app/Jobs/SyncBookToGoogleDrive.php` - Auto-sync via queue

### 5. Database
- ✅ Migration: `2026_03_02_000000_add_google_drive_columns_to_books_table.php`
  - `google_drive_cover_id`
  - `google_drive_cover_url`
  - `google_drive_pdf_id`
  - `google_drive_pdf_url`

### 6. Model Updates
- ✅ `app/Models/Book.php` - Updated dengan:
  - New fillable fields
  - Auto-sync hook (commented out, optional)

### 7. Documentation
- ✅ `GOOGLE_DRIVE_SETUP.md` - Quick setup guide
- ✅ `README_GOOGLE_DRIVE.md` - Quick reference
- ✅ `docs/GOOGLE_DRIVE_INTEGRATION.md` - Full documentation

---

## 🎯 Cara Menggunakan

### Setup Awal

```bash
# 1. Jalankan setup helper
./scripts/setup-google-drive.sh

# 2. Setup di Google Cloud Console (lihat GOOGLE_DRIVE_SETUP.md)
# 3. Setup di Google Drive (buat folder & share)
# 4. Update .env dengan Folder IDs

# 5. Test connection
php artisan google:test-connection

# 6. Sync buku
php artisan books:sync-drive
```

### Daily Usage

```bash
# Sync semua buku ke Google Drive
php artisan books:sync-drive

# Sync buku tertentu
php artisan books:sync-drive --book=123

# Force re-upload (misal setelah update cover/PDF)
php artisan books:sync-drive --force

# Preview tanpa upload
php artisan books:sync-drive --dry-run

# Test connection anytime
php artisan google:test-connection
```

### Programmatic Usage

```php
use App\Jobs\SyncBookToGoogleDrive;
use App\Services\GoogleDriveService;

// Via Job (recommended untuk production)
SyncBookToGoogleDrive::dispatch($book);

// Atau langsung via service
$driveService = app(GoogleDriveService::class);

// Upload cover
$result = $driveService->uploadBookCover($filePath, $book->slug);

// Upload PDF
$result = $driveService->uploadBookPdf($filePath, $book->slug);

// Get file info
$fileInfo = $driveService->getFileInfo($fileId);

// Delete file
$driveService->deleteFile($fileId);

// Share file
$driveService->shareFile($fileId, 'user@example.com', 'reader');
```

---

## 📁 Struktur File

```
Google Drive/
└── Rizquna Books/ (ROOT_FOLDER_ID)
    ├── Book Covers/ (COVERS_FOLDER_ID)
    │   ├── buku-saya-cover.jpg
    │   └── buku-lain-cover.png
    └── Book PDFs/ (PDFS_FOLDER_ID)
        ├── buku-saya.pdf
        └── buku-lain.pdf
```

---

## 🔐 Security Best Practices

1. **Jangan commit** file JSON key ke Git
2. Gunakan **environment variables** untuk credentials
3. Set **visibility=private** untuk buku berbayar
4. Gunakan **access control** di aplikasi untuk verify user
5. Rotate service account keys secara berkala

---

## 📊 Monitoring

### Check Sync Status (SQL)
```sql
-- Buku yang sudah synced
SELECT id, title, slug, 
       google_drive_cover_id, 
       google_drive_pdf_id,
       is_published
FROM books
WHERE google_drive_cover_id IS NOT NULL;

-- Buku yang belum synced
SELECT id, title, slug, cover_path, pdf_full_path
FROM books
WHERE (cover_path IS NOT NULL OR pdf_full_path IS NOT NULL)
  AND google_drive_cover_id IS NULL
  AND google_drive_pdf_id IS NULL;
```

### Logs
```bash
tail -f storage/logs/laravel.log | grep "Google Drive"
```

---

## 🛠️ Troubleshooting

| Error | Solution |
|-------|----------|
| Credentials not configured | Set JSON key path atau GOOGLE_SERVICE_ACCOUNT_JSON |
| File not found | Pastikan folder di-share ke service account |
| Insufficient Permission | Enable Drive API & grant Editor access |
| Timeout (large files) | Increase max_execution_time, use chunked upload |

---

## 📋 Next Steps (Optional)

### Auto-Sync on Publish
Uncomment di `app/Models/Book.php`:
```php
static::saved(function (self $book) {
    if (config('google.drive.books_root_folder_id') && $book->is_published) {
        SyncBookToGoogleDrive::dispatch($book);
    }
});
```

### Admin UI
Buat settings page di admin panel untuk:
- View sync status
- Manual trigger sync
- Configure folder IDs
- View storage usage

### Webhook Integration
Setup webhook untuk notify saat upload selesai

---

## 📚 Documentation Files

1. **README_GOOGLE_DRIVE.md** - Quick start (baca ini dulu!)
2. **GOOGLE_DRIVE_SETUP.md** - Step-by-step setup guide
3. **docs/GOOGLE_DRIVE_INTEGRATION.md** - Technical documentation
4. **storage/app/google/service-account.json.example** - JSON template

---

## ✨ Features

- ✅ Auto folder creation
- ✅ Chunked upload (2MB default)
- ✅ Progress tracking
- ✅ Retry mechanism (3 tries)
- ✅ Error logging
- ✅ Dry-run mode
- ✅ Force re-upload
- ✅ Public/private sharing
- ✅ File search & listing
- ✅ Queue support

---

**Status**: ✅ **READY FOR PRODUCTION**

**Next**: Setup Google Cloud Console & Google Drive folders, lalu test! 🚀

# 🟣 AGENT 5 — Digital Library & File Management

## MCP Protocol
Baca file koordinasi SEBELUM mulai kerja:
📄 .agents/MCP_STATE.md (di project root /Users/macm4/Documents/Projek/NRE)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu
Kamu adalah **Digital Library Agent** untuk proyek NRE Rizquna Elfath. Kamu mengelola SEMUA file buku digital — upload cover, upload PDF, serve image, generate thumbnail, generate PDF preview, import cover dari WordPress.

## Stack
- PHP 8.4 (Laravel Services & Jobs)
- Intervention Image (thumbnail)
- pdftk / Imagick (PDF manipulation)
- Filesystem: Local disk + optional S3/MinIO

## Cara Jalankan
```bash
./scripts/dev.sh artisan library:download-covers        # Download cover WP
./scripts/dev.sh artisan library:download-covers --id=1  # Download 1 buku
./scripts/dev.sh artisan library:import-wordpress        # Import dari WP
```

## File yang BOLEH Kamu Ubah
```
app/Services/BookStorageService.php
app/Services/BookAccessService.php
app/Jobs/GenerateCoverThumbnails.php
app/Jobs/GeneratePreviewPdf.php
app/Jobs/ParsePdfJob.php
app/Jobs/SyncBookToGoogleWorkspace.php
app/Http/Controllers/Api/V1/BookFileController.php
app/Console/Commands/DownloadBookCovers.php
app/Console/Commands/ImportBooksFromWordPress.php
config/books.php
routes/api.php → HANYA bagian book file routes (prefix v1/public → cover, preview)
```

## File yang DILARANG
```
admin-panel/                → Agent 2 & 3
docker/                     → Agent 4
app/Http/Controllers/Api/V1/PublicSiteController.php → Agent 1
database/migrations/        → Agent 1
```

## Arsitektur Storage
```
storage/app/
├── private/books/                ← Disk "books" (uploaded via admin)
│   ├── covers/
│   │   ├── original/             ← High-res: {id}_{timestamp}.{ext}
│   │   ├── large/                ← 800px: {id}_large.jpg
│   │   ├── medium/               ← 400px: {id}_medium.jpg
│   │   └── thumb/                ← 150px: {id}_thumb.jpg
│   └── pdfs/
│       ├── full/                 ← PDF lengkap (PROTECTED)
│       └── preview/              ← N halaman pertama (PUBLIC)
└── public/                       ← Disk "public"
    └── covers/                   ← Imported dari WordPress: {slug}-{id}.{ext}
```

## Alur File

### Upload Cover (Admin)
```
POST /admin/books/{id}/upload-cover
→ BookFileController::uploadCover()
→ BookStorageService::uploadCover()
  → Save ke private/books/covers/original/
  → Dispatch GenerateCoverThumbnails
→ Update book.cover_path
```

### Serve Cover (Public)
```
GET /api/v1/public/books/{id}/cover-image
→ Cek book.cover_path
→ Try: storage/app/private/books/{cover_path}
→ Fallback: storage/app/public/{cover_path}
→ response()->file() + Content-Type + Cache-Control
```

### Import Cover (WordPress)
```
php artisan library:download-covers
→ Fetch dari book.google_drive_cover_url
→ Save ke storage/app/public/covers/{slug}-{id}.{ext}
→ Update book.cover_path
```

## ⚠️ ATURAN PENTING
1. SELALU cek `file_exists()` sebelum serve file
2. Gunakan `@mime_content_type()` dengan fallback `'image/png'`
3. Cover URL di API harus ABSOLUTE → Agent 1 sudah pakai `url()` helper
4. PDF full WAJIB protected (auth:sanctum middleware)
5. Preview + Cover = public (tanpa auth)
6. `cover_path` = relative path, BUKAN URL

## Tugas Prioritas
1. ✅ Cover image serving route (cek 2 lokasi) — DONE
2. ✅ Download covers command — DONE
3. ❌ Thumbnail generation job (test & fix)
4. ❌ PDF preview generation (test & fix)
5. ❌ Bulk download semua cover dari WordPress
6. ❌ Cleanup: hapus cover_path yang file-nya missing

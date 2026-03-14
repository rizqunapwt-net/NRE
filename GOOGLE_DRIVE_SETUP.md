# ═══════════════════════════════════════════════════════════════════════════
# GOOGLE DRIVE SETUP INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════

# 1. BUAT SERVICE ACCOUNT DI GOOGLE CLOUD CONSOLE
# ═══════════════════════════════════════════════════════════════════════════

Langkah-langkah:

1. Buka Google Cloud Console: https://console.cloud.google.com/

2. Pilih project "rizquna" atau buat project baru

3. Enable Google Drive API:
   - Buka: API & Services → Library
   - Cari "Google Drive API"
   - Klik Enable

4. Buat Service Account:
   - Buka: IAM & Admin → Service Accounts
   - Klik "CREATE SERVICE ACCOUNT"
   - Service account name: "Rizquna Books Sync"
   - Service account ID: akan ter-generate otomatis
   - Klik "CREATE AND CONTINUE"
   - Skip role assignment (klik "CONTINUE")
   - Klik "DONE"

5. Buat JSON Key:
   - Klik service account yang baru dibuat
   - Pilih tab "KEYS"
   - Klik "ADD KEY" → "Create new key"
   - Pilih "JSON" format
   - Klik "CREATE"
   - File JSON akan ter-download otomatis

6. Copy JSON key ke folder project:
   - Copy file JSON yang ter-download
   - Paste ke: storage/app/google/service-account.json
   - ATAU copy manual isi JSON ke .env (lihat step 3)


# 2. BUAT FOLDER DI GOOGLE DRIVE
# ═══════════════════════════════════════════════════════════════════════════

1. Buka Google Drive: https://drive.google.com/

2. Buat folder utama:
   - Klik "New" → "Folder"
   - Nama: "Rizquna Books"
   - Copy Folder ID dari URL browser
     URL: https://drive.google.com/drive/folders/1ABC123xyz456...
     Folder ID: 1ABC123xyz456... (bagian setelah /folders/)

3. Buat subfolder "Book Covers":
   - Buka folder "Rizquna Books"
   - Klik "New" → "Folder"
   - Nama: "Book Covers"
   - Copy Folder ID

4. Buat subfolder "Book PDFs":
   - Buka folder "Rizquna Books"
   - Klik "New" → "Folder"
   - Nama: "Book PDFs"
   - Copy Folder ID


# 3. SHARE FOLDER KE SERVICE ACCOUNT
# ═══════════════════════════════════════════════════════════════════════════

PENTING: Langkah ini wajib agar service account bisa akses folder!

1. Klik kanan folder "Rizquna Books" → "Share"

2. Masukkan email service account:
   - Format: [service-account-name]@[project-id].iam.gserviceaccount.com
   - Contoh: databaserizquna@rizquna.iam.gserviceaccount.com

3. Pilih permission: "Editor" (agar bisa upload/delete file)

4. Klik "Share" / "Done"


# 4. UPDATE FILE .ENV
# ═══════════════════════════════════════════════════════════════════════════

Buka file .env dan update bagian GOOGLE:

# CARA 1: Menggunakan file JSON (RECOMMENDED)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=storage/app/google/service-account.json
GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID=1ABC123xyz...   # ID folder "Rizquna Books"
GOOGLE_DRIVE_COVERS_FOLDER_ID=1DEF456abc...       # ID folder "Book Covers"
GOOGLE_DRIVE_PDFS_FOLDER_ID=1GHI789def...         # ID folder "Book PDFs"
GOOGLE_DRIVE_VISIBILITY=private
GOOGLE_DRIVE_CHUNK_SIZE=2097152

# CARA 2: Menggunakan JSON string langsung (alternative)
# Copy isi file JSON key dan paste sebagai string (tanpa line break)
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"rizquna",...}


# 5. TEST CONNECTION
# ═══════════════════════════════════════════════════════════════════════════

Setelah semua dikonfigurasi, test dengan command:

# Dry run (tidak upload beneran)
php artisan books:sync-drive --dry-run

# Jika ada error, cek:
# - File JSON key ada dan valid
# - Folder ID benar
# - Folder sudah di-share ke service account
# - Google Drive API sudah enabled


# 6. SYNC BUKU KE GOOGLE DRIVE
# ═══════════════════════════════════════════════════════════════════════════

# Sync semua buku yang punya cover/PDF
php artisan books:sync-drive

# Sync buku tertentu saja
php artisan books:sync-drive --book=123

# Force re-upload (meski sudah synced)
php artisan books:sync-drive --force

# Lihat preview tanpa upload
php artisan books:sync-drive --dry-run


# ═══════════════════════════════════════════════════════════════════════════
# TROUBLESHOOTING
# ═══════════════════════════════════════════════════════════════════════════

ERROR: "Credentials not configured"
→ Pastikan file storage/app/google/service-account.json ada
→ Atau set GOOGLE_SERVICE_ACCOUNT_JSON di .env

ERROR: "File not found" atau "404"
→ Pastikan folder sudah di-share ke email service account
→ Cek Folder ID benar (copy dari URL Google Drive)

ERROR: "Insufficient Permission"
→ Enable Google Drive API di Google Cloud Console
→ Pastikan service account punya akses "Editor" ke folder

ERROR: "Timeout" untuk file besar
→ Increase max_execution_time di php.ini
→ Upload akan otomatis pakai chunked upload (2MB per chunk)


# ═══════════════════════════════════════════════════════════════════════════
# CHECKLIST SETUP
# ═══════════════════════════════════════════════════════════════════════════

□ Service Account dibuat di Google Cloud Console
□ Google Drive API di-enable
□ JSON Key downloaded
□ File JSON disimpan di storage/app/google/service-account.json
□ Folder "Rizquna Books" dibuat di Google Drive
□ Subfolder "Book Covers" dan "Book PDFs" dibuat
□ Folder di-share ke email service account (permission: Editor)
□ .env di-update dengan Folder IDs
□ Migration dijalankan: php artisan migrate
□ Test connection: php artisan books:sync-drive --dry-run

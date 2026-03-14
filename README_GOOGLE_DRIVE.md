# 🚀 Quick Start: Google Drive Integration

## Setup Cepat (5 Menit)

### 1️⃣ Jalankan Script Setup
```bash
./scripts/setup-google-drive.sh
```

### 2️⃣ Setup di Google Cloud Console
1. Buka: https://console.cloud.google.com/
2. Pilih project **rizquna**
3. Enable **Google Drive API**
4. Buat Service Account:
   - IAM & Admin → Service Accounts → **CREATE SERVICE ACCOUNT**
   - Name: `Rizquna Books Sync`
5. Download JSON Key:
   - Keys → **ADD KEY** → **Create new key** → **JSON**

### 3️⃣ Setup di Google Drive
1. Buka: https://drive.google.com/
2. Buat folder: **Rizquna Books**
3. Buat subfolder: **Book Covers** dan **Book PDFs**
4. Share folder **Rizquna Books** ke email service account
5. Copy **Folder IDs** dari URL

### 4️⃣ Update .env
```env
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=storage/app/google/service-account.json
GOOGLE_DRIVE_BOOKS_ROOT_FOLDER_ID=1ABC123...   # ID folder "Rizquna Books"
GOOGLE_DRIVE_COVERS_FOLDER_ID=1DEF456...       # ID folder "Book Covers"
GOOGLE_DRIVE_PDFS_FOLDER_ID=1GHI789...         # ID folder "Book PDFs"
```

### 5️⃣ Test Connection
```bash
php artisan google:test-connection
```

### 6️⃣ Sync Buku
```bash
php artisan books:sync-drive
```

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `php artisan google:test-connection` | Test koneksi Google Drive |
| `php artisan books:sync-drive` | Sync semua buku ke Drive |
| `php artisan books:sync-drive --book=123` | Sync buku tertentu |
| `php artisan books:sync-drive --force` | Force re-upload |
| `php artisan books:sync-drive --dry-run` | Preview tanpa upload |

---

## 📁 File Structure

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

## 🔧 Troubleshooting

### Error: "Credentials not configured"
```bash
# Pastikan file JSON ada
ls -la storage/app/google/service-account.json

# Atau set via environment
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Error: "File not found"
- Pastikan folder sudah di-share ke service account
- Cek Folder ID benar (copy dari URL Google Drive)

### Error: "Insufficient Permission"
- Enable Google Drive API di Google Cloud Console
- Pastikan service account punya akses **Editor**

---

## 📚 Dokumentasi Lengkap

- **Setup Guide**: `GOOGLE_DRIVE_SETUP.md`
- **Full Docs**: `docs/GOOGLE_DRIVE_INTEGRATION.md`

---

## ✅ Checklist

- [ ] Service Account dibuat
- [ ] JSON Key downloaded
- [ ] File JSON di `storage/app/google/service-account.json`
- [ ] Folder "Rizquna Books" dibuat
- [ ] Subfolder "Book Covers" & "Book PDFs" dibuat
- [ ] Folder di-share ke service account
- [ ] Folder IDs di `.env`
- [ ] Migration dijalankan
- [ ] Test connection berhasil
- [ ] Sync buku berhasil

---

**Need Help?** Run: `./scripts/setup-google-drive.sh`

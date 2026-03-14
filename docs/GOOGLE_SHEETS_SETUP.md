# 📊 Google Sheets Integration Setup

## 🎯 Overview

Integrasi database buku menggunakan Google Sheets sebagai sumber data utama.

**Spreadsheet ID**: `1yTahG4BuDuZs1a4lsm5dtCSM7Av_ijd5`

---

## 📋 Setup Steps

### 1️⃣ Share Google Sheets ke Service Account

**PENTING**: Spreadsheet harus di-share ke email service account!

1. Buka Google Sheets: https://docs.google.com/spreadsheets/d/1yTahG4BuDuZs1a4lsm5dtCSM7Av_ijd5/edit

2. Klik tombol **"Share"** (bagikan) di kanan atas

3. Masukkan email service account:
   ```
   databaserizquna@rizquna.iam.gserviceaccount.com
   ```

4. Pilih permission: **"Viewer"** (atau "Editor" jika ingin edit dari Laravel)

5. Klik **"Share"** / **"Done"**

---

### 2️⃣ Verify Column Structure

Pastikan kolom di Google Sheets sesuai dengan struktur ini:

| Column | Name | Required | Example |
|--------|------|----------|---------|
| A | Title | ✅ | "Al Qur'an dalam praktik sosial" |
| B | Subtitle | | "hafidzah sebagai agen transformasi" |
| C | Author | ✅ | "Dr. Ahmad Fauzi, M.Pd." |
| D | ISBN | | "978-623-123-456-1" |
| E | Publisher | | "Rizquna Publishing" |
| F | Publisher City | | "Purwokerto" |
| G | Year | | "2024" |
| H | Edition | | "1" |
| I | Pages | | "248" |
| J | Language | | "Indonesian" |
| K | Category | | "Pendidikan" |
| L | Abstract | | "Penelitian tentang..." |
| M | Description | | "Deskripsi lengkap buku..." |
| N | Price | | "95000" |
| O | Stock | | "100" |
| P | Cover URL | | "https://..." |
| Q | PDF URL | | "https://..." |
| R | Google Drive ID | | "1ABC123xyz" |
| S | Status | | "published" |
| T | Notes | | "Catatan internal" |

**Note**: Baris 1 adalah header, data mulai dari baris 2.

---

### 3️⃣ Test Connection

```bash
# Preview data (tanpa save ke database)
php artisan sheets:sync --preview

# Clear cache dan sync
php artisan sheets:sync --clear-cache

# Full sync (save ke database)
php artisan sheets:sync
```

---

### 4️⃣ Verify Data

Setelah sync, cek data di database:

```bash
php artisan tinker --execute="
use App\Models\Book;
echo 'Total Books: ' . Book::count() . PHP_EOL;
echo 'Published: ' . Book::where('is_published', true)->count() . PHP_EOL;
Book::limit(5)->get(['title', 'author_id'])->each(fn(\$b) => echo '- ' . \$b->title . PHP_EOL);
"
```

---

## 🔄 Daily Sync (Optional)

Untuk auto-sync setiap hari, tambahkan ke cron:

```bash
# Edit crontab
crontab -e

# Add daily sync at 2 AM
0 2 * * * cd /path/to/project && php artisan sheets:sync --clear-cache
```

Atau gunakan Laravel Scheduler di `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('sheets:sync --clear-cache')
             ->dailyAt('02:00');
}
```

---

## 🛠️ Troubleshooting

### Error: "Credentials not configured"

```
InvalidArgumentException: Google service account credentials not configured
```

**Solusi**:
- Pastikan file `storage/app/google/service-account.json` ada
- Atau set `GOOGLE_SERVICE_ACCOUNT_JSON` di .env

### Error: "Permission denied"

```
Google_Service_Exception: The caller does not have permission
```

**Solusi**:
- Share Google Sheets ke email service account: `databaserizquna@rizquna.iam.gserviceaccount.com`
- Grant "Viewer" permission minimal

### Error: "Spreadsheet not found"

```
Google_Service_Exception: File not found: 1yTahG4BuDuZs1a4lsm5dtCSM7Av_ijd5
```

**Solusi**:
- Check Spreadsheet ID benar
- Pastikan spreadsheet di-share ke service account
- Verify service account punya akses

### Data tidak muncul setelah sync

**Solusi**:
```bash
# Clear cache
php artisan sheets:sync --clear-cache --preview

# Check column mapping
# Pastikan kolom di Sheets sesuai dengan struktur di atas
```

---

## 📊 Commands Reference

| Command | Description |
|---------|-------------|
| `php artisan sheets:sync` | Sync data dari Google Sheets ke database |
| `php artisan sheets:sync --preview` | Preview data tanpa save |
| `php artisan sheets:sync --clear-cache` | Clear cache sebelum sync |

---

## 🔐 Security Notes

1. **Jangan commit** file JSON key ke Git
2. **Share Sheets** hanya ke service account email
3. **Use Viewer permission** jika hanya read-only
4. **Backup data** secara berkala

---

## 📝 Example Output

```bash
$ php artisan sheets:sync

═══════════════════════════════════════════
📊 Google Sheets Sync - Rizquna Library
═══════════════════════════════════════════

1. Fetching spreadsheet metadata...
   ✓ Spreadsheet: Library Catalog 2024
   ✓ Sheets: 1
      • Books (1000 rows × 20 cols)

2. Fetching books data...
   ✓ Found 427 books

3. Syncing to database...

═══════════════════════════════════════════
✅ Sync Complete!
═══════════════════════════════════════════
   📚 Total in Sheets: 427
   ➕ Created: 0
   🔄 Updated: 427
   ⚠️  Errors: 0
═══════════════════════════════════════════
```

---

## 🎯 Next Steps

Setelah sync berhasil:

1. ✅ Verify data di database
2. ✅ Test halaman Sitasi: http://localhost:9001/sitasi
3. ✅ Setup daily sync (optional)
4. ✅ Backup database secara berkala

---

**Ready to sync!** 🚀

Run: `php artisan sheets:sync --preview`

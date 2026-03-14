# 🟠 AGENT 6 — QA & Integration Testing

## MCP Protocol
Baca file koordinasi SEBELUM mulai kerja:
📄 .agents/MCP_STATE.md (di project root /Users/macm4/Documents/Projek/NRE)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu
Kamu adalah **QA Agent** untuk proyek NRE Rizquna Elfath. Kamu memastikan SEMUA komponen bekerja — menulis test, membuat seeder data, validasi integritas, dan smoke test sebelum deploy.

## Stack
- PHP 8.4 (PHPUnit, Laravel TestCase)
- PostgreSQL 16
- curl (API testing)
- Bash scripting

## Cara Jalankan
```bash
./scripts/dev.sh artisan test                          # Semua test
./scripts/dev.sh artisan test --filter=PublicCatalog    # Test tertentu
./scripts/dev.sh artisan db:seed                       # Jalankan seeder
./scripts/dev.sh artisan diagnostic:check-integrity    # Cek data
bash scripts/smoke-test.sh                             # Smoke test
```

## File yang BOLEH Kamu Ubah
```
tests/Feature/                    ← API integration tests (BUAT BARU)
tests/Unit/                       ← Unit tests (BUAT BARU)
database/seeders/                 ← Semua seeder
database/factories/               ← Model factories
scripts/smoke-test.sh             ← Smoke test (BUAT BARU)
app/Console/Commands/CheckDataIntegrity.php  ← Diagnostic (BUAT BARU)
```

## File yang DILARANG
```
app/Http/Controllers/      → Agent 1
admin-panel/src/pages/     → Agent 2 & 3
docker/                    → Agent 4
app/Services/              → Agent 1 & 5
```

## TUGAS 1: SEEDERS (PRIORITAS TERTINGGI!)

> Database saat ini KOSONG setelah restart. Ini harus di-fix pertama!

### UserSeeder.php
```php
// Admin: admin@rizquna.com / password → role: admin
// Author: penulis@rizquna.com / password → role: author
// Editor: editor@rizquna.com / password → role: editor
// Gunakan firstOrCreate() agar idempotent
```

### CategorySeeder.php
```php
$categories = [
    ['name' => 'Al-Quran & Tafsir', 'slug' => 'al-quran-tafsir', 'sort_order' => 1],
    ['name' => 'Anak & Remaja', 'slug' => 'anak-remaja', 'sort_order' => 2],
    ['name' => 'Buku Teks', 'slug' => 'buku-teks', 'sort_order' => 3],
    ['name' => 'Pendidikan', 'slug' => 'pendidikan', 'sort_order' => 4],
    ['name' => 'Fiksi', 'slug' => 'fiksi', 'sort_order' => 5],
    ['name' => 'Non-Fiksi', 'slug' => 'non-fiksi', 'sort_order' => 6],
    ['name' => 'Sains & Teknologi', 'slug' => 'sains-teknologi', 'sort_order' => 7],
    ['name' => 'Bisnis & Ekonomi', 'slug' => 'bisnis-ekonomi', 'sort_order' => 8],
    ['name' => 'Umum', 'slug' => 'umum', 'sort_order' => 99],
];
// Gunakan firstOrCreate(), is_active = true
```

### AuthorSeeder.php
```php
// 5 author: nama Indonesia, email, status active
// Contoh: Dr. Ahmad Fauzi, Prof. Siti Nurhaliza, dll
```

### BookSeeder.php
```php
// 10 buku:
// - 3 buku DENGAN harga (50000, 75000, 120000)
// - 7 buku TANPA harga (price = 0) → "Hubungi Kami"
// - Semua status = 'published', punya slug unik
// - Random assign ke author & category dari seeder di atas
// Contoh: Bermain & Permainan Anak Usia Dini, Metode Penelitian Kualitatif
```

### DatabaseSeeder.php (update call order)
```php
$this->call([
    RoleSeeder::class,      // cek apakah sudah ada
    UserSeeder::class,
    CategorySeeder::class,
    AuthorSeeder::class,
    BookSeeder::class,
]);
```

## TUGAS 2: API Integration Tests

### PublicCatalogTest.php
```php
// test_catalog_returns_paginated_books
// test_catalog_filters_by_category_slug
// test_catalog_search_by_title
// test_book_detail_by_slug_works
// test_book_detail_by_id_works
// test_book_with_zero_price_returns_zero_not_null
// test_categories_endpoint_returns_list
// test_nonexistent_slug_returns_404
```

### AuthenticationTest.php
```php
// test_login_returns_token
// test_login_with_wrong_password_fails
// test_admin_endpoint_requires_auth (401)
// test_public_endpoint_no_auth_needed (200)
```

## TUGAS 3: Data Integrity Checker

### CheckDataIntegrity.php (Artisan command)
```
php artisan diagnostic:check-integrity

Checks:
1. Buku tanpa author → assign fallback "Penulis Rizquna"
2. Buku tanpa slug → generate dari title (Str::slug)
3. Buku tanpa kategori → assign "Umum"
4. cover_path yang file-nya missing → set null
5. Duplikat slug → tambah suffix "-2", "-3"
6. Price null → set 0
7. Status invalid → set 'draft'

Output: tabel summary issues ditemukan + diperbaiki
```

## TUGAS 4: Smoke Test Script

### scripts/smoke-test.sh
```bash
#!/bin/bash
BASE="http://localhost:9000/api/v1"
# Check: catalog, categories, stats, auth (401), health
# Print: ✅/❌ per endpoint + summary
# Exit 0 jika semua pass, exit 1 jika ada fail
```

## ⚠️ ATURAN PENTING
1. Setiap test independen — gunakan `RefreshDatabase` trait
2. JANGAN hardcode data — gunakan Model Factories
3. Seeders HARUS idempotent — `firstOrCreate()` selalu
4. Cek kolom yang benar: `authors.name` (BUKAN `nama`)
5. Setelah buat seeder → update MCP_STATE.md
6. Test di: `./scripts/dev.sh artisan test`

## Tugas Prioritas
1. ❌ Buat semua seeders (User, Category, Author, Book) ← MULAI DARI SINI!
2. ❌ Buat factories (Book, Author, Category)
3. ❌ Buat API integration tests
4. ❌ Buat data integrity checker command
5. ❌ Buat smoke test script

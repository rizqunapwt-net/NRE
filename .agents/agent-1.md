# 🔵 AGENT 1 — Backend Core (Laravel API + Database)

## MCP Protocol
Baca file koordinasi SEBELUM mulai kerja:
📄 .agents/MCP_STATE.md (di project root /Users/macm4/Documents/Projek/NRE)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu
Kamu adalah **Backend Core Agent** untuk proyek NRE Rizquna Elfath — platform penerbitan buku digital. Kamu bertanggung jawab atas SEMUA logika backend: API endpoints, database, authentication, business logic.

## Stack
- Laravel 12 (PHP 8.4), PostgreSQL 16, Redis 7
- Docker container (PHP-FPM)
- Spatie/Permission untuk RBAC

## Cara Jalankan
```bash
./scripts/dev.sh artisan [command]     # Artisan
./scripts/dev.sh artisan migrate       # Migrasi
./scripts/dev.sh artisan test          # Test
./scripts/dev.sh logs app              # Log
```

## File yang BOLEH Kamu Ubah
```
app/Http/Controllers/
app/Models/
app/Services/ (KECUALI BookStorageService & BookAccessService)
app/Domain/
app/Jobs/ (KECUALI GenerateCoverThumbnails, GeneratePreviewPdf)
app/Events/
app/Policies/
app/Providers/
database/migrations/
database/seeders/ (koordinasi dengan Agent 6)
routes/api.php
routes/web.php
config/
tests/
```

## File yang DILARANG
```
admin-panel/          → Agent 2 & 3
docker/               → Agent 4
scripts/              → Agent 4
app/Services/BookStorageService.php   → Agent 5
app/Services/BookAccessService.php    → Agent 5
app/Console/Commands/DownloadBookCovers.php → Agent 5
app/Console/Commands/ImportBooksFromWordPress.php → Agent 5
```

## API Endpoints yang Harus Bekerja

### Public (No Auth)
```
GET  /api/v1/public/catalog                → Buku paginated (page, per_page, category, search)
GET  /api/v1/public/catalog/{idOrSlug}     → Detail buku
GET  /api/v1/public/categories             → Daftar kategori
GET  /api/v1/public/stats                  → Statistik
GET  /api/v1/public/site-content           → CMS content
GET  /api/v1/public/faqs                   → FAQ
GET  /api/v1/public/testimonials           → Testimonial
GET  /api/v1/public/search?q=             → Search
```

### Auth
```
POST /api/v1/auth/login      → { email, password } → { token, user }
POST /api/v1/auth/register
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Admin (Auth + role:admin)
```
GET/POST/PUT/DELETE /api/v1/admin/books
GET/POST/PUT       /api/v1/admin/authors
GET                /api/v1/admin/dashboard-stats
GET                /api/v1/admin/royalties
GET                /api/v1/admin/contracts
GET                /api/v1/admin/marketplaces
```

## Response Format
```json
// Single: { "data": { ... } }
// List:   { "current_page": 1, "data": [...], "total": 100 }
// Error:  { "message": "...", "errors": {} }
```

## ⚠️ GOTCHAS (Jebakan yang Sudah Ditemukan)

1. **Book detail by slug**: Parameter bisa ID (numeric) atau slug (string).
   - Jika `is_numeric()` → query WHERE id = ?
   - Jika string → query WHERE slug = ? SAJA
   - JANGAN: `WHERE id = 'some-slug'` → PostgreSQL bigint error!

2. **Author name**: Tabel `authors` hanya punya kolom `name` (BUKAN `nama`).
   Di API response transformBook(), map ke: `{ "nama": $book->author->name }`

3. **Price**: Kolom decimal, NOT NULL, default 0. Nilai 0 = "Hubungi Kami" di frontend. JANGAN return null.

4. **Cover URL**: Harus ABSOLUTE URL → gunakan `url('/api/v1/public/books/' . $book->id . '/cover-image')`

5. **Search**: Di tabel authors TIDAK ada kolom `nama`, hanya `name`.

## Tugas Prioritas
1. ✅ Fix catalog API (slug vs ID) — DONE
2. ✅ Fix author search (nama→name) — DONE
3. ✅ Categories endpoint — DONE
4. ✅ Cover URL absolute — DONE
5. ❌ Pastikan semua Admin endpoints bekerja
6. ❌ Author portal endpoints (dashboard, manuscripts, royalties)
7. ❌ Koordinasi dengan Agent 6 untuk seeder

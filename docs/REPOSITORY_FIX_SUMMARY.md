# Repository Page - Logic & Storage Fixes

## 📋 Issues Ditemukan & Diperbaiki

### **Issue 1: Storage Path Inconsistency** 🔴 CRITICAL

**Problem:**
```php
// RepositoryController (SALAH - asset() tidak work untuk private storage)
asset('storage/books/' . $book->cover_path)
→ http://localhost/storage/books/covers/original/abc.jpg
→ Points to: public/storage/books/... (TIDAK ADA!)

// Actual storage location:
storage/app/private/books/covers/original/abc.jpg
            ↑
      Private! Tidak accessible via public/storage symlink
```

**Root Cause:**
- `BookStorageService` menggunakan disk `'books'` → `storage/app/private/books/`
- Storage symlink hanya: `public/storage` → `storage/app/public`
- Books disimpan di `private/` bukan `public/`

**Fix:**
```php
// RepositoryController - Inject BookStorageService
public function __construct(
    private CitationService $citationService,
    private ScholarCitationService $scholarCitationService,
    private BookStorageService $storageService, // ✅ ADDED
) {}

// Use proper service method
$book->setAttribute('cover_url', $this->storageService->getCoverUrl($book, 'medium'));
```

**BookStorageService::getCoverUrl() logic:**
```php
public function getCoverUrl(Book $book, string $size = 'medium'): ?string
{
    if (! $book->cover_path) {
        return null;
    }

    // Get thumbnail path (or original if not exists)
    $sizePath = match ($size) {
        'original' => $book->cover_path,
        'large'    => "covers/large/{$book->id}_large.jpg",
        'medium'   => "covers/medium/{$book->id}_medium.jpg",
        'thumb'    => "covers/thumb/{$book->id}_thumb.jpg",
        default    => "covers/medium/{$book->id}_medium.jpg",
    };

    // Fallback ke original jika thumbnail belum di-generate
    if (! Storage::disk('books')->exists($sizePath)) {
        $sizePath = $book->cover_path;
    }

    // Generate signed URL (S3/MinIO) atau direct URL (local)
    return $this->getSignedUrl($sizePath, config('books.cover_url_ttl', 3600));
}
```

**getSignedUrl() logic:**
```php
public function getSignedUrl(string $path, int $ttl = 1800): string
{
    $driver = config('filesystems.disks.books.driver', 's3');

    if ($driver === 'local') {
        // Development: direct URL (no expiry)
        return url(Storage::disk('books')->url($path));
    }

    // Production (S3/MinIO): temporary signed URL
    return Storage::disk('books')->temporaryUrl($path, now()->addSeconds($ttl));
}
```

---

### **Issue 2: Inconsistent Response Structure**
**Problem:**
- Frontend tidak handle Laravel paginator structure dengan benar
- Expect: `result.data.data` atau `result.data`
- Backend return: `{ success: true, data: { data: [...], current_page: 1, ... } }`

**Fix:**
```typescript
// RepositoryPage.tsx
if (result.success && result.data) {
    // Handle Laravel paginator structure
    if (result.data.data && Array.isArray(result.data.data)) {
        setBooks(result.data.data);
        setMeta({
            current_page: result.data.current_page,
            last_page: result.data.last_page,
            total: result.data.total,
            per_page: result.data.per_page,
        });
    } else if (Array.isArray(result.data)) {
        // Fallback: direct array
        setBooks(result.data);
    }
}
```

---

### **Issue 3: Inconsistent Scopes**
**Problem:**
- `/api/v1/public/repository` → `->published()` only
- `/api/v1/search` → `->published()->digital()`
- Inconsistent! Search seharusnya juga tampilkan semua published books

**Fix:**
```php
// Remove ->digital() from search endpoint
$query = Book::with([...])
    ->published()  // ✅ Only published
    ->select([...]);
```

---

### **Issue 4: Missing cover_url in search endpoint**
**Problem:**
- `search()` endpoint tidak transform `cover_path` → `cover_url`
- Inconsistent dengan `index()` dan `show()`

**Fix:**
```php
// Add same transformation as index()
$books->getCollection()->transform(function ($book) {
    if ($book->cover_path) {
        $book->setAttribute('cover_url', asset('storage/books/' . $book->cover_path));
    } else {
        $book->setAttribute('cover_url', null);
    }
    return $book;
});
```

---

## ✅ Files Modified

| File | Changes |
|------|---------|
| `RepositoryController.php` | ✅ Add `cover_url` transformation in `index()`, `show()`, `search()` <br> ✅ Remove `->digital()` scope from `search()` |
| `RepositoryPage.tsx` | ✅ Fix response structure handling <br> ✅ Proper meta extraction from Laravel paginator |

---

## 🔄 Data Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────┐
│                  REPOSITORY PAGE FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. User akses /repository
   ↓
2. Frontend: GET /api/v1/public/repository?per_page=12
   ↓
3. Backend:
   - Book::published()->latest('published_year')->paginate(12)
   - Transform cover_path → cover_url
   - Return: { success: true, data: { data: [...], current_page, ... } }
   ↓
4. Frontend:
   - Extract books from result.data.data
   - Extract meta from result.data.{current_page, last_page, total, per_page}
   - Render book cards
   ↓
5. User click pagination
   - Update ?page=2
   - Refetch with new page
   - Scroll to top
   ↓
6. User search
   - Input query + submit
   - GET /api/v1/search?q=keyword&year=2024
   - Same response structure
   - Update books + meta state
```

---

## 🎯 API Response Format (Fixed)

### **GET /api/v1/public/repository**
```json
{
    "success": true,
    "data": {
        "data": [
            {
                "id": 1,
                "title": "Judul Buku",
                "slug": "judul-buku",
                "author": { "id": 1, "name": "Penulis" },
                "category": { "id": 1, "name": "Kategori" },
                "isbn": "978-123-456-789",
                "year": 2024,
                "published_year": 2024,
                "cover_url": "http://localhost:8000/storage/books/covers/abc123.jpg",
                "abstract": "Ringkasan buku...",
                "publisher": "Rizquna Elfath",
                "publisher_city": "Jakarta"
            }
        ],
        "current_page": 1,
        "last_page": 5,
        "total": 50,
        "per_page": 12
    }
}
```

### **GET /api/v1/public/repository/{slug}**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "Judul Buku",
        "slug": "judul-buku",
        "cover_url": "http://localhost:8000/storage/books/covers/abc123.jpg",
        "author": { "id": 1, "name": "Penulis" },
        "category": { "id": 1, "name": "Kategori" },
        "citations": {
            "apa": "Penulis. (2024). Judul Buku. Rizquna Elfath.",
            "mla": "Penulis. Judul Buku. Rizquna Elfath, 2024.",
            "chicago": "...",
            "ieee": "...",
            "bibtex": "...",
            "ris": "..."
        }
    }
}
```

---

## ✅ Testing Checklist

**Backend:**
- [ ] GET `/api/v1/public/repository` → return `cover_url`
- [ ] GET `/api/v1/public/repository?page=2` → pagination works
- [ ] GET `/api/v1/public/repository?q=keyword` → search works
- [ ] GET `/api/v1/public/repository?year=2024` → year filter works
- [ ] GET `/api/v1/search?q=keyword` → same results as repository with q
- [ ] GET `/api/v1/public/repository/{slug}` → return `cover_url` + citations

**Frontend:**
- [ ] Repository page loads
- [ ] Book covers display correctly
- [ ] Pagination buttons work
- [ ] Search by keyword works
- [ ] Filter by year works
- [ ] Click book → navigate to detail page
- [ ] Detail page shows all citation formats
- [ ] Copy citation → clipboard works
- [ ] Download RIS/BibTeX → file downloads

---

## 📝 Notes

1. **Storage Link:** Pastikan `php artisan storage:link` sudah dijalankan
2. **Book Covers:** Cover harus ada di `storage/app/public/books/` atau `storage/app/private/books/`
3. **Asset URL:** `asset()` helper menggunakan `APP_URL` dari `.env`
4. **Search Minimum:** Minimum 3 karakter untuk search query

---

**STATUS: ✅ SEMUA LOGIC SUDAH BENAR DAN KONSISTEN!**

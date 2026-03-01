# Pengunjung (Visitor) Flow - Rizquna ERP

## 📋 KARAKTERISTIK PENGUNJUNG

```
┌─────────────────────────────────────────────────────────────┐
│                    PENGUNJUNG (VISITOR)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ NO Login Required                                        │
│  ✅ NO Registration Required                                 │
│  ✅ Completely Anonymous                                     │
│                                                              │
│  CAN DO:                                                     │
│  ├── Browse katalog buku                                     │
│  ├── Search buku (by title, author, ISBN)                   │
│  ├── View detail buku                                        │
│  ├── Lihat cover buku                                        │
│  ├── Baca preview (sample pages)                            │
│  ├── Cite buku (akademik format)                            │
│  └── View authors, stats, blog                              │
│                                                              │
│  CANNOT DO:                                                  │
│  ├── Download PDF lengkap                                    │
│  ├── Print buku                                              │
│  ├── Read full book (harus beli dulu)                       │
│  ├── Purchase (harus login)                                 │
│  └── Submit naskah                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 USER JOURNEY

### **Step 1: Landing Page**

**Route:** `GET /`
**Frontend:** `LandingPage.tsx`

```
User akses → http://localhost:3000/
         ↓
Shows:
- Hero section
- Featured books
- Stats
- Testimonials
```

---

### **Step 2: Browse Katalog**

**Route:** `GET /katalog`
**Frontend:** `EbookCatalogPage.tsx`
**API:** `GET /api/v1/public/catalog`

```
User klik "Katalog"
         ↓
Backend: PublicSiteController@catalog
         ↓
Returns: List of published books
         ↓
Frontend: Grid of book cards
- Cover image
- Title
- Author
- Year
- ISBN
```

**API Response:**
```json
{
    "success": true,
    "data": {
        "books": [
            {
                "id": 1,
                "title": "Belajar Laravel",
                "slug": "belajar-laravel",
                "author": { "name": "John Doe" },
                "year": 2024,
                "isbn": "978-123-456-789",
                "cover_url": "http://localhost:8000/storage/books/covers/medium/1_medium.jpg",
                "description": "Panduan lengkap belajar Laravel..."
            }
        ],
        "total": 70
    }
}
```

---

### **Step 3: Search Buku**

**Route:** `GET /api/v1/search?q=keyword`
**API:** `RepositoryController@search`

```
User ketik "python" di search box
         ↓
GET /api/v1/search?q=python
         ↓
Backend: Search by title, description, author, ISBN
         ↓
Returns: Matching books
```

**Search Parameters:**
- `q` - Query (minimum 3 characters)
- `year` - Filter by year
- `category_id` - Filter by category
- `per_page` - Items per page (max 100)
- `page` - Page number

**Example:**
```bash
curl "http://localhost:8000/api/v1/search?q=python&year=2024&per_page=12"
```

---

### **Step 4: View Detail Buku**

**Route:** `GET /katalog/{slug}`
**Frontend:** `BookDetailPage.tsx`
**API:** `GET /api/v1/public/catalog/{id}`

```
User klik buku
         ↓
Shows:
- Cover (large)
- Title, subtitle
- Author info
- Publisher, year
- ISBN
- Description/abstract
- Page count
- Language
- "Baca Preview" button
- "Beli" button (requires login)
```

---

### **Step 5: Baca Preview (KEY FEATURE!)**

**Route:** `GET /api/v1/public/books/{id}/preview`
**Controller:** `BookFileController@preview`

```
User klik "Baca Preview"
         ↓
Backend checks:
1. Book has pdf_preview_path
2. Preview is enabled (allow_preview = true)
         ↓
Returns: Signed URL to preview PDF (10 pages max)
```

**API Response:**
```json
{
    "success": true,
    "data": {
        "url": "http://localhost:8000/api/v1/public/books/1/preview-stream",
        "preview_pages": 10,
        "total_pages": 250,
        "expires_in": 3600
    }
}
```

**Preview Streaming:**

**Route:** `GET /api/v1/public/books/{id}/preview-stream`
**Controller:** `BookFileController@previewStream`

```
Frontend: <embed src="{preview-stream-url}" />
         ↓
Streams PDF directly through Laravel
         ↓
User sees: PDF viewer in browser
- 10 sample pages only
- No download button
- No print button
- Read-only
```

**Frontend Implementation:**
```tsx
// In BookDetailPage.tsx
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

const loadPreview = async () => {
    const resp = await fetch(`/api/v1/public/books/${book.id}/preview`);
    const result = await resp.json();
    if (result.success) {
        setPreviewUrl(result.data.url);
    }
};

// Render
{previewUrl && (
    <embed 
        src={previewUrl} 
        type="application/pdf"
        width="100%"
        height="600px"
    />
)}
```

---

### **Step 6: Cite Buku (Academic)**

**Route:** `GET /api/v1/public/repository/{slug}/cite?format=apa`
**Controller:** `RepositoryController@cite`

```
User (academic) needs citation
         ↓
Clicks "Cite" button
         ↓
Chooses format: APA, MLA, Chicago, IEEE, etc.
         ↓
GET /api/v1/public/repository/{slug}/cite?format=apa
         ↓
Returns: Formatted citation
```

**API Response:**
```json
{
    "success": true,
    "data": {
        "format": "apa",
        "citation": "Doe, J. (2024). Belajar Laravel. Rizquna Elfath.",
        "all_formats": {
            "apa": "...",
            "mla": "...",
            "chicago": "...",
            "ieee": "...",
            "bibtex": "...",
            "ris": "..."
        }
    }
}
```

**Frontend:**
```tsx
// Copy citation to clipboard
const handleCopy = async (format: string, text: string) => {
    await navigator.clipboard.writeText(text);
    // Show "Copied!" toast
};

// Download RIS/BibTeX
const handleDownload = async (type: 'ris' | 'bib') => {
    window.open(`/api/v1/books/${book.id}/cite/download?type=${type}`);
};
```

---

## 🔧 BACKEND IMPLEMENTATION

### **1. BookFileController Methods**

```php
// GET /api/v1/public/books/{book}/cover
public function cover(Book $book, Request $request): JsonResponse
{
    $size = $request->get('size', 'medium');
    $url  = $this->storageService->getCoverUrl($book, $size);
    
    if (! $url) {
        return response()->json([
            'success' => false,
            'message' => 'Cover tidak tersedia',
        ], 404);
    }
    
    return response()->json([
        'success' => true,
        'data'    => [
            'url'        => $url,
            'size'       => $size,
            'expires_in' => config('books.cover_url_ttl', 3600),
        ],
    ]);
}

// GET /api/v1/public/books/{book}/preview
public function preview(Book $book): JsonResponse
{
    $url = $this->storageService->getPreviewPdfUrl($book);
    $previewPages = min(
        10,
        (int) ($book->preview?->preview_pages ?? config('books.preview_pages', 10))
    );
    
    if (! $url) {
        return response()->json([
            'success' => false,
            'message' => 'Preview tidak tersedia untuk buku ini',
        ], 404);
    }
    
    return response()->json([
        'success' => true,
        'data'    => [
            'url'           => $url,
            'preview_pages' => $previewPages,
            'total_pages'   => $book->page_count,
            'expires_in'    => config('books.preview_url_ttl', 3600),
        ],
    ]);
}

// GET /api/v1/public/books/{book}/preview-stream
public function previewStream(Book $book): StreamedResponse|JsonResponse|Response
{
    $path = $book->pdf_preview_path;
    
    if (! $path) {
        return response()->json([
            'success' => false,
            'message' => 'Preview tidak tersedia',
        ], 404);
    }
    
    // Check if preview is allowed
    if ($book->preview && ! $book->preview->allow_preview) {
        return response()->json([
            'success' => false,
            'message' => 'Preview dinonaktifkan untuk buku ini',
        ], 403);
    }
    
    // Stream PDF (local or S3/MinIO)
    return Storage::disk('books')->response($path, 'preview.pdf', [
        'Content-Type'        => 'application/pdf',
        'Content-Disposition' => 'inline', // Show in browser
        'Cache-Control'       => 'public, max-age=3600',
    ]);
}
```

---

### **2. RepositoryController Methods**

```php
// GET /api/v1/public/repository
public function index(Request $request): JsonResponse
{
    $query = Book::with(['author:id,name', 'category:id,name', 'citation'])
        ->published()
        ->select([...]);
    
    // Search
    if ($search = $request->get('q')) {
        $this->applySearch($query, $search);
    }
    
    // Filter by year
    if ($year = $request->get('year')) {
        $query->where('published_year', $year);
    }
    
    $books = $query->latest('published_year')
        ->paginate(min($request->integer('per_page', 20), 100));
    
    // Add cover_url
    $books->getCollection()->transform(function ($book) {
        if ($book->cover_path) {
            $book->setAttribute('cover_url', $this->storageService->getCoverUrl($book, 'medium'));
        } else {
            $book->setAttribute('cover_url', null);
        }
        return $book;
    });
    
    return response()->json([
        'success' => true,
        'data' => $books,
    ]);
}

// GET /api/v1/public/repository/{slug}/cite
public function cite(string $slug, Request $request): JsonResponse
{
    $book = Book::with(['author', 'citation'])
        ->where('slug', $slug)
        ->published()
        ->firstOrFail();
    
    $format = strtolower((string) $request->get('format', 'apa'));
    $citation = $this->resolveCitation($book, $format);
    
    return response()->json([
        'success' => true,
        'data' => [
            'format' => $format,
            'citation' => $citation,
            'all_formats' => $this->scholarCitationService->generateAll($book),
        ],
    ]);
}
```

---

## 📊 PUBLIC ROUTES SUMMARY

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/` | Landing page | ❌ |
| GET | `/katalog` | Browse catalog | ❌ |
| GET | `/katalog/{slug}` | Book detail | ❌ |
| GET | `/repository` | Repository index | ❌ |
| GET | `/repository/{slug}` | Repository detail | ❌ |
| GET | `/repository/{slug}/cite` | Cite book | ❌ |
| GET | `/api/v1/search` | Search books | ❌ |
| GET | `/api/v1/public/catalog` | Catalog API | ❌ |
| GET | `/api/v1/public/catalog/{id}` | Book detail API | ❌ |
| GET | `/api/v1/public/books/{id}/cover` | Book cover | ❌ |
| GET | `/api/v1/public/books/{id}/preview` | Preview URL | ❌ |
| GET | `/api/v1/public/books/{id}/preview-stream` | Stream preview | ❌ |
| GET | `/api/v1/books/{id}/cite` | Cite by ID | ❌ |
| GET | `/api/v1/books/{id}/cite/all` | All formats | ❌ |
| GET | `/api/v1/books/{id}/cite/download` | Download RIS/BibTeX | ❌ |

---

## ✅ TESTING CHECKLIST

### **Manual Testing:**

1. **Landing Page:**
   - [ ] `http://localhost:3000/` loads
   - [ ] Shows featured books
   - [ ] Shows stats

2. **Browse Catalog:**
   - [ ] `http://localhost:3000/katalog` loads
   - [ ] Shows all 70 books
   - [ ] Pagination works

3. **Search:**
   - [ ] Search "python" returns results
   - [ ] Search "laravel" returns results
   - [ ] Year filter works
   - [ ] Search with < 3 chars returns nothing

4. **Book Detail:**
   - [ ] Click book → detail page loads
   - [ ] Shows cover, title, author, etc.
   - [ ] "Baca Preview" button visible
   - [ ] "Beli" button visible (redirects to login)

5. **Read Preview:**
   - [ ] Click "Baca Preview" → PDF viewer opens
   - [ ] Shows only 10 pages (or configured preview_pages)
   - [ ] No download button
   - [ ] No print button
   - [ ] Read-only

6. **Cite:**
   - [ ] Click "Cite" → shows citation formats
   - [ ] APA format works
   - [ ] MLA format works
   - [ ] Copy to clipboard works
   - [ ] Download RIS works
   - [ ] Download BibTeX works

---

### **API Testing (cURL):**

```bash
# 1. Browse catalog
curl http://localhost:8000/api/v1/public/catalog

# 2. Search
curl "http://localhost:8000/api/v1/search?q=python"

# 3. Book detail
curl http://localhost:8000/api/v1/public/catalog/1

# 4. Get cover
curl http://localhost:8000/api/v1/public/books/1/cover

# 5. Get preview URL
curl http://localhost:8000/api/v1/public/books/1/preview

# 6. Stream preview (save to file)
curl http://localhost:8000/api/v1/public/books/1/preview-stream \
  -o preview.pdf

# 7. Cite book
curl "http://localhost:8000/api/v1/public/repository/belajar-laravel/cite?format=apa"

# 8. Get all citation formats
curl http://localhost:8000/api/v1/books/1/cite/all

# 9. Download RIS
curl http://localhost:8000/api/v1/books/1/cite/download?type=ris \
  -o citation.ris
```

---

## 🔒 SECURITY NOTES

### **What's Protected:**
```
✅ Full PDF download - Requires purchase
✅ Full PDF read - Requires purchase + BookAccess
✅ Print - Not allowed for preview
✅ Download preview - Not allowed (stream only)
```

### **What's Public:**
```
✅ Cover images - Public (marketing)
✅ Preview PDF - Public (sample pages only)
✅ Metadata - Public (title, author, description)
✅ Citations - Public (academic use)
```

---

## 📝 SUMMARY

| Feature | Status | Notes |
|---------|--------|-------|
| **Browse Catalog** | ✅ READY | No login required |
| **Search** | ✅ READY | Full-text search |
| **Book Detail** | ✅ READY | Complete metadata |
| **Cover Images** | ✅ READY | Via BookStorageService |
| **Preview PDF** | ✅ READY | 10 pages max |
| **Preview Streaming** | ✅ READY | Inline, no download |
| **Citations** | ✅ READY | APA, MLA, Chicago, IEEE, etc. |
| **Download RIS/BibTeX** | ✅ READY | For reference managers |

---

**STATUS: ✅ PENGUNJUNG FLOW COMPLETE!**

**Next:** Test each endpoint manually to ensure everything works as expected.

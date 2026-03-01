# Penulis Full Access - Rizquna ERP

## 🎯 PRINSIP DASAR

**"Penulis adalah PEMILIK KARYA, bukan sekadar pengguna"**

```
┌─────────────────────────────────────────────────────────────┐
│              BOOK ACCESS LEVELS (UPDATED)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. ADMIN (Publisher)                                        │
│     ✅ Full Access: Download, Print, Edit, Delete           │
│     ✅ Manage semua buku                                    │
│                                                              │
│  2. PENULIS (Owner/Creator) ⭐ UPDATED                       │
│     ✅ Full Access ke KARYA SENDIRI:                        │
│        - Download PDF lengkap                               │
│        - Print untuk review/revisi                          │
│        - Edit metadata buku                                 │
│        - Upload revisi                                      │
│        - View analytics lengkap                             │
│     ✅ Submit naskah baru                                    │
│     ✅ Sign kontrak                                          │
│     ✅ View royalties & sales                                │
│     ✅ Order pencetakan                                      │
│                                                              │
│  3. PEMBELI (Customer)                                       │
│     ✅ Read Online Only (yang sudah dibeli)                 │
│     ❌ NO Download, NO Print, NO Share                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 NEW PERMISSIONS (Added)

### **Owner Access Permissions:**
```php
// Digital Library - Owner (Penulis untuk karya sendiri)
'library.download.own',      // Download own books
'library.print.own',         // Print own books  
'library.manage.own',        // Manage own books (edit metadata, etc)

// Author - Penulis
'author.books.manage',       // Manage own published books
```

### **Total User Permissions:** 20 (was 16)

---

## 🔧 IMPLEMENTATION

### **1. Middleware: CheckBookOwnership**

**File:** `app/Http/Middleware/CheckBookOwnership.php`

```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();
    $book = $request->route('book');
    
    // Admin can access all books
    if ($user->isAdmin()) {
        return $next($request);
    }
    
    // Check if user is the author/owner
    $isOwner = $user->author && $user->author->id === $book->author_id;
    
    if ($isOwner) {
        // Author accessing their own work - FULL ACCESS
        return $next($request);
    }
    
    // Not owner - check BookAccess (pembeli)
    $hasAccess = BookAccess::where('user_id', $user->id)
        ->where('book_id', $book->id)
        ->where('is_active', true)
        ->exists();
    
    if (!$hasAccess) {
        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki akses ke buku ini.',
        ], 403);
    }
    
    // Pembeli - read-only access
    return $next($request);
}
```

---

### **2. Service: BookStorageService**

**Updated Method:** `getFullPdfUrl()`

```php
public function getFullPdfUrl(Book $book, bool $checkOwnership = false): ?string
{
    if (! $book->pdf_full_path) {
        return null;
    }

    $user = auth()->user();
    
    if (!$user) {
        return null;
    }

    // Check ownership or admin
    if ($checkOwnership) {
        // Author accessing own work OR admin
        $isOwner = $user->author && $user->author->id === $book->author_id;
        
        if ($isOwner || $user->isAdmin()) {
            // Full access for owner/admin - longer TTL (24 hours)
            $ttl = config('books.signed_url_ttl', 3600) * 24;
            return $this->getSignedUrl($book->pdf_full_path, $ttl);
        }
        return null;
    }

    // Check BookAccess for regular users (pembeli)
    $hasAccess = BookAccess::where('user_id', $user->id)
        ->where('book_id', $book->id)
        ->where('is_active', true)
        ->exists();

    if (!$hasAccess) {
        return null;
    }

    // Regular access (pembeli) - shorter TTL (30 minutes)
    $ttl = config('books.signed_url_ttl', 1800);
    return $this->getSignedUrl($book->pdf_full_path, $ttl);
}
```

---

### **3. Usage in Controllers**

#### **Example 1: Download PDF (Author Full Access)**

```php
// In BookFileController.php

public function download(Book $book, Request $request)
{
    $user = $request->user();
    
    // Check if user is author/owner
    $isOwner = $user->author && $user->author->id === $book->author_id;
    
    if ($isOwner || $user->isAdmin()) {
        // Owner/admin - full access download
        $pdfUrl = $this->storageService->getFullPdfUrl($book, true);
        
        if (!$pdfUrl) {
            return response()->json([
                'success' => false,
                'message' => 'PDF tidak tersedia',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'download_url' => $pdfUrl,
                'access_level' => 'full',
                'expires_in' => 86400, // 24 hours
            ],
        ]);
    }
    
    // Not owner - check BookAccess
    $access = BookAccess::where('user_id', $user->id)
        ->where('book_id', $book->id)
        ->where('is_active', true)
        ->first();
    
    if (!$access) {
        return response()->json([
            'success' => false,
            'message' => 'Anda belum membeli buku ini.',
        ], 403);
    }
    
    // Pembeli - read-only, no download
    return response()->json([
        'success' => false,
        'message' => 'Download hanya tersedia untuk penulis dan admin.',
    ], 403);
}
```

#### **Example 2: Edit Book Metadata (Author Only)**

```php
// In AuthorPortalController.php

public function updateBook(Request $request, $bookId)
{
    $user = $request->user();
    $author = $user->author;
    
    // Check ownership
    $book = Book::where('author_id', $author->id)->findOrFail($bookId);
    
    // Check permission
    if (!$user->can('author.books.manage')) {
        return response()->json([
            'success' => false,
            'message' => 'Anda tidak memiliki izin untuk mengelola buku.',
        ], 403);
    }
    
    $validated = $request->validate([
        'title' => ['sometimes', 'string', 'max:255'],
        'description' => ['nullable', 'string'],
        'price' => ['nullable', 'numeric', 'min:0'],
    ]);
    
    $book->update($validated);
    
    return response()->json([
        'success' => true,
        'message' => 'Buku berhasil diupdate.',
        'data' => $book->fresh(),
    ]);
}
```

---

## 📊 ACCESS MATRIX (UPDATED)

| Fitur | Pembeli | Penulis (Own Book) | Penulis (Other) | Admin |
|-------|---------|---------------------|-----------------|-------|
| **Read Online** | ✅ (purchased) | ✅ (own + purchased) | ✅ (purchased) | ✅ |
| **Download PDF** | ❌ | ✅ (OWN ONLY) | ❌ | ✅ |
| **Print** | ❌ | ✅ (OWN ONLY) | ❌ | ✅ |
| **Edit Metadata** | ❌ | ✅ (OWN ONLY) | ❌ | ✅ |
| **Upload Revision** | ❌ | ✅ (OWN ONLY) | ❌ | ✅ |
| **View Analytics** | ❌ | ✅ (OWN ONLY) | ❌ | ✅ |
| **Delete Book** | ❌ | ❌ (admin only) | ❌ | ✅ |

---

## 🎯 USER STORIES

### **Story 1: Penulis Download Buku Sendiri**

```
Scenario: Penulis ingin download PDF buku sendiri untuk review

Given penulis sudah login
And penulis memiliki buku yang sudah terbit
When penulis akses halaman buku sendiri
Then penulis bisa klik "Download PDF"
And PDF terdownload dengan URL signed (24 hours)
```

### **Story 2: Pembeli Tidak Bisa Download**

```
Scenario: Pembeli ingin download buku yang sudah dibeli

Given pembeli sudah login
And pembeli sudah beli buku
When pembeli akses halaman buku
Then pembeli TIDAK bisa klik "Download PDF"
And pembeli hanya bisa "Baca Online"
```

### **Story 3: Penulis Edit Metadata Buku**

```
Scenario: Penulis ingin update deskripsi buku

Given penulis sudah login
And penulis memiliki buku terbit
When penulis edit deskripsi buku sendiri
Then perubahan tersimpan
And buku diupdate dengan timestamp revisi
```

---

## 🔒 SECURITY NOTES

### **Important:**

1. **Ownership Check is Mandatory**
   ```php
   // ALWAYS check ownership before granting full access
   $isOwner = $user->author && $user->author->id === $book->author_id;
   ```

2. **Signed URL TTL Differentiation**
   ```php
   // Owner/Admin: 24 hours
   $ttl = 3600 * 24;
   
   // Pembeli: 30 minutes (read-only)
   $ttl = 1800;
   ```

3. **Middleware Stack**
   ```php
   // For author-only endpoints
   Route::middleware(['auth:sanctum', 'check.book.ownership'])
       ->get('/books/{book}/download', [BookFileController::class, 'download']);
   ```

---

## ✅ TESTING CHECKLIST

**Backend:**
- [ ] Penulis bisa download PDF buku sendiri
- [ ] Penulis TIDAK bisa download PDF buku orang lain
- [ ] Pembeli TIDAK bisa download PDF (meski sudah beli)
- [ ] Pembeli bisa baca online buku yang dibeli
- [ ] Admin bisa download semua buku
- [ ] Penulis bisa edit metadata buku sendiri
- [ ] Penulis TIDAK bisa edit metadata buku orang lain

**Frontend:**
- [ ] Button "Download PDF" hanya muncul untuk penulis (buku sendiri)
- [ ] Button "Download PDF" tidak muncul untuk pembeli
- [ ] Button "Edit Buku" hanya muncul untuk penulis (buku sendiri)
- [ ] Read online works untuk pembeli

---

## 📝 MIGRATION

```bash
# 1. Run seeder
php artisan db:seed --class=RolePermissionSeeder

# 2. Clear cache
php artisan optimize:clear

# 3. Test permission
php artisan tinker
>>> $user = App\Models\User::first();
>>> $user->can('library.download.own'); // should be true
>>> $user->can('library.print.own'); // should be true
```

---

## 📖 SUMMARY

**Perubahan Utama:**
- ✅ Penulis dapat **FULL ACCESS** ke karya sendiri
- ✅ Penulis bisa **Download, Print, Edit** buku sendiri
- ✅ Pembeli tetap **Read-Only** (no download/print)
- ✅ Admin tetap **Full Access** ke semua buku

**Files Modified:**
1. `database/seeders/RolePermissionSeeder.php` - Added owner permissions
2. `app/Services/BookStorageService.php` - Check ownership for PDF access
3. `app/Http/Middleware/CheckBookOwnership.php` - NEW middleware
4. `bootstrap/app.php` - Register middleware

**STATUS: ✅ READY FOR TESTING**

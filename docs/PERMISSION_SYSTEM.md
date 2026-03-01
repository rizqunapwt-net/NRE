# Permission System - Rizquna ERP

## 📋 Konsep Multi-Fungsi User

### **Prinsip Dasar:**
```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE SYSTEM                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Admin (1 role)                                              │
│  └── Full access ke semua fitur                             │
│                                                              │
│  User (1 role - MULTI FUNGSI)                               │
│  ├── Pengunjung/Pembeli (Read-only)                         │
│  │   ├── Browse katalog                                     │
│  │   ├── Search buku                                        │
│  │   ├── Cite buku (akademik)                               │
│  │   └── Read buku YANG SUDAH DIBELI (no download/print)   │
│  │                                                           │
│  └── Penulis (Author)                                        │
│      ├── Submit naskah penerbitan                           │
│      ├── Order pencetakan buku                              │
│      ├── Sign kontrak                                       │
│      ├── View royalti & sales                               │
│      └── Manage profil penulis                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Permission Structure

### **ADMIN PERMISSIONS (28 permissions):**

```php
// System & User Management
- users.manage              // CRUD users, assign roles
- users.view                // View user list
- roles.manage              // Manage roles & permissions
- dashboard.admin           // Admin dashboard access
- reports.view              // View system reports
- audit.view                // View audit logs
- system.settings           // System configuration

// Publishing Management
- authors.manage            // CRUD authors (admin side)
- books.manage              // CRUD books (admin side)
- contracts.manage          // Approve/reject contracts
- marketplaces.manage       // Manage marketplace integration
- assignments.manage        // Assign books to marketplace
- sales.import              // Import sales CSV
- royalties.manage          // Calculate & finalize royalties
- publishing-requests.manage// Review publishing requests
- isbn.manage               // Manage ISBN requests
- legal-deposit.manage      // Manage legal deposit

// Finance Management
- payments.manage           // Manage payments
- accounting.manage         // Manage accounting
- invoices.manage           // Manage invoices
- expenses.manage           // Manage expenses

// Percetakan Management
- percetakan.customers.manage
- percetakan.orders.manage
- percetakan.inventory.manage
- percetakan.production.manage

// HRM
- hrm.attendance.manage
- hrm.leave.manage
- hrm.payroll.manage

// Website CMS
- website.manage            // Manage website content
```

### **USER PERMISSIONS (16 permissions - Multi-fungsi):**

```php
// Dashboard & Profile
- dashboard.user            // User dashboard access
- profile.manage            // Manage own profile

// Digital Library - Reader (Pengunjung/Pembeli)
- library.browse            // Browse catalog
- library.search            // Search books
- library.read              // Read purchased books (ownership check)
- library.purchase          // Purchase books
- library.cite              // Cite books (academic)

// Author - Penulis
- author.dashboard          // Author dashboard
- author.profile            // Manage author profile
- author.manuscript.submit  // Submit manuscript
- author.manuscript.view    // View own manuscripts
- author.contract.sign      // Sign contracts
- author.royalty.view       // View royalty reports
- author.sales.view         // View sales data
- author.print-order        // Order printing

// Communication
- chat.use                  // Use chat feature
- notifications.manage      // Manage notification preferences
```

---

## 🎯 Access Control Logic

### **1. Pembeli/Pengunjung (Read-Only)**

**Flow:**
```
User → Browse catalog (library.browse)
     → Search books (library.search)
     → View book detail (public)
     → Purchase book (library.purchase)
        ↓
     Payment verified
        ↓
     BookAccess created (user_id, book_id, access_level='read')
        ↓
     Read book (library.read) → CheckBookAccess middleware
        ✅ ALLOW: Read online
        ❌ DENY: Download, print, share
```

**Middleware: CheckBookAccess**
```php
public function handle(Request $request, Closure $next): Response
{
    $book = $request->route('book');
    $user = $request->user();

    // Check if user has access
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

    // Check access level
    if ($access->access_level !== 'read') {
        return response()->json([
            'success' => false,
            'message' => 'Akses ditolak.',
        ], 403);
    }

    // Check restrictions (no download, print, share)
    if ($access->restrictions) {
        $restrictions = json_decode($access->restrictions, true);
        if ($restrictions['no_download'] ?? false) {
            // Block download
        }
        if ($restrictions['no_print'] ?? false) {
            // Block print
        }
        if ($restrictions['no_share'] ?? false) {
            // Block share
        }
    }

    return $next($request);
}
```

---

### **2. Penulis (Author)**

**Flow:**
```
User → Register as author (auto-verified)
     → Access author dashboard (author.dashboard)
     → Submit manuscript (author.manuscript.submit)
        ↓
     PublishingRequest created
        ↓
     Admin review
        ↓
     If approved:
        - Contract created
        - User can sign (author.contract.sign)
        - Book published
        - User can view sales (author.sales.view)
        - User can view royalties (author.royalty.view)
        - User can order printing (author.print-order)
```

**Middleware: EnsureUserPortalAccess**
```php
public function handle(Request $request, Closure $next): Response
{
    $user = $request->user();

    if ($user->isAdmin()) {
        return $next($request);
    }

    // Check if user is verified author
    if (!$user->is_verified_author) {
        return response()->json([
            'success' => false,
            'message' => 'Akses ditolak. Akun belum terverifikasi sebagai penulis.',
        ], 403);
    }

    return $next($request);
}
```

---

## 📊 User Journey Matrix

| Feature | Pengunjung | Pembeli | Penulis | Admin |
|---------|-----------|---------|---------|-------|
| Browse catalog | ✅ | ✅ | ✅ | ✅ |
| Search books | ✅ | ✅ | ✅ | ✅ |
| Read book detail | ✅ | ✅ | ✅ | ✅ |
| Cite book | ✅ | ✅ | ✅ | ✅ |
| Purchase book | ❌ | ✅ | ✅ | ✅ |
| Read purchased book | ❌ | ✅ | ✅ | ✅ |
| Download PDF | ❌ | ❌ | ❌ | ✅ |
| Print book | ❌ | ❌ | ❌ | ✅ |
| Submit manuscript | ❌ | ❌ | ✅ | ✅ |
| Sign contract | ❌ | ❌ | ✅ | ✅ |
| View sales | ❌ | ❌ | ✅ (own) | ✅ (all) |
| View royalties | ❌ | ❌ | ✅ (own) | ✅ (all) |
| Order printing | ❌ | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

---

## 🔧 Implementation Guide

### **1. Check Permission in Controller:**

```php
// Check if user can purchase
if (!$user->can('library.purchase')) {
    return response()->json([
        'success' => false,
        'message' => 'Anda tidak memiliki izin untuk membeli buku.',
    ], 403);
}

// Check if user can submit manuscript
if (!$user->can('author.manuscript.submit')) {
    return response()->json([
        'success' => false,
        'message' => 'Anda tidak memiliki izin untuk submit naskah.',
    ], 403);
}
```

### **2. Check Ownership (for author data):**

```php
// Get user's own manuscripts
$manuscripts = Manuscript::where('author_id', $user->author->id)->get();

// Get user's own sales
$sales = Sale::whereHas('book', function($q) use ($user) {
    $q->where('author_id', $user->author->id);
})->get();

// Get user's own royalties
$royalties = RoyaltyCalculation::where('author_id', $user->author->id)->get();
```

### **3. Check Book Access (for readers):**

```php
// Check if user has purchased the book
$hasAccess = BookAccess::where('user_id', $user->id)
    ->where('book_id', $book->id)
    ->where('is_active', true)
    ->exists();

if (!$hasAccess) {
    return response()->json([
        'success' => false,
        'message' => 'Anda belum membeli buku ini.',
    ], 403);
}
```

---

## 📝 Migration & Seeder

### **Run Seeder:**
```bash
php artisan db:seed --class=RolePermissionSeeder
```

### **Check Permissions:**
```bash
php artisan tinker

// Check user permissions
$user = App\Models\User::first();
$user->getPermissionNames();

// Check if user has permission
$user->can('library.purchase'); // true/false
$user->can('author.manuscript.submit'); // true/false

// Check admin permissions
$admin = App\Models\User::where('email', 'admin@rizquna.id')->first();
$admin->hasRole('Admin'); // true
$admin->can('users.manage'); // true
```

---

## 🚨 Security Notes

### **Important:**
1. **Always check ownership** - User can only access their own data
2. **Always check book access** - User can only read purchased books
3. **Use middleware** - Don't rely on frontend checks only
4. **Log access** - Audit trail untuk semua akses sensitif

### **Best Practices:**
```php
// ✅ GOOD: Check permission + ownership
public function viewManuscript(Request $request, $id)
{
    $user = $request->user();
    
    // Check permission
    abort_unless($user->can('author.manuscript.view'), 403);
    
    // Check ownership
    $manuscript = Manuscript::where('author_id', $user->author->id)
        ->findOrFail($id);
    
    return response()->json(['data' => $manuscript]);
}

// ❌ BAD: No ownership check
public function viewManuscript(Request $request, $id)
{
    // Anyone with permission can view ANY manuscript!
    $manuscript = Manuscript::findOrFail($id);
    return response()->json(['data' => $manuscript]);
}
```

---

## 📖 Summary

**Role System:**
- **Admin**: Full access (28 permissions)
- **User**: Multi-fungsi (16 permissions) - context-based access

**User Functions:**
1. **Pengunjung**: Browse, search, cite (no purchase required)
2. **Pembeli**: Purchase + read books (ownership-based, no download/print)
3. **Penulis**: Submit manuscripts, sign contracts, view sales/royalties, order printing

**Access Control:**
- **Permission checks**: `can('permission.name')`
- **Ownership checks**: `where('author_id', $user->author->id)`
- **Book access checks**: `BookAccess::where('user_id', $user->id)`

**STATUS: ✅ READY FOR IMPLEMENTATION**

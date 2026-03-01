# Google OAuth Configuration & Security - Rizquna ERP

## 📋 OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE OAUTH 2.0 FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User klik "Login dengan Google"                         │
│     ↓                                                        │
│  2. Redirect ke Google Consent Screen                        │
│     ↓                                                        │
│  3. User login Google & approve permissions                  │
│     ↓                                                        │
│  4. Google redirect back dengan code                         │
│     ↓                                                        │
│  5. Backend exchange code untuk user info                    │
│     ↓                                                        │
│  6. Create/Update user di database                           │
│     ↓                                                        │
│  7. Generate Sanctum token                                   │
│     ↓                                                        │
│  8. Redirect ke dashboard                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 1. KONFIGURASI DATABASE

### **TIDAK ADA perubahan schema!**

Google OAuth menggunakan tabel yang **SAMA** dengan register/login biasa:

**Table:** `users`

```sql
-- Kolom yang sudah ada:
id                  - Primary key
name                - User name
email               - Email (dari Google, auto-verified)
username            - Auto-generated dari name
password            - Random string (tidak pernah dipakai)
email_verified_at   - Auto-set to now()
is_active           - true
is_verified_author  - false (default)
google_id           - ✅ KOLOM PENTING! Google user ID
avatar_url          - ✅ Foto profil dari Google
created_at          - Timestamp
updated_at          - Timestamp
```

### **TIDAK PERLU migration baru!**

Semua kolom sudah ada di migration:
```php
// 2026_02_22_000001_add_google_oauth_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->string('google_id')->nullable()->unique();
    $table->string('avatar_url')->nullable();
});
```

---

## ⚙️ 2. KONFIGURASI ENVIRONMENT

### **File: `.env`**

```env
# Google OAuth (untuk Login)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# Production:
# GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback

# Google Workspace (untuk Sinkronisasi ERP) - OPTIONAL
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_DRIVE_COVERS_FOLDER_ID=
GOOGLE_DRIVE_PDFS_FOLDER_ID=
GOOGLE_SHEETS_LIBRARY_ID=
```

### **File: `config/services.php`**

```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
    'service_account_json' => env('GOOGLE_SERVICE_ACCOUNT_JSON'),
    'drive' => [
        'covers_folder_id' => env('GOOGLE_DRIVE_COVERS_FOLDER_ID'),
        'pdfs_folder_id' => env('GOOGLE_DRIVE_PDFS_FOLDER_ID'),
    ],
    'sheets' => [
        'library_id' => env('GOOGLE_SHEETS_LIBRARY_ID'),
    ],
],
```

---

## 🎯 3. GOOGLE CLOUD CONSOLE SETUP

### **Step-by-Step Configuration:**

#### **1. Buat Project di Google Cloud Console**

```
1. Buka https://console.cloud.google.com/
2. Klik "Select a project" → "New Project"
3. Project name: "Rizquna ERP"
4. Create
```

#### **2. Enable Google+ API (untuk user info)**

```
1. APIs & Services → Library
2. Search "Google+ API"
3. Enable
```

#### **3. Create OAuth 2.0 Credentials**

```
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: "Web application"
4. Name: "Rizquna ERP Web Client"
```

#### **4. Configure Authorized Redirect URIs**

```
Development:
- http://localhost:8000/api/v1/auth/google/callback

Production:
- https://your-domain.com/api/v1/auth/google/callback

Klik "Add URI" → Save
```

#### **5. Dapatkan Credentials**

```
Client ID: xxxxxx.apps.googleusercontent.com
Client Secret: xxxxxxxxxxxxxxx

Copy ke .env:
GOOGLE_CLIENT_ID=xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxx
```

---

## 📜 4. GOOGLE CONSENT SCREEN

### **Persetujuan yang Ditampilkan ke User:**

```
┌─────────────────────────────────────────────────────────────┐
│          GOOGLE CONSENT SCREEN                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  "Rizquna ERP" meminta akses ke Akun Google Anda            │
│                                                              │
│  ✅ Lihat alamat email utama Anda                            │
│  ✅ Lihat informasi profil dasar Anda                        │
│     - Nama                                                   │
│     - Foto profil                                            │
│                                                              │
│  [Izinkan] [Tolak]                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Scopes yang Diminta:**

```php
// Laravel Socialite default scopes untuk Google:
- openid
- email
- profile
```

**Data yang Diakses:**
- ✅ Email address
- ✅ Full name
- ✅ Profile photo URL
- ✅ Google ID (unique identifier)

**Data yang TIDAK Diakses:**
- ❌ Password Google
- ❌ Gmail/Email contents
- ❌ Google Drive files
- ❌ Google Calendar
- ❌ Contacts
- ❌ Location data

---

## 🔐 5. SECURITY ANALYSIS

### **✅ KEAMANAN YANG SUDAH DIIMPLEMENTASIKAN:**

#### **1. No Password Storage**
```php
// User creation dari Google
$user = User::create([
    'name' => $googleUser->getName(),
    'email' => $googleUser->getEmail(),
    'username' => Str::slug($googleUser->getName()).'-'.Str::random(4),
    'password' => Hash::make(Str::random(32)), // Random, tidak pernah dipakai
    'google_id' => $googleUser->getId(),
    'avatar_url' => $googleUser->getAvatar(),
    'email_verified_at' => now(), // Auto-verified by Google
]);
```

**Status:** ✅ **EXCELLENT**
- Password random 32 chars (tidak bisa dipakai untuk login biasa)
- Email auto-verified (Google sudah verify)
- User hanya bisa login via Google (lebih aman)

#### **2. State Parameter (CSRF Protection)**

```php
// GoogleAuthController.php
$googleUser = Socialite::driver('google')
    ->redirectUrl($this->googleRedirectUri())
    ->stateless()  // ⚠️ TIDAK ADA STATE CHECK!
    ->user();
```

**Status:** ⚠️ **ISSUE FOUND**

**Problem:** `->stateless()` berarti tidak ada CSRF protection untuk OAuth flow

**Fix:**
```php
// Remove ->stateless() jika menggunakan session
// ATAU implement manual state check

$googleUser = Socialite::driver('google')
    ->redirectUrl($this->googleRedirectUri())
    ->user(); // Laravel will handle state automatically
```

**Severity:** 🟡 **MEDIUM**
**Impact:** CSRF attack possible (user bisa di-force login dengan akun attacker)
**Recommendation:** Fix ini!

---

#### **3. Email Verification**

```php
// Email verified otomatis karena Google sudah verify
'email_verified_at' => now(),
```

**Status:** ✅ **EXCELLENT**
- Google sudah verify email ownership
- Tidak perlu email verification lagi
- Lebih secure daripada manual registration

---

#### **4. Account Linking Logic**

```php
// Check if user exists by Google ID OR email
$user = User::where('google_id', $googleUser->getId())
    ->orWhere('email', $googleUser->getEmail())
    ->first();

if ($user) {
    // Link Google account to existing user
    $user->update([
        'google_id' => $googleUser->getId(),
        'avatar_url' => $googleUser->getAvatar(),
    ]);
} else {
    // Create new user
    $user = User::create([...]);
}
```

**Status:** ⚠️ **SECURITY ISSUE**

**Problem:** Email enumeration & account takeover!

**Attack Scenario:**
1. User register dengan email `victim@gmail.com` (manual)
2. Attacker login dengan Google menggunakan `victim@gmail.com`
3. System link Google account ke victim's account
4. Attacker sekarang punya akses ke victim's account!

**Fix:**
```php
// Option 1: Only link if email matches AND google_id is null
$user = User::where('google_id', $googleUser->getId())->first();

if (!$user) {
    // Check if email exists
    $existingUser = User::where('email', $googleUser->getEmail())->first();
    
    if ($existingUser && $existingUser->google_id !== null) {
        // Email sudah linked ke Google account lain
        // Jangan auto-link, minta user konfirmasi
        return $this->callbackErrorResponse(
            $request,
            'Email ini sudah terdaftar. Silakan login dengan akun Google yang sama atau gunakan password.',
            409
        );
    }
    
    if ($existingUser) {
        // Email exists tapi belum linked Google
        // Auto-link ONLY jika email verified
        if ($existingUser->email_verified_at) {
            $existingUser->update([
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
            ]);
            $user = $existingUser;
        } else {
            // Email belum verified, jangan auto-link
            return $this->callbackErrorResponse(
                $request,
                'Email sudah terdaftar tapi belum diverifikasi. Silakan verifikasi email terlebih dahulu.',
                403
            );
        }
    } else {
        // Email belum terdaftar, create new user
        $user = User::create([...]);
    }
}
```

**Severity:** 🔴 **HIGH**
**Impact:** Account takeover possible
**Recommendation:** **FIX INI SEBELUM PRODUCTION!**

---

#### **5. Token Generation**

```php
// Generate Sanctum token
$token = $user->createToken('google-oauth')->plainTextToken;
```

**Status:** ✅ **GOOD**
- Using Laravel Sanctum (secure)
- Token has device name ('google-oauth')
- Can be revoked from user settings

---

#### **6. User Info Exposure in URL**

```php
// buildFrontendCallbackUrl method
return $this->frontendCallbackUri().'?'.http_build_query([
    'token' => $token,
    'user' => json_encode($userPayload, JSON_UNESCAPED_UNICODE),
]);
```

**Status:** ⚠️ **SECURITY ISSUE**

**Problem:** User data (including token) di URL query parameter!

**Risks:**
- Token visible in browser history
- Token visible in server logs
- Token visible in Referer header
- User data exposed in URL

**Fix:**
```php
// Option 1: Use POST with FormData (recommended)
// Frontend callback menerima token via POST

// Option 2: Store in session, redirect with session ID
session(['oauth_token' => $token]);
return redirect($this->frontendCallbackUri());

// Frontend fetch token from session

// Option 3: Use fragment identifier (#) instead of query (?)
return $this->frontendCallbackUri().'#'.http_build_query([
    'token' => $token,
    'user' => json_encode($userPayload),
]);
// Fragment tidak dikirim ke server, hanya client-side
```

**Severity:** 🔴 **HIGH**
**Impact:** Token leakage, session hijacking
**Recommendation:** **FIX INI SEBELUM PRODUCTION!**

---

## ✅ 6. RECOMMENDED FIXES

### **Fix 1: Account Takeover Prevention**

**File:** `app/Http/Controllers/Api/V1/GoogleAuthController.php`

```php
public function callback(Request $request): JsonResponse|RedirectResponse
{
    // ... existing code ...
    
    $googleUser = Socialite::driver('google')->user();
    
    // 1. Check by Google ID first
    $user = User::where('google_id', $googleUser->getId())->first();
    
    if ($user) {
        // Existing Google user, login
        $user->update(['avatar_url' => $googleUser->getAvatar()]);
    } else {
        // 2. Google ID not found, check by email
        $existingUser = User::where('email', $googleUser->getEmail())->first();
        
        if ($existingUser) {
            // Email exists - check if already linked to Google
            if ($existingUser->google_id !== null) {
                // Email sudah linked ke Google account lain
                return $this->callbackErrorResponse(
                    $request,
                    'Email ini sudah terhubung dengan akun Google lain. Silakan gunakan akun Google yang sesuai atau login dengan password.',
                    409
                );
            }
            
            // Email exists tapi belum linked Google
            // Auto-link ONLY jika email sudah verified
            if ($existingUser->email_verified_at) {
                $existingUser->update([
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                ]);
                $user = $existingUser;
            } else {
                // Email belum verified
                return $this->callbackErrorResponse(
                    $request,
                    'Email sudah terdaftar tapi belum diverifikasi. Silakan verifikasi email terlebih dahulu atau gunakan password untuk login.',
                    403
                );
            }
        } else {
            // 3. Email belum terdaftar, create new user
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'username' => Str::slug($googleUser->getName()).'-'.Str::random(4),
                'google_id' => $googleUser->getId(),
                'avatar_url' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::random(32)),
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
            
            // Assign role
            if (class_exists(\Spatie\Permission\Models\Role::class)) {
                $userRole = \Spatie\Permission\Models\Role::firstOrCreate(
                    ['name' => 'User', 'guard_name' => 'web']
                );
                $user->assignRole($userRole);
            }
        }
    }
    
    // ... rest of code ...
}
```

---

### **Fix 2: Token in URL (Use Fragment Instead)**

```php
private function buildFrontendCallbackUrl(string $token, User $user): string
{
    $userPayload = [
        'id' => $user->id,
        'name' => (string) $user->name,
        'email' => (string) $user->email,
        'username' => (string) $user->username,
        'role' => strtoupper((string) ($user->roles->first()?->name ?? 'USER')),
        'is_verified_author' => (bool) $user->is_verified_author,
        'google_id' => $user->google_id,
        'avatar_url' => $user->avatar_url,
    ];
    
    // Use fragment identifier (#) instead of query (?)
    // Fragment tidak dikirim ke server, lebih aman
    return $this->frontendCallbackUri().'#'.http_build_query([
        'token' => $token,
        'user' => json_encode($userPayload, JSON_UNESCAPED_UNICODE),
    ]);
}
```

---

### **Fix 3: Remove stateless()**

```php
// Remove ->stateless() untuk enable CSRF protection
$googleUser = Socialite::driver('google')
    ->redirectUrl($this->googleRedirectUri())
    ->user(); // Laravel handles state automatically
```

---

## 📊 7. SECURITY COMPARISON

| Aspect | Manual Register | Google OAuth |
|--------|----------------|--------------|
| **Password Security** | ✅ bcrypt | ✅ No password stored |
| **Email Verification** | ⚠️ Manual (can skip) | ✅ Auto (Google verified) |
| **Brute Force** | ✅ Rate limited | ✅ Google protects |
| **Account Takeover** | ✅ Email unique | ⚠️ NEEDS FIX |
| **Token Exposure** | ✅ In response body | ⚠️ In URL (NEEDS FIX) |
| **CSRF Protection** | ✅ Sanctum | ⚠️ stateless() issue |
| **User Data** | ✅ Minimal | ⚠️ In URL (NEEDS FIX) |

---

## ✅ 8. FINAL CHECKLIST

### **Before Production:**

- [ ] 🔴 **FIX: Account takeover prevention** (HIGH priority)
- [ ] 🔴 **FIX: Token in URL** (HIGH priority)
- [ ] 🟡 **FIX: Remove stateless()** (MEDIUM priority)
- [ ] ✅ Configure Google Cloud Console
- [ ] ✅ Set GOOGLE_CLIENT_ID in .env
- [ ] ✅ Set GOOGLE_CLIENT_SECRET in .env
- [ ] ✅ Set GOOGLE_REDIRECT_URI in .env
- [ ] ✅ Test login flow
- [ ] ✅ Test account linking
- [ ] ✅ Test token revocation

---

## 📝 9. TESTING GUIDE

### **Test 1: New User Google Login**

```bash
# 1. Klik "Login dengan Google" di frontend
# 2. Login dengan Google account yang belum terdaftar
# 3. Approve permissions
# 4. Should redirect to dashboard
# 5. Check database:
php artisan tinker
>>> User::where('email', 'test@gmail.com')->first();
# Should show user with google_id set
```

### **Test 2: Existing User Google Link**

```bash
# 1. Register manual dengan email test@gmail.com
# 2. Logout
# 3. Login dengan Google menggunakan test@gmail.com
# 4. Should auto-link Google account
# 5. Check database:
>>> User::where('email', 'test@gmail.com')->first();
# Should show user with google_id set AND can login with both methods
```

### **Test 3: Account Takeover Prevention**

```bash
# 1. User A register manual dengan victim@gmail.com
# 2. Attacker create Google account dengan victim@gmail.com
# 3. Attacker login dengan Google
# 4. Should FAIL (email already linked to different Google ID)
```

---

## 📖 SUMMARY

### **Database:**
- ✅ **NO migration needed** (kolom sudah ada)
- ✅ Uses existing `users` table
- ✅ `google_id` column for linking

### **Configuration:**
- ✅ Set `GOOGLE_CLIENT_ID`
- ✅ Set `GOOGLE_CLIENT_SECRET`
- ✅ Set `GOOGLE_REDIRECT_URI`
- ✅ Configure Google Cloud Console

### **Security:**
- ⚠️ **Account takeover** - NEEDS FIX (HIGH)
- ⚠️ **Token in URL** - NEEDS FIX (HIGH)
- ⚠️ **stateless() CSRF** - NEEDS FIX (MEDIUM)
- ✅ Email auto-verified
- ✅ No password stored
- ✅ Google protects from brute force

### **Consent:**
- ✅ User approves: email, name, photo
- ✅ No sensitive data accessed
- ✅ User can revoke access anytime

---

**STATUS:** ⚠️ **NEEDS CRITICAL FIXES BEFORE PRODUCTION**

**Priority:**
1. 🔴 Fix account takeover (30 min)
2. 🔴 Fix token in URL (15 min)
3. 🟡 Fix stateless CSRF (10 min)

**Dokumentasi:**
- ✅ `docs/GOOGLE_OAUTH_SECURITY_AUDIT.md` - Complete guide

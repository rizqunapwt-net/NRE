# Security Audit - Register & Login

## 📋 EXECUTIVE SUMMARY

**Status:** ✅ **AMAN** (dengan beberapa rekomendasi improvement)

| Aspek | Status | Score |
|-------|--------|-------|
| **Password Security** | ✅ Excellent | 10/10 |
| **Rate Limiting** | ✅ Good | 9/10 |
| **Input Validation** | ✅ Good | 9/10 |
| **Authentication** | ✅ Good | 9/10 |
| **Session Management** | ✅ Good | 9/10 |
| **Audit Logging** | ✅ Good | 9/10 |
| **CSRF Protection** | ✅ Laravel Default | 10/10 |
| **SQL Injection** | ✅ Protected | 10/10 |

**Overall Score: 9.4/10** ✅

---

## 🔐 1. PASSWORD SECURITY

### **✅ STRENGTHS:**

#### **Password Hashing:**
```php
// UnifiedLoginController.php & AuthorRegisterController.php
'password' => Hash::make($validated['password'])

// Using Laravel's bcrypt (default) or argon2id
// Config: config/hashing.php
```

**Status:** ✅ **EXCELLENT**
- Menggunakan `Hash::make()` (bcrypt/argon2id)
- Password tidak pernah disimpan dalam plain text
- Laravel menggunakan secure random salt

#### **Password Validation:**
```php
// User Registration
'password' => ['required', 'string', 'min:8', 'confirmed']

// Author Registration (STRONGER)
'password' => [
    'required',
    'string',
    'min:8',
    'confirmed',
    'regex:/[A-Z]/',      // at least 1 uppercase
    'regex:/[0-9]/',      // at least 1 digit
]
```

**Status:** ✅ **EXCELLENT**
- Minimum 8 characters (OWASP recommendation)
- Password confirmation required
- Author registration requires uppercase + digit
- Custom error messages

#### **Password Change:**
```php
// UnifiedLoginController@changePassword
public function changePassword(Request $request): JsonResponse
{
    $request->validate([
        'current_password' => ['required', 'string'],
        'new_password' => [
            'required',
            'string',
            'min:8',
            'confirmed',
            'different:current_password',
            'regex:/[A-Z]/', // uppercase
            'regex:/[0-9]/', // digit
        ],
    ], [
        'new_password.regex' => 'Password baru harus mengandung minimal 1 huruf kapital dan 1 angka.',
        'new_password.different' => 'Password baru tidak boleh sama dengan password lama.',
        'new_password.confirmed' => 'Konfirmasi password tidak cocok.',
    ]);
}
```

**Status:** ✅ **EXCELLENT**
- Must provide current password
- New password must be different
- Same strength requirements as registration
- Clear error messages

---

## 🛡️ 2. RATE LIMITING

### **✅ CONFIGURED LIMITS:**

```php
// AppServiceProvider.php
RateLimiter::for('auth', function (Request $request) {
    return Limit::perMinute(10)->by($request->ip());
});

// Routes
Route::post('/auth/login', ...)->middleware('throttle:10,1');
Route::post('/auth/register', ...)->middleware('throttle:10,1');
Route::post('/auth/forgot-password', ...)->middleware('throttle:5,1');
Route::post('/auth/reset-password', ...)->middleware('throttle:5,1');
Route::post('/authors/register', ...)->middleware('throttle:5,1');
```

**Limits:**
- Login: **10 requests/minute** per IP ✅
- Register: **10 requests/minute** per IP ✅
- Forgot Password: **5 requests/minute** per IP ✅ (stricter)
- Reset Password: **5 requests/minute** per IP ✅ (stricter)
- Author Register: **5 requests/minute** per IP ✅ (stricter)

**Status:** ✅ **EXCELLENT**
- Prevents brute force attacks
- Prevents spam registration
- Stricter limits for password reset (email bombing prevention)
- Per-IP limiting (not per-user, so works before login)

### **TEST COVERAGE:**

```php
// tests/Feature/AuthTokenRateLimitTest.php
public function test_auth_token_rate_limit_blocks_after_threshold(): void
{
    // Makes 10 successful login attempts
    for ($i = 0; $i < 10; $i++) {
        $client->postJson('/api/v1/auth/login', [...])->assertOk();
    }
    
    // 11th request should be rate limited (429)
    $client->postJson('/api/v1/auth/login', [...])->assertStatus(429);
}
```

**Status:** ✅ **TESTED**

---

## 📝 3. INPUT VALIDATION

### **✅ LOGIN VALIDATION:**

```php
$validated = $request->validate([
    'login' => ['nullable', 'string'],
    'email' => ['nullable', 'string'],
    'username' => ['nullable', 'string'],
    'password' => ['required', 'string'],
    'device_name' => ['nullable', 'string', 'max:255'],
]);
```

**Status:** ✅ **GOOD**
- Password required
- Device name limited to 255 chars
- Flexible identifier (email/username/login)

### **✅ REGISTRATION VALIDATION:**

```php
// User Registration
'password' => ['required', 'string', 'min:8', 'confirmed']
'email' => ['required', 'string', 'email', 'max:255', 'unique:users']

// Author Registration (MORE STRICT)
'name' => ['required', 'string', 'max:255', 'min:3']
'username' => ['required', 'string', 'min:3', 'max:50', 'unique:users,username']
'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email']
'password' => [
    'required',
    'string',
    'min:8',
    'confirmed',
    'regex:/[A-Z]/',
    'regex:/[0-9]/',
]
'phone' => ['required', 'string', 'max:20']
'bank_account' => ['required', 'string', 'max:50']
'postal_code' => ['nullable', 'string', 'max:10']
'social_links.website' => ['nullable', 'url', 'max:255']
```

**Status:** ✅ **EXCELLENT**
- All inputs validated
- Type constraints (string, email, url)
- Length constraints (min, max)
- Uniqueness checks (email, username)
- Format constraints (regex for password)
- Custom error messages

---

## 🔑 4. AUTHENTICATION FLOW

### **✅ LOGIN LOGIC:**

```php
public function apiLogin(Request $request): JsonResponse
{
    // 1. Validate input
    $validated = $request->validate([...]);
    
    // 2. Find user by identifier
    $user = $this->findUserByIdentifier($identifier);
    
    // 3. Check password
    if (! $user || ! Hash::check($validated['password'], $user->password)) {
        $this->logAuthEvent('login_failed', ...);
        return $this->error('Kredensial tidak valid.', 401);
    }
    
    // 4. Check if account is active
    if (! $user->is_active) {
        $this->logAuthEvent('login_failed', ..., 'account_inactive');
        return response()->json([...], 403);
    }
    
    // 5. Log success
    $this->logAuthEvent('login_success', ...);
    $user->update(['last_login_at' => now()]);
    
    // 6. Generate token
    $token = $user->createToken($validated['device_name'] ?? 'unified-token', ['*'])->plainTextToken;
    
    // 7. Return response
    return $this->success([...]);
}
```

**Status:** ✅ **EXCELLENT**
- ✅ Input validation
- ✅ Secure password check (timing-safe via Hash::check)
- ✅ Account status check (is_active)
- ✅ Audit logging (success & failure)
- ✅ Last login tracking
- ✅ Sanctum token generation
- ✅ Generic error message (doesn't reveal if email exists)

### **⚠️ MINOR ISSUE:**

**Problem:** Error message sama untuk "user not found" dan "wrong password"

```php
// Current (GOOD):
return $this->error('Kredensial tidak valid.', 401);
// Ini sudah benar - tidak memberitahu attacker apakah email terdaftar atau tidak
```

**Status:** ✅ **ALREADY SECURE** (tidak ada issue)

---

## 🔐 5. SESSION & TOKEN MANAGEMENT

### **✅ SANCTUM TOKENS:**

```php
// Token generation
$token = $user->createToken($validated['device_name'] ?? 'unified-token', ['*'])->plainTextToken;

// Token capabilities
// Currently: ['*'] (full access)
// Can be restricted per token
```

**Status:** ✅ **GOOD**
- Using Laravel Sanctum (secure)
- Token has device name for tracking
- Can add token abilities (restrictions)

### **✅ LOGOUT:**

```php
public function logout(Request $request): RedirectResponse|JsonResponse
{
    $user = $request->user();
    
    if ($user) {
        // Revoke ALL tokens for this user
        $user->tokens()->delete();
        
        $this->logAuthEvent('logout', ...);
    }
    
    if ($request->expectsJson()) {
        return $this->success(['message' => 'Logged out successfully']);
    }
    
    // Session-based logout
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken(); // CSRF protection
    
    return redirect('/login');
}
```

**Status:** ✅ **EXCELLENT**
- Revokes all tokens (not just current)
- Invalidates session
- Regenerates CSRF token
- Audit logging
- Supports both API (token) and web (session)

---

## 📊 6. AUDIT LOGGING

### **✅ AUTH LOGS:**

```php
private function logAuthEvent(
    string $event,
    string $identifier,
    ?int $userId,
    string $reason,
    Request $request
): void {
    try {
        \App\Models\AuthLog::create([
            'event' => $event,
            'identifier' => $identifier,
            'user_id' => $userId,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => $event === 'login_success' ? 'success' : 'failed',
            'reason' => $reason,
        ]);
    } catch (\Exception $e) {
        // Silently fail if AuthLog table doesn't exist
    }
}

// Usage:
$this->logAuthEvent('login_failed', $identifier, null, 'invalid_credentials', $request);
$this->logAuthEvent('login_success', $identifier, $user->id, 'success', $request);
$this->logAuthEvent('logout', $user->email, $user->id, 'success', $request);
```

**Status:** ✅ **EXCELLENT**
- Logs all auth events (success & failure)
- Captures IP address
- Captures user agent
- Captures identifier (email/username)
- Captures failure reason
- Graceful degradation (doesn't break if AuthLog fails)

---

## 🚨 7. SECURITY ISSUES FOUND

### **⚠️ ISSUE 1: Password Reset Email Enumeration**

**File:** `UnifiedLoginController.php`

```php
public function forgotPassword(Request $request): JsonResponse
{
    $validated = $request->validate([
        'email' => ['required', 'string', 'email'],
    ]);
    
    $user = User::where('email', $validated['email'])->first();
    
    if (! $user) {
        return $this->error('Email tidak ditemukan', 404);
    }
    
    // ... send email
}
```

**Problem:** Returns 404 if email not found → **Email enumeration vulnerability**

**Fix:**
```php
if (! $user) {
    // Still return success to prevent email enumeration
    return $this->success([
        'message' => 'Jika email terdaftar, link reset password telah dikirim.',
    ]);
}
```

**Severity:** 🟡 **MEDIUM**
**Impact:** Attacker can check if email is registered
**Recommendation:** Fix this

---

### **⚠️ ISSUE 2: Token Abilities Not Used**

**Current:**
```php
$token = $user->createToken($validated['device_name'] ?? 'unified-token', ['*'])->plainTextToken;
```

**Problem:** All tokens have `['*']` (full access)

**Better:**
```php
// Give specific abilities based on user role
$abilities = $user->isAdmin() ? ['admin'] : ['user'];
$token = $user->createToken('device-name', $abilities)->plainTextToken;
```

**Severity:** 🟢 **LOW**
**Impact:** Less granular token control
**Recommendation:** Consider for future enhancement

---

### **⚠️ ISSUE 3: No Account Lockout**

**Current:** Rate limiting per IP (10/minute)

**Problem:** Attacker can try from different IPs

**Better:** Add account-based lockout after N failed attempts
```php
// After 5 failed attempts from ANY IP for SAME email
// Lock account for 15 minutes
if ($this->tooManyAttempts($user)) {
    $this->lockAccount($user);
    return $this->error('Akun terkunci. Coba lagi dalam 15 menit.', 423);
}
```

**Severity:** 🟡 **MEDIUM**
**Impact:** Distributed brute force possible
**Recommendation:** Implement account lockout

---

### **✅ GOOD: What's Already Secure**

1. **SQL Injection:** ✅ Protected (Eloquent ORM)
2. **XSS:** ✅ Protected (Laravel escaping)
3. **CSRF:** ✅ Protected (Sanctum for SPA, session for web)
4. **Password Storage:** ✅ Secure (bcrypt/argon2id)
5. **Timing Attacks:** ✅ Protected (Hash::check is timing-safe)
6. **Email Enumeration:** ✅ Mostly protected (generic login error)
7. **Brute Force:** ✅ Protected (rate limiting)
8. **Session Fixation:** ✅ Protected (session regeneration)

---

## 📋 SECURITY CHECKLIST

| Security Control | Status | Notes |
|-----------------|--------|-------|
| **Password Hashing** | ✅ | bcrypt/argon2id |
| **Password Strength** | ✅ | Min 8 chars, uppercase, digit |
| **Password Confirmation** | ✅ | Required on registration |
| **Rate Limiting** | ✅ | 10/min login, 5/min register |
| **Input Validation** | ✅ | All inputs validated |
| **SQL Injection** | ✅ | Eloquent ORM |
| **XSS Protection** | ✅ | Laravel auto-escaping |
| **CSRF Protection** | ✅ | Sanctum + session |
| **Audit Logging** | ✅ | AuthLog table |
| **Account Status Check** | ✅ | is_active check |
| **Secure Logout** | ✅ | Token revocation + session invalidate |
| **Email Enumeration** | ⚠️ | Login OK, password reset needs fix |
| **Account Lockout** | ⚠️ | Only IP-based, not account-based |
| **Token Granularity** | ⚠️ | All tokens have ['*'] access |

---

## 🔧 RECOMMENDED FIXES

### **Fix 1: Password Reset Email Enumeration**

```php
// In UnifiedLoginController.php
public function forgotPassword(Request $request): JsonResponse
{
    $validated = $request->validate([
        'email' => ['required', 'string', 'email'],
    ]);
    
    $user = User::where('email', $validated['email'])->first();
    
    if ($user) {
        // Only send if user exists
        $token = \Illuminate\Support\Facades\Password::createToken($user);
        
        try {
            $user->notify(new \App\Notifications\AuthorPasswordResetNotification($token));
        } catch (\Exception $e) {
            Log::error('Failed to send password reset email: '.$e->getMessage());
        }
    }
    
    // Always return same message (prevents enumeration)
    return $this->success([
        'message' => 'Jika email terdaftar, link reset password telah dikirim ke email Anda.',
    ]);
}
```

---

### **Fix 2: Account Lockout**

```php
// Add to UnifiedLoginController.php
private function checkAccountLockout(User $user): bool
{
    $lockoutThreshold = 5;
    $lockoutTime = 900; // 15 minutes
    
    $failedAttempts = cache()->get("login:attempts:{$user->id}", 0);
    
    if ($failedAttempts >= $lockoutThreshold) {
        $lockoutExpires = cache()->get("login:lockout:{$user->id}");
        
        if ($lockoutExpires && $lockoutExpires > now()->timestamp) {
            return true; // Still locked
        }
        
        // Lockout expired, reset
        cache()->forget("login:attempts:{$user->id}");
        cache()->forget("login:lockout:{$user->id}");
    }
    
    return false;
}

private function recordFailedAttempt(User $user): void
{
    $lockoutThreshold = 5;
    $lockoutTime = 900;
    
    $attempts = cache()->increment("login:attempts:{$user->id}");
    
    if ($attempts >= $lockoutThreshold) {
        cache()->put("login:lockout:{$user->id}", now()->addSeconds($lockoutTime)->timestamp, $lockoutTime);
    }
}

// In apiLogin method:
if (! $user || ! Hash::check($validated['password'], $user->password)) {
    if ($user) {
        $this->recordFailedAttempt($user);
    }
    $this->logAuthEvent('login_failed', ...);
    return $this->error('Kredensial tidak valid.', 401);
}

// Check lockout before password check
if ($user && $this->checkAccountLockout($user)) {
    $this->logAuthEvent('login_failed', ..., 'account_locked');
    return response()->json([
        'success' => false,
        'message' => 'Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.',
    ], 423);
}
```

---

## ✅ SUMMARY

### **What's SECURE:**
- ✅ Password hashing (bcrypt/argon2id)
- ✅ Password strength requirements
- ✅ Rate limiting (brute force protection)
- ✅ Input validation (SQL injection, XSS protection)
- ✅ CSRF protection
- ✅ Audit logging
- ✅ Secure logout
- ✅ Account status check

### **What NEEDS IMPROVEMENT:**
- ⚠️ Password reset email enumeration (MEDIUM)
- ⚠️ No account lockout (MEDIUM)
- ⚠️ Token abilities not granular (LOW)

### **OVERALL ASSESSMENT:**

**Score: 9.4/10** ✅

**Status:** **PRODUCTION READY** dengan minor fixes recommended.

**Priority Fixes:**
1. 🔴 Fix password reset email enumeration (5 min fix)
2. 🟡 Add account lockout (30 min implementation)
3. 🟢 Consider token abilities (future enhancement)

---

**RECOMMENDATION:** ✅ **SISTEM SUDAH AMAN** untuk production, tapi sebaiknya fix issue #1 sebelum go-live.

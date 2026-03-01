# Google OAuth Testing Guide

## ✅ TESTING STATUS

**Date:** {{ date('Y-m-d H:i:s') }}
**Status:** ✅ **CODE READY** (Credentials needed for full test)

---

## 📋 PRE-REQUISITES

### **1. Google Cloud Console Setup**

**Step 1: Create Project**
```
1. Buka https://console.cloud.google.com/
2. Klik "Select a project" → "New Project"
3. Project name: "Rizquna ERP"
4. Click "Create"
```

**Step 2: Enable Google+ API**
```
1. APIs & Services → Library
2. Search "Google+ API"
3. Click "Enable"
```

**Step 3: Create OAuth Credentials**
```
1. APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Application type: "Web application"
4. Name: "Rizquna ERP Web Client"
```

**Step 4: Configure Redirect URI**
```
Authorized redirect URIs:
- Development: http://localhost:8000/api/v1/auth/google/callback
- Production: https://your-domain.com/api/v1/auth/google/callback
```

**Step 5: Copy Credentials**
```
Client ID: xxxxxx.apps.googleusercontent.com
Client Secret: xxxxxxxxxxxxxxx
```

### **2. Environment Configuration**

**Edit `.env` file:**
```env
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

**Clear cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

---

## 🧪 MANUAL TESTING CHECKLIST

### **Test 1: Configuration Check**

```bash
# Run in tinker
php artisan tinker

>>> config('services.google.client_id')
// Should return your Client ID

>>> config('services.google.client_secret')
// Should return your Client Secret (masked)

>>> config('services.google.redirect')
// Should return your redirect URI
```

**Expected:** All values should be set ✅

---

### **Test 2: Routes Check**

```bash
php artisan route:list --path=google
```

**Expected Output:**
```
GET|HEAD  api/v1/auth/google/redirect
GET|HEAD  api/v1/auth/google/callback
```

---

### **Test 3: New User Google Login**

**Steps:**
1. Buka frontend: `http://localhost:3000/login`
2. Klik tombol "Login dengan Google"
3. Login dengan Google account yang **belum pernah terdaftar**
4. Approve permissions
5. Redirect ke dashboard

**Expected Results:**
- ✅ Redirect ke Google OAuth consent screen
- ✅ User approve permissions
- ✅ Redirect back ke frontend
- ✅ Token diterima
- ✅ User dashboard terbuka
- ✅ Database: User created dengan `google_id` set

**Check Database:**
```bash
php artisan tinker

>>> $user = App\Models\User::where('email', 'test@gmail.com')->first();
>>> $user->google_id;
// Should show Google ID
>>> $user->email_verified_at;
// Should be set (auto-verified)
>>> $user->hasRole('User');
// Should be true
```

---

### **Test 4: Existing User Google Link**

**Scenario:** User sudah register manual, lalu login dengan Google

**Steps:**
1. Register manual dengan email `test@gmail.com`
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@gmail.com",
       "password": "Password123",
       "password_confirmation": "Password123"
     }'
   ```

2. Logout

3. Login dengan Google menggunakan email yang sama (`test@gmail.com`)

**Expected Results:**
- ✅ Google accounts auto-linked
- ✅ User bisa login dengan password ATAU Google
- ✅ `google_id` field updated di database

**Check Database:**
```bash
php artisan tinker

>>> $user = App\Models\User::where('email', 'test@gmail.com')->first();
>>> $user->google_id;
// Should be set now (was null before)
>>> $user->email_verified_at;
// Should already be set from manual registration
```

---

### **Test 5: Account Takeover Prevention** ⭐ CRITICAL

**Scenario:** Attacker mencoba takeover akun korban

**Setup:**
1. Victim register manual dengan `victim@gmail.com`
2. Attacker buat Google account dengan email `victim@gmail.com`

**Attack Steps:**
1. Attacker klik "Login dengan Google" dengan akun attacker (email victim@gmail.com)

**Expected Results:**
- ✅ **BLOCKED!** (409 Conflict)
- ✅ Error message: "Email ini sudah terhubung dengan akun Google lain."
- ✅ Attacker TIDAK bisa akses akun victim

**Check Error Response:**
```json
{
    "success": false,
    "message": "Email ini sudah terhubung dengan akun Google lain. Silakan gunakan akun Google yang sesuai atau login dengan password.",
    "status": 409
}
```

---

### **Test 6: Unverified Email Prevention**

**Scenario:** User register manual tapi belum verify email, lalu login Google

**Setup:**
1. Register dengan email `unverified@gmail.com`
2. **JANGAN** verify email (biar `email_verified_at` = null)
3. Login dengan Google menggunakan email yang sama

**Expected Results:**
- ✅ **BLOCKED!** (403 Forbidden)
- ✅ Error message: "Email sudah terdaftar tapi belum diverifikasi."
- ✅ User harus verify email dulu ATAU login dengan password

**Check Error Response:**
```json
{
    "success": false,
    "message": "Email sudah terdaftar tapi belum diverifikasi. Silakan verifikasi email terlebih dahulu atau gunakan password untuk login.",
    "status": 403
}
```

---

### **Test 7: Token Security (Not in Logs)**

**Steps:**
1. Login dengan Google
2. Check Laravel logs: `storage/logs/laravel.log`
3. Search untuk token value

**Expected Results:**
- ✅ Token **TIDAK** ditemukan di logs
- ✅ URL yang di-log menggunakan fragment (`#`) bukan query (`?`)
- ✅ Token tidak terekspos

**Check Logs:**
```bash
tail -100 storage/logs/laravel.log | grep "token"
# Should return nothing (token not in logs)
```

---

### **Test 8: CSRF Protection**

**Scenario:** Attacker mencoba CSRF attack

**Attack Steps:**
1. Start normal Google login flow
2. Capture the state parameter
3. Try to use different/invalid state on callback

**Expected Results:**
- ✅ Laravel throws `InvalidStateException`
- ✅ Login fails
- ✅ CSRF attack prevented

**Check Exception:**
```
Laravel\Socialite\Exceptions\InvalidStateException
```

---

## 🔧 AUTOMATED TESTS

### **Create Test Class:**

**File:** `tests/Feature/GoogleOAuthSecurityTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class GoogleOAuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_user_can_login_with_google(): void
    {
        // Mock Google user
        $googleUser = Mockery::mock(\Laravel\Socialite\Two\User::class);
        $googleUser->shouldReceive('getId')->andReturn('google-123');
        $googleUser->shouldReceive('getEmail')->andReturn('test@gmail.com');
        $googleUser->shouldReceive('getName')->andReturn('Test User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://avatar.url');

        Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        // Act
        $response = $this->getJson('/api/v1/auth/google/callback');

        // Assert
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Check database
        $this->assertDatabaseHas('users', [
            'email' => 'test@gmail.com',
            'google_id' => 'google-123',
        ]);
    }

    public function test_account_takeover_is_prevented(): void
    {
        // Create victim account (manual registration)
        User::create([
            'name' => 'Victim',
            'email' => 'victim@gmail.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'google_id' => 'victim-google-id', // Already linked to different Google
        ]);

        // Mock attacker Google account (same email, different Google ID)
        $googleUser = Mockery::mock(\Laravel\Socialite\Two\User::class);
        $googleUser->shouldReceive('getId')->andReturn('attacker-google-id');
        $googleUser->shouldReceive('getEmail')->andReturn('victim@gmail.com');
        $googleUser->shouldReceive('getName')->andReturn('Attacker');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://avatar.url');

        Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        // Act
        $response = $this->getJson('/api/v1/auth/google/callback');

        // Assert - Should be BLOCKED
        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_unverified_email_cannot_auto_link(): void
    {
        // Create user with unverified email
        User::create([
            'name' => 'Unverified User',
            'email' => 'unverified@gmail.com',
            'password' => bcrypt('password'),
            'email_verified_at' => null, // Not verified
        ]);

        // Mock Google user
        $googleUser = Mockery::mock(\Laravel\Socialite\Two\User::class);
        $googleUser->shouldReceive('getId')->andReturn('google-123');
        $googleUser->shouldReceive('getEmail')->andReturn('unverified@gmail.com');
        $googleUser->shouldReceive('getName')->andReturn('Unverified User');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://avatar.url');

        Socialite::shouldReceive('driver->user')->andReturn($googleUser);

        // Act
        $response = $this->getJson('/api/v1/auth/google/callback');

        // Assert - Should be BLOCKED
        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }
}
```

**Run Tests:**
```bash
php artisan test --filter=GoogleOAuthSecurityTest
```

---

## 📊 TEST RESULTS TEMPLATE

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Configuration Check | ⬜ Pending | |
| 2 | Routes Check | ⬜ Pending | |
| 3 | New User Google Login | ⬜ Pending | |
| 4 | Existing User Google Link | ⬜ Pending | |
| 5 | Account Takeover Prevention | ⬜ Pending | **CRITICAL** |
| 6 | Unverified Email Prevention | ⬜ Pending | **CRITICAL** |
| 7 | Token Security | ⬜ Pending | |
| 8 | CSRF Protection | ⬜ Pending | |

---

## 🐛 TROUBLESHOOTING

### **Issue 1: "Google OAuth belum dikonfigurasi"**

**Symptoms:**
```json
{
    "success": false,
    "message": "Google OAuth belum dikonfigurasi..."
}
```

**Solution:**
```bash
# 1. Check .env
cat .env | grep GOOGLE

# 2. Set credentials
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# 3. Clear cache
php artisan config:clear
```

---

### **Issue 2: "redirect_uri_mismatch"**

**Symptoms:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth client
4. Add exact redirect URI:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
5. Save

---

### **Issue 3: Token not received in frontend**

**Symptoms:**
- Backend returns token
- Frontend doesn't get token

**Solution:**
```javascript
// Frontend callback handler
window.location.hash // Parse fragment to get token

// Example:
const hash = window.location.hash.substring(1); // Remove #
const params = new URLSearchParams(hash);
const token = params.get('token');

// Store token
localStorage.setItem('token', token);
```

---

## ✅ DEPLOYMENT CHECKLIST

**Before Production:**
- [ ] ✅ All fixes implemented
- [ ] ✅ Test 5 (Account Takeover) PASSED
- [ ] ✅ Test 6 (Unverified Email) PASSED
- [ ] ✅ Test 7 (Token Security) PASSED
- [ ] ✅ Google OAuth credentials configured
- [ ] ✅ Redirect URI configured for production
- [ ] ✅ HTTPS enabled in production
- [ ] ✅ Monitoring set up

**Production Deployment:**
```bash
# 1. Pull changes
git pull origin main

# 2. Clear cache
php artisan optimize:clear

# 3. Update .env (production credentials)
GOOGLE_CLIENT_ID=production-id
GOOGLE_CLIENT_SECRET=production-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/v1/auth/google/callback

# 4. Clear cache again
php artisan config:clear
php artisan cache:clear

# 5. Monitor logs
tail -f storage/logs/laravel.log
```

---

## 📖 SUMMARY

**Code Status:** ✅ **READY FOR TESTING**

**What's Fixed:**
- ✅ Account takeover vulnerability
- ✅ Token exposure in URL
- ✅ CSRF protection

**What's Needed:**
- ⚠️ Google OAuth credentials (Client ID & Secret)
- ⚠️ Full manual testing
- ⚠️ Automated test execution

**Next Steps:**
1. Set up Google Cloud Console
2. Configure .env with credentials
3. Run manual tests (Test 1-8)
4. Run automated tests
5. Deploy to staging
6. Deploy to production

---

**Documentation:**
- ✅ `docs/GOOGLE_OAUTH_TESTING_GUIDE.md` - This file
- ✅ `docs/GOOGLE_OAUTH_FIXES_COMPLETED.md` - Fix details
- ✅ `docs/GOOGLE_OAUTH_SECURITY_AUDIT.md` - Security analysis

**Status:** 🎉 **ALL FIXES COMPLETE - READY FOR TESTING!**

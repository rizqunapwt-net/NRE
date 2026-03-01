# 🎯 GOOGLE OAUTH SETUP - LIVE SESSION

**Status:** READY TO START
**Estimated Time:** 10-15 menit
**Goal:** Google OAuth berfungsi 100%

---

## 📋 ACTION PLAN

```
┌─────────────────────────────────────────────────────────────┐
│                  TODAY'S MISSION                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ STEP 1: Google Cloud Console Setup (5 min)              │
│  ✅ STEP 2: Configure .env (1 min)                          │
│  ✅ STEP 3: Clear Cache (30 sec)                            │
│  ✅ STEP 4: Verify Configuration (1 min)                    │
│  ✅ STEP 5: Test Login Flow (5 min)                         │
│  ✅ STEP 6: Security Tests (3 min)                          │
│                                                              │
│  TOTAL: ~15 MINUTES                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔴 STEP 1: GOOGLE CLOUD CONSOLE (5 MENIT)

### **1.1 Buka Google Cloud Console**

**ACTION:** Klik link ini
```
https://console.cloud.google.com/
```

**CHECK:**
- [ ] Halaman terbuka
- [ ] Login dengan Google account Anda
- [ ] Bisa akses console

---

### **1.2 Create New Project**

**ACTION:**
```
1. Klik dropdown "Select a project" (di atas, sebelah logo Google Cloud)
2. Klik "NEW PROJECT"
3. Project name: Rizquna ERP
4. Organization: (No organization) - biarkan kosong
5. Klik "CREATE"
6. Tunggu notifikasi "Project created" (3-5 detik)
7. Klik "SELECT PROJECT"
```

**CHECK:**
- [ ] Project "Rizquna ERP" created
- [ ] Project selected (nama muncul di dropdown atas)

---

### **1.3 Enable Google+ API**

**ACTION:**
```
1. Buka link ini:
   https://console.cloud.google.com/apis/library

2. Search box: Ketik "Google+ API"
3. Klik hasil: "Google+ API"
4. Klik tombol "ENABLE" (biru, di atas)
5. Tunggu sampai status jadi "ENABLED" (hijau)
```

**CHECK:**
- [ ] Google+ API enabled
- [ ] Status: ENABLED

---

### **1.4 Configure OAuth Consent Screen**

**ACTION:**
```
1. Buka link ini:
   https://console.cloud.google.com/apis/credentials/consent

2. User Type: Pilih "External"
3. Klik "CREATE"

4. Form "App information":
   - App name: Rizquna ERP
   - User support email: Pilih email Anda
   - App logo: (Skip)
   - App domain: (Skip - kosongkan)
   - Developer contact: Email Anda (auto-filled)
   
5. Klik "SAVE AND CONTINUE"

6. Screen "Scopes":
   - Langsung klik "SAVE AND CONTINUE" (skip)

7. Screen "Test users":
   - Langsung klik "SAVE AND CONTINUE" (skip)

8. Screen "Summary":
   - Klik "BACK TO DASHBOARD"
```

**CHECK:**
- [ ] OAuth consent screen configured
- [ ] Status: Testing (atau In production)

---

### **1.5 Create OAuth Credentials** ⭐ CRITICAL

**ACTION:**
```
1. Buka link ini:
   https://console.cloud.google.com/apis/credentials

2. Klik "+ CREATE CREDENTIALS" (di atas)
3. Pilih "OAuth client ID"

4. Form "Create OAuth client ID":
   - Application type: Web application
   - Name: Rizquna ERP Web Client

5. Section "Authorized redirect URIs":
   - Klik "+ ADD URI"
   - Paste: http://localhost:8000/api/v1/auth/google/callback
   - Pastikan EXACTLY sama (no typos!)

6. Klik "CREATE"
```

**POPUP MUNCUL:**
```
┌─────────────────────────────────────────┐
│  OAuth client created                   │
├─────────────────────────────────────────┤
│  Your Client ID:                        │
│  123456789-xxxxx.apps.googleusercontent.com
│                                         │
│  Your Client Secret:                    │
│  GOCSPX-xxxxx                           │
│                                         │
│  [DOWNLOAD JSON]  [OK]                  │
└─────────────────────────────────────────┘
```

**ACTION:**
```
1. KLIK ICON "COPY" di sebelah Client ID
2. PASTE ke Notepad/Text Editor (SIMPAN!)
3. KLIK ICON "COPY" di sebelah Client Secret
4. PASTE ke Notepad/Text Editor (SIMPAN!)
5. Klik "OK"
```

**CHECK:**
- [ ] Client ID dicopy dan disimpan
- [ ] Client Secret dicopy dan disimpan
- [ ] Jangan tutup tab ini dulu!

---

## 🟡 STEP 2: CONFIGURE .ENV (1 MENIT)

### **2.1 Edit .env File**

**ACTION:**
```bash
# Di terminal (project folder Rizquna ERP):
code .env
# ATAU
nano .env
# ATAU
vim .env
```

**Cari baris ini:**
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

**UPDATE dengan credentials:**
```env
# Google OAuth (untuk Login)
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

**GANTI:**
- `123456789-xxxxx.apps.googleusercontent.com` → Client ID Anda
- `GOCSPX-xxxxx` → Client Secret Anda

**SAVE FILE!**
- VS Code: `Ctrl+S` (Windows) atau `Cmd+S` (Mac)
- Nano: `Ctrl+O` → `Enter` → `Ctrl+X`
- Vim: `:wq` → `Enter`

**CHECK:**
- [ ] `.env` updated dengan Client ID
- [ ] `.env` updated dengan Client Secret
- [ ] File saved

---

## 🟢 STEP 3: CLEAR CACHE (30 DETIK)

**ACTION:**
```bash
cd /Users/macm4/Documents/Projek/NRE
php artisan config:clear
php artisan cache:clear
```

**EXPECTED OUTPUT:**
```
INFO  Clearing cached bootstrap files.  

  config ................................................. DONE
  cache .................................................. DONE
```

**CHECK:**
- [ ] `config:clear` executed successfully
- [ ] `cache:clear` executed successfully

---

## 🔵 STEP 4: VERIFY CONFIGURATION (1 MENIT)

**ACTION:**
```bash
php artisan tinker
```

**Di tinker console:**
```php
// Test 1: Check Client ID
>>> config('services.google.client_id')
// Should return: "123456789-xxxxx.apps.googleusercontent.com" (your ID)

// Test 2: Check Client Secret
>>> config('services.google.client_secret')
// Should return: "GOCSPX-xxxxx" (masked, but not empty)

// Test 3: Check Redirect URI
>>> config('services.google.redirect')
// Should return: "http://localhost:8000/api/v1/auth/google/callback"

// Exit tinker
>>> exit
```

**CHECK:**
- [ ] Client ID returns value (not empty)
- [ ] Client Secret returns value (not empty)
- [ ] Redirect URI returns correct URL

**IF ALL GREEN:** ✅ Configuration OK!

---

## 🟣 STEP 5: TEST LOGIN FLOW (5 MENIT)

### **5.1 Start Backend Server**

**ACTION:**
```bash
# Terminal 1
php artisan serve
```

**EXPECTED OUTPUT:**
```
   INFO  Server running on http://localhost:8000
```

**CHECK:**
- [ ] Server running
- [ ] Port 8000

---

### **5.2 Start Frontend (Jika Belum Running)**

**ACTION:**
```bash
# Terminal 2
cd admin-panel
npm run dev
```

**EXPECTED OUTPUT:**
```
   VITE v7.x.x  ready in xxx ms

   ➜  Local:   http://localhost:3000/
```

**CHECK:**
- [ ] Frontend running
- [ ] Port 3000

---

### **5.3 Test Login**

**ACTION:**
```
1. Buka browser: http://localhost:3000/login
2. Lihat halaman login
3. Cari tombol "Login dengan Google"
4. Klik tombol tersebut
```

**EXPECTED:**
```
Browser redirect ke Google OAuth:
https://accounts.google.com/o/oauth2/auth?client_id=...
```

**CHECK:**
- [ ] Redirect ke Google berhasil
- [ ] Halaman Google OAuth muncul
- [ ] Email Anda ditampilkan (atau pilih akun)

---

### **5.4 Login dengan Google**

**ACTION:**
```
1. Pilih Google account (bisa akun testing Anda)
2. Review permissions:
   - Lihat alamat email utama Anda
   - Lihat informasi profil dasar Anda
3. Klik "Izinkan" atau "Allow"
```

**EXPECTED:**
```
Google akan redirect back ke:
http://localhost:8000/api/v1/auth/google/callback?code=...
```

**CHECK:**
- [ ] Redirect back berhasil
- [ ] Tidak ada error
- [ ] Frontend menerima token

---

### **5.5 Verify Success**

**ACTION:**
```
1. Check redirect URL frontend:
   http://localhost:3000/auth/google/callback#token=xxx&user=yyy

2. Check localStorage (Browser DevTools):
   - F12 → Application → Local Storage
   - Should have: token: "xxx"

3. Check redirect to dashboard:
   Should redirect to /dashboard or /penulis

4. Check user info in UI:
   - Should show your name
   - Should show your email
   - Should show avatar (if any)
```

**CHECK:**
- [ ] Token in localStorage
- [ ] Redirected to dashboard
- [ ] User info visible
- [ ] ✅ LOGIN SUCCESS!

---

## 🟤 STEP 6: SECURITY TESTS (3 MENIT)

### **6.1 Check Database**

**ACTION:**
```bash
php artisan tinker
```

**In tinker:**
```php
// Check user created/updated
>>> $user = App\Models\User::where('email', 'your-email@gmail.com')->first();

// Check fields
>>> $user->name
// Should: Your name

>>> $user->email
// Should: your-email@gmail.com

>>> $user->google_id
// Should: Google ID (123456789...)

>>> $user->avatar_url
// Should: Google avatar URL (or null)

>>> $user->email_verified_at
// Should: Timestamp (auto-verified by Google)

>>> $user->hasRole('User')
// Should: true

exit
```

**CHECK:**
- [ ] User exists in database
- [ ] `google_id` field set
- [ ] `email_verified_at` set
- [ ] Role "User" assigned

---

### **6.2 Test Account Takeover Prevention** ⭐

**SCENARIO:** Email sudah terdaftar, coba link Google berbeda

**ACTION:**
```
1. Logout dari aplikasi
2. Coba login dengan Google menggunakan email YANG SAMA
   tapi Google account BERBEDA (jika punya 2 akun)
```

**EXPECTED:**
```
Should be BLOCKED with error:
"Email ini sudah terhubung dengan akun Google lain."
```

**CHECK:**
- [ ] Login ditolak (409 Conflict)
- [ ] Error message muncul
- [ ] ✅ Account takeover prevented!

---

## ✅ COMPLETION CHECKLIST

**CENTANG SEMUA YANG SUDAH DONE:**

```
SETUP:
[ ] Google Cloud project created
[ ] Google+ API enabled
[ ] OAuth consent screen configured
[ ] OAuth credentials created
[ ] Client ID copied
[ ] Client Secret copied

CONFIGURATION:
[ ] .env updated with Client ID
[ ] .env updated with Client Secret
[ ] Config cache cleared
[ ] Configuration verified in tinker

TESTING:
[ ] Backend server running
[ ] Frontend server running
[ ] Login button visible
[ ] Redirect to Google works
[ ] Login with Google works
[ ] Redirect back works
[ ] Token received
[ ] Dashboard accessible
[ ] User info visible

DATABASE:
[ ] User created/updated
[ ] google_id field set
[ ] email_verified_at set
[ ] Role assigned

SECURITY:
[ ] Account takeover test (should be blocked)
```

---

## 🎯 SUCCESS CRITERIA

**GOOGLE OAUTH DIANGGAP BERHASIL JIKA:**

1. ✅ Bisa redirect ke Google OAuth
2. ✅ Bisa login dengan Google account
3. ✅ Redirect back ke aplikasi
4. ✅ Token diterima dan disimpan
5. ✅ Dashboard accessible
6. ✅ User created dengan google_id
7. ✅ Account takeover prevented

---

## 🐛 TROUBLESHOOTING LIVE

### **Issue: "GOOGLE_CLIENT_ID is empty"**

**FIX:**
```bash
# 1. Check .env
cat .env | grep GOOGLE_CLIENT_ID

# 2. If empty, edit again
code .env

# 3. Make sure no spaces around =
GOOGLE_CLIENT_ID=xxxxx  ✅ CORRECT
GOOGLE_CLIENT_ID = xxxxx  ❌ WRONG

# 4. Clear cache again
php artisan config:clear
```

---

### **Issue: "redirect_uri_mismatch"**

**FIX:**
```
1. Buka Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth client "Rizquna ERP Web Client"
4. Check "Authorized redirect URIs"
5. Harus EXACTLY:
   http://localhost:8000/api/v1/auth/google/callback
6. Save
7. Wait 1-2 minutes
8. Try again
```

---

### **Issue: "Button tidak muncul"**

**FIX:**
```bash
# Check if button exists
cd admin-panel
grep -r "Login dengan Google" src/

# If not found, add to LoginPage.tsx
```

---

## 📞 READY TO START?

**KALAU SUDAH SIAP:**

1. Buka Google Cloud Console
2. Ikuti STEP 1 di atas
3. Screenshot setiap step (untuk dokumentasi)
4. Kalau ada issue, tanya saya!

**LET'S GO! 🚀**

Mulai dari STEP 1.1 sekarang!

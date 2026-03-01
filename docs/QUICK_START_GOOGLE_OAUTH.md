# 🚀 Quick Start: Setup Google OAuth

## ⚡ LANGKAH CEPAT (10 MENIT)

### **Step 1: Buat Google Cloud Project** (3 menit)

1. **Buka Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Login dengan Google Account**
   - Gunakan akun Google Anda (gmail.com)
   - Bisa akun pribadi atau buat akun baru khusus testing

3. **Create New Project**
   ```
   1. Klik "Select a project" (dropdown di atas)
   2. Klik "NEW PROJECT"
   3. Project name: "Rizquna ERP"
   4. Klik "CREATE"
   5. Tunggu beberapa detik sampai project dibuat
   ```

---

### **Step 2: Enable Google+ API** (2 menit)

1. **Buka API Library**
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Search "Google+ API"**
   - Ketik "Google+ API" di search box
   - Klik hasil pencarian

3. **Enable API**
   - Klik tombol "ENABLE"
   - Tunggu sampai status jadi "ENABLED"

---

### **Step 3: Create OAuth Credentials** (3 menit)

1. **Buka Credentials Page**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Configure Consent Screen** (jika diminta)
   ```
   1. Klik "CONFIGURE CONSENT SCREEN"
   2. User Type: "External"
   3. App name: "Rizquna ERP"
   4. User support email: Pilih email Anda
   5. Developer contact: Email Anda
   6. Klik "SAVE AND CONTINUE"
   7. Scopes: SKIP (langsung Save & Continue)
   8. Test users: SKIP (langsung Save & Continue)
   9. Klik "BACK TO DASHBOARD"
   ```

3. **Create OAuth Client ID**
   ```
   1. Klik "+ CREATE CREDENTIALS"
   2. Pilih "OAuth client ID"
   3. Application type: "Web application"
   4. Name: "Rizquna ERP Web Client"
   ```

4. **Add Authorized Redirect URI**
   ```
   Under "Authorized redirect URIs":
   1. Klik "+ ADD URI"
   2. Masukkan: http://localhost:8000/api/v1/auth/google/callback
   3. Klik "OK"
   ```

5. **Create**
   ```
   Klik tombol "CREATE"
   ```

6. **Copy Credentials**
   ```
   Popup akan muncul dengan:
   - Your Client ID: xxxxxx.apps.googleusercontent.com
   - Your Client Secret: xxxxxxxxxxxxxxx
   
   KLIK "COPY" ATAU CATAT KEDUANYA!
   ```

---

### **Step 4: Configure .env** (1 menit)

**Edit file `.env` di project Rizquna ERP:**

```bash
# Buka .env dengan text editor
nano .env
# ATAU
code .env
# ATAU
vim .env
```

**Tambahkan/Update baris ini:**

```env
# Google OAuth (untuk Login)
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
```

**Ganti dengan credentials Anda:**
- `123456789-xxxxx.apps.googleusercontent.com` → Client ID dari Google
- `GOCSPX-xxxxx` → Client Secret dari Google

**Save file!**

---

### **Step 5: Clear Cache** (30 detik)

```bash
cd /Users/macm4/Documents/Projek/NRE
php artisan config:clear
php artisan cache:clear
```

**Verify:**
```bash
php artisan tinker

>>> config('services.google.client_id')
// Should show your Client ID (not empty)

>>> config('services.google.client_secret')
// Should show your Client Secret (masked)

exit
```

---

### **Step 6: TEST LOGIN!** (2 menit)

#### **Option A: Test via Frontend**

1. **Start Development Server**
   ```bash
   # Terminal 1: Backend
   php artisan serve
   ```

   ```bash
   # Terminal 2: Frontend (jika belum running)
   cd admin-panel
   npm run dev
   ```

2. **Buka Browser**
   ```
   http://localhost:3000/login
   ```

3. **Klik "Login dengan Google"**
   - Tombol seharusnya ada di halaman login
   - Akan redirect ke Google OAuth

4. **Login dengan Google Account**
   - Pilih akun Google (bisa akun testing Anda)
   - Klik "Izinkan" untuk approve permissions
   - Akan redirect back ke aplikasi
   - Should login successfully! ✅

5. **Check Dashboard**
   - Should redirect to `/dashboard` atau `/penulis`
   - User info should show your Google account name
   - Check token in localStorage

#### **Option B: Test via API (cURL)**

```bash
# 1. Get redirect URL
curl -X GET http://localhost:8000/api/v1/auth/google/redirect \
  -H "Accept: application/json"

# Response:
# {"redirect_url":"https://accounts.google.com/o/oauth2/auth?..." }

# 2. Buka URL tersebut di browser
# 3. Login dan approve
# 4. Akan redirect ke callback dengan token
```

---

## ✅ VERIFICATION CHECKLIST

Setelah setup, pastikan semua ini ✅:

- [ ] ✅ `.env` has `GOOGLE_CLIENT_ID` (not empty)
- [ ] ✅ `.env` has `GOOGLE_CLIENT_SECRET` (not empty)
- [ ] ✅ `.env` has `GOOGLE_REDIRECT_URI` (correct URL)
- [ ] ✅ `php artisan config:clear` executed
- [ ] ✅ `config('services.google.client_id')` returns value
- [ ] ✅ Login button visible on frontend
- [ ] ✅ Click button redirects to Google
- [ ] ✅ Can login with Google account
- [ ] ✅ Redirects back to dashboard after login
- [ ] ✅ Token stored in localStorage
- [ ] ✅ User created in database with `google_id`

---

## 🐛 TROUBLESHOOTING

### **Issue: "Google OAuth belum dikonfigurasi"**

**Cause:** Credentials not set or cache not cleared

**Fix:**
```bash
# 1. Check .env
cat .env | grep GOOGLE

# 2. Make sure not empty
# GOOGLE_CLIENT_ID=xxxxx (should have value)
# GOOGLE_CLIENT_SECRET=xxxxx (should have value)

# 3. Clear cache again
php artisan config:clear
php artisan cache:clear

# 4. Restart Laravel server
# Ctrl+C, then:
php artisan serve
```

---

### **Issue: "redirect_uri_mismatch"**

**Cause:** Redirect URI di Google Console tidak sama persis

**Fix:**
1. Buka https://console.cloud.google.com/apis/credentials
2. Edit OAuth client "Rizquna ERP Web Client"
3. Check "Authorized redirect URIs"
4. Harus **EXACTLY** sama:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
5. Save changes
6. Wait 1-2 minutes
7. Try again

---

### **Issue: Button tidak muncul di frontend**

**Cause:** Frontend code belum update atau button tidak di-render

**Fix:**
```bash
# Check if button exists in frontend code
cd admin-panel
grep -r "Login dengan Google" src/
# Should find in LoginPage.tsx or similar

# If not found, add button:
# File: src/pages/auth/LoginPage.tsx
```

**Add button code:**
```tsx
<Button
    size="large"
    block
    onClick={() => window.location.href = '/api/v1/auth/google/redirect'}
    className="btn-google"
    icon={
        <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    }
>
    Login dengan Google
</Button>
```

---

### **Issue: Login berhasil tapi stuck di callback**

**Cause:** Frontend tidak handle fragment URL dengan benar

**Fix:**

Check frontend callback handler:

```tsx
// File: src/pages/auth/GoogleCallbackPage.tsx

useEffect(() => {
    // Parse fragment from URL
    const hash = window.location.hash.substring(1); // Remove #
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userStr = params.get('user');
    
    if (token) {
        // Store token
        localStorage.setItem('token', token);
        
        // Parse user data
        if (userStr) {
            const user = JSON.parse(userStr);
            // Store user data if needed
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
    } else {
        // No token - show error
        setError('Login gagal: Token tidak ditemukan');
    }
}, []);
```

---

## 🎯 SUCCESS CRITERIA

Login dianggap berhasil jika:

1. ✅ Bisa redirect ke Google OAuth
2. ✅ Bisa login dengan Google account
3. ✅ Approve permissions
4. ✅ Redirect back ke aplikasi
5. ✅ Token diterima dan disimpan di localStorage
6. ✅ Redirect ke dashboard (/dashboard atau /penulis)
7. ✅ User info muncul di UI (nama, email, avatar)
8. ✅ Database: User created/updated dengan `google_id`

---

## 📊 EXPECTED FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE OAUTH FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User klik "Login dengan Google"                         │
│     ↓                                                        │
│  2. Frontend: window.location.href = '/api/v1/auth/google/redirect'
│     ↓                                                        │
│  3. Backend: Redirect ke Google OAuth consent screen        │
│     ↓                                                        │
│  4. User login Google & approve permissions                 │
│     ↓                                                        │
│  5. Google redirect ke: /api/v1/auth/google/callback        │
│     ↓                                                        │
│  6. Backend: Exchange code untuk user info                  │
│     ↓                                                        │
│  7. Backend: Create/Update user di database                 │
│     ↓                                                        │
│  8. Backend: Generate Sanctum token                         │
│     ↓                                                        │
│  9. Backend: Redirect ke frontend dengan fragment:          │
│     /auth/google/callback#token=xxx&user=yyy                │
│     ↓                                                        │
│  10. Frontend: Parse fragment, extract token               │
│     ↓                                                        │
│  11. Frontend: Store token in localStorage                 │
│     ↓                                                        │
│  12. Frontend: Redirect to dashboard                        │
│     ✅ DONE!                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 LET'S GO!

**Estimated Time:** 10 minutes total

**Start now:**
1. ✅ Buka Google Cloud Console
2. ✅ Create project & credentials
3. ✅ Copy credentials ke .env
4. ✅ Clear cache
5. ✅ TEST LOGIN!

**Good luck! 🎉**

Kalau ada issue, cek troubleshooting section atau tanya saya!

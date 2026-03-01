# 📝 GOOGLE OAUTH SETUP CHECKLIST

**Print ini dan centang setiap step!**

---

## 🔴 STEP 1: GOOGLE CLOUD (5 min)

### 1.1 Buka Console
- [ ] Buka https://console.cloud.google.com/
- [ ] Login dengan Google account

### 1.2 Create Project
- [ ] Klik "Select a project"
- [ ] Klik "NEW PROJECT"
- [ ] Project name: **Rizquna ERP**
- [ ] Klik "CREATE"
- [ ] Tunggu notifikasi
- [ ] Klik "SELECT PROJECT"

### 1.3 Enable API
- [ ] Buka https://console.cloud.google.com/apis/library
- [ ] Search: "Google+ API"
- [ ] Klik hasil
- [ ] Klik "ENABLE"
- [ ] Tunggu status "ENABLED"

### 1.4 Consent Screen
- [ ] Buka https://console.cloud.google.com/apis/credentials/consent
- [ ] User Type: **External**
- [ ] Klik "CREATE"
- [ ] App name: **Rizquna ERP**
- [ ] Email: Pilih email Anda
- [ ] Klik "SAVE AND CONTINUE" (3x - skip semua)
- [ ] Klik "BACK TO DASHBOARD"

### 1.5 Create Credentials ⭐
- [ ] Buka https://console.cloud.google.com/apis/credentials
- [ ] Klik "+ CREATE CREDENTIALS"
- [ ] Pilih "OAuth client ID"
- [ ] Application type: **Web application**
- [ ] Name: **Rizquna ERP Web Client**
- [ ] Klik "+ ADD URI"
- [ ] Paste: `http://localhost:8000/api/v1/auth/google/callback`
- [ ] Klik "CREATE"
- [ ] **COPY CLIENT ID** (simpan di notepad!)
- [ ] **COPY CLIENT SECRET** (simpan di notepad!)
- [ ] Klik "OK"

---

## 🟡 STEP 2: CONFIGURE .ENV (1 min)

### 2.1 Edit .env
- [ ] Buka file `.env` di project folder
- [ ] Cari baris `GOOGLE_CLIENT_ID`
- [ ] Paste Client ID: `GOOGLE_CLIENT_ID=xxxxx`
- [ ] Cari baris `GOOGLE_CLIENT_SECRET`
- [ ] Paste Client Secret: `GOOGLE_CLIENT_SECRET=xxxxx`
- [ ] **SAVE FILE!**

---

## 🟢 STEP 3: CLEAR CACHE (30 sec)

### 3.1 Clear
- [ ] `php artisan config:clear`
- [ ] `php artisan cache:clear`

### 3.2 Verify
- [ ] `php artisan tinker`
- [ ] `config('services.google.client_id')` → Should show ID
- [ ] `config('services.google.client_secret')` → Should show secret
- [ ] `exit`

---

## 🔵 STEP 4: TEST LOGIN (5 min)

### 4.1 Start Servers
- [ ] Terminal 1: `php artisan serve`
- [ ] Terminal 2: `cd admin-panel && npm run dev`

### 4.2 Test
- [ ] Buka `http://localhost:3000/login`
- [ ] Klik "Login dengan Google"
- [ ] Redirect ke Google ✅
- [ ] Pilih Google account
- [ ] Klik "Izinkan"
- [ ] Redirect back ✅
- [ ] Token di localStorage ✅
- [ ] Dashboard terbuka ✅

### 4.3 Check Database
- [ ] `php artisan tinker`
- [ ] `$user = App\Models\User::where('email', 'your-email@gmail.com')->first();`
- [ ] `$user->google_id` → Should be set
- [ ] `$user->email_verified_at` → Should be set
- [ ] `exit`

---

## 🟣 STEP 5: SECURITY TEST (3 min)

### 5.1 Account Takeover Test
- [ ] Logout
- [ ] Login dengan Google (email sama, akun berbeda jika ada)
- [ ] Should be BLOCKED (409 error)
- [ ] Error: "Email sudah terhubung..."
- [ ] ✅ SECURE!

---

## ✅ FINAL CHECKLIST

```
SETUP COMPLETE:
[ ] Google Cloud project created
[ ] API enabled
[ ] Credentials created
[ ] .env configured
[ ] Cache cleared
[ ] Login works
[ ] Database updated
[ ] Security tested

ALL GREEN? 🎉 CONGRATULATIONS! 🎉

Google OAuth is NOW PRODUCTION READY!
```

---

## 📞 NOTES

**Client ID:**
```
Paste here: ________________________________
```

**Client Secret:**
```
Paste here: ________________________________
```

**Issues Encountered:**
```
1. ________________________________
2. ________________________________
3. ________________________________
```

**Date Completed:** ___ / ___ / _____

**Time Taken:** ___ minutes

---

## 🎯 NEXT STEPS

- [ ] Deploy to staging
- [ ] Test with real users
- [ ] Monitor logs
- [ ] Configure production credentials
- [ ] Update documentation

---

**GOOD LUCK! 🚀**

Kalau ada issue, cek file troubleshooting atau tanya!

# 🧪 QA Testing Checklist — Rizquna NRE

Daftar periksa pengujian komprehensif untuk memastikan kualitas aplikasi NRE di berbagai perangkat dan skenario.

## 📱 Perangkat & Browser (Target)

### Desktop
- [ ] **Chrome** (Versi terbaru)
- [ ] **Firefox** (Versi terbaru)
- [ ] **Safari** (Versi terbaru di macOS)
- [ ] **Edge** (Versi terbaru)

### Mobile (iOS)
- [ ] **iPhone 12/13/14/15** (Safari & Chrome)
- [ ] **iPad Pro** (Tablet layout)

### Mobile (Android)
- [ ] **Samsung Galaxy S21/S23** (Chrome)
- [ ] **Perangkat Android Low-end** (untuk uji performa)

---

## 🔍 Skenario Pengujian

### 1. Layout & Responsiveness
- [ ] Pastikan Navbar tidak tumpang tindih di layar kecil (320px).
- [ ] Grid katalog buku berubah dari 4 kolom (desktop) menjadi 1-2 kolom (mobile).
- [ ] Modal dan Drawer (Filter) pas di layar tanpa horizontal scrolling.
- [ ] Typography terbaca jelas di semua resolusi (tidak ada teks terpotong).

### 2. Touch & Interactions
- [ ] Semua tombol cukup besar untuk diklik jari (minimal 44x44px).
- [ ] Filter slider (Harga) dapat digeser dengan lancar di layar sentuh.
- [ ] Swipe pada carousel landing page berfungsi (jika ada).
- [ ] Hover state di desktop tidak menyebabkan masalah "double tap" di mobile.

### 3. Form Inputs (Critical for iOS)
- [ ] Keyboard tidak menutupi input field saat mengetik.
- [ ] Input tipe angka (Price range) memunculkan numeric keypad.
- [ ] Autocomplete di search bar tidak menghalangi input lain.
- [ ] Form Royalti: Upload bukti bayar berfungsi di kamera/galeri ponsel.

### 4. Performa & Media
- [ ] Cover buku dimuat secara lazy-loading saat di-scroll.
- [ ] Skeleton loader muncul saat data API sedang diambil.
- [ ] Gambar tidak pecah (menggunakan aspect ratio yang konsisten).
- [ ] Waktu muat halaman katalog < 2 detik (ideal).

### 5. Navigasi & Usability
- [ ] Tombol "Kembali" browser berfungsi dengan URL state (Filter tersimpan).
- [ ] Breadcrumb memudahkan navigasi kembali ke kategori/dashboard.
- [ ] Pesan error (404/500) ditampilkan dengan ramah jika API gagal.
- [ ] Logout membersihkan semua session dan redirect ke login.

---

## 🛠️ Alat Pengujian (Tools)

- **BrowserStack / Saucelabs**: Untuk pengujian perangkat fisik jarak jauh.
- **ngrok**: Untuk mengekspos localhost ke perangkat mobile asli dalam jaringan yang sama.
- **Chrome DevTools**: Gunakan "Device Mode" (Ctrl+Shift+M) untuk simulasi awal.
- **Lighthouse**: Untuk audit SEO, Aksesibilitas, dan Performa.

---

## 📝 Instruksi QA Manual

1. Buka aplikasi di environment **Staging/Production**.
2. Jalankan skenario di atas satu per satu.
3. Dokumentasikan bug dengan:
   - Langkah reproduksi (Steps to reproduce).
   - Screenshot / Screen recording.
   - User agent perangkat yang digunakan.
4. Tandai [x] jika sudah lolos verifikasi.

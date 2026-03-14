# 🟢 AGENT 2 — Frontend Public Site (React)

## MCP Protocol
Baca file koordinasi SEBELUM mulai kerja:
📄 .agents/MCP_STATE.md (di project root /Users/macm4/Documents/Projek/NRE)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu
Kamu adalah **Public Site Agent** untuk proyek NRE Rizquna Elfath. Kamu membangun semua halaman yang dilihat pengunjung: Landing Page, Katalog Buku, Detail Buku, Halaman Sitasi. Desain harus premium, modern, dan responsif.

## Stack
- React 19 + TypeScript
- Ant Design v5
- Vanilla CSS (BUKAN Tailwind)
- Vite, React Router v6

## Cara Jalankan
```bash
cd admin-panel && node node_modules/vite/bin/vite.js --port 4000 --host 0.0.0.0
# JANGAN pakai npm run dev (exit di non-interactive terminal)
```

## File yang BOLEH Kamu Ubah
```
admin-panel/src/pages/landing/          ← Landing, BookDetail, components
admin-panel/src/pages/catalog/          ← Katalog buku
admin-panel/src/pages/citation/         ← Sitasi akademik
admin-panel/src/index.css               ← Global styles (hati-hati)
```

## File yang DILARANG
```
admin-panel/src/pages/DashboardPage.tsx  → Agent 3
admin-panel/src/pages/admin/             → Agent 3
admin-panel/src/pages/author/            → Agent 3
admin-panel/src/pages/settings/          → Agent 3
admin-panel/src/api/                     → Shared, jangan ubah
app/                                      → Agent 1
docker/                                   → Agent 4
```

## API yang Kamu Konsumsi
```typescript
import api from '../../api';  // baseURL sudah = /api/v1

// Katalog
const res = await api.get('public/catalog', { params: { page, per_page, category, search } });

// Detail buku
const res = await api.get(`public/catalog/${slug}`);

// Kategori
const res = await api.get('public/categories');

// Statistik
const res = await api.get('public/stats');

// Cover image → langsung di <img src={book.cover_url}>
```

## Design System
```
Warna: #008B94 (teal), #D4AF37 (gold), #2B2B2B (dark text), #F8FAFC (light bg)
Font: 'Jost', sans-serif
Navbar: Putih, sticky
Footer: #1b3764 (dark blue)
Cards: Rounded 12-16px, subtle shadow
```

## ⚠️ ATURAN PENTING

### Harga Buku
```tsx
// ✅ BENAR
{Number(book.price) > 0 ? `Rp ${Number(book.price).toLocaleString('id-ID')}` : 'Hubungi Kami'}

// ❌ SALAH — API return "0.00" (truthy string!)
{book.price ? `Rp ...` : 'Hubungi Kami'}
```

### Cover Buku
```tsx
// Detail page → FLAT image, BUKAN 3D book
{book.cover_url ? (
  <img src={book.cover_url} alt={book.title} style={{ width: '100%', borderRadius: 12 }} />
) : (
  <BookCoverPlaceholder title={book.title} author={book.author?.nama} size="large" />
)}
```

### Nama Penulis
```tsx
book.author?.nama || book.author?.name || 'Penulis Rizquna'
```

### Kategori Filter
```tsx
// Ambil dari API, JANGAN hardcode
const [categories, setCategories] = useState([]);
useEffect(() => { api.get('public/categories').then(r => setCategories(r.data.data)); }, []);
```

### Tombol Beli
```tsx
// Sembunyikan jika harga = 0
{Number(book.price) > 0 && <Button>Beli Digital</Button>}
```

## Tugas Prioritas
1. ✅ Catalog "Hubungi Kami" for price=0 — DONE
2. ✅ Dynamic category filter — DONE
3. ✅ Flat cover detail page — DONE
4. ❌ SEO meta tags (title, OG tags per halaman)
5. ❌ Responsive mobile (320px, 768px, 1024px)
6. ❌ Landing page carousel pakai cover asli dari API
7. ❌ Loading states (skeleton/spinner)

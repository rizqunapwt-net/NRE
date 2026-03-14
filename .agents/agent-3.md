# 🟡 AGENT 3 — Admin Panel (React)

## MCP Protocol
Baca file koordinasi SEBELUM mulai kerja:
📄 .agents/MCP_STATE.md (di project root /Users/macm4/Documents/Projek/NRE)

Setelah selesai task → update status di MCP_STATE.md dan tulis di Communication Log.

---

## Siapa Kamu
Kamu adalah **Admin Panel Agent** untuk proyek NRE Rizquna Elfath. Kamu membangun interface admin: Dashboard, CRUD Buku, CRUD Penulis, Keuangan, Editorial, Settings.

## Stack
- React 19 + TypeScript
- Ant Design v5 (Table, Form, Modal, Card, Statistic, Tag, Badge, Upload)
- Vanilla CSS, React Router v6

## Cara Jalankan
```bash
cd admin-panel && node node_modules/vite/bin/vite.js --port 4000 --host 0.0.0.0
```

## File yang BOLEH Kamu Ubah
```
admin-panel/src/pages/DashboardPage.tsx & .css
admin-panel/src/pages/admin/              ← Semua halaman admin
admin-panel/src/pages/author/             ← Author portal
admin-panel/src/pages/settings/           ← Settings
admin-panel/src/pages/finance/            ← Keuangan/royalti
admin-panel/src/pages/login/              ← Login
admin-panel/src/components/               ← Shared admin components
admin-panel/src/hooks/                    ← Custom hooks
admin-panel/src/contexts/                 ← React contexts
```

## File yang DILARANG
```
admin-panel/src/pages/landing/     → Agent 2
admin-panel/src/pages/catalog/     → Agent 2
admin-panel/src/pages/citation/    → Agent 2
app/                                → Agent 1
docker/                             → Agent 4
```

## API yang Kamu Konsumsi
```typescript
import api from '../api';  // baseURL = /api/v1, token auto-attached

// Dashboard
await api.get('admin/dashboard-stats');
await api.get('admin/books', { params: { per_page: 5 } });
await api.get('admin/authors', { params: { per_page: 5 } });

// CRUD Buku
await api.get('admin/books', { params: { page, per_page, search, status } });
await api.post('admin/books', bookData);
await api.put(`admin/books/${id}`, bookData);
await api.delete(`admin/books/${id}`);

// Upload
const fd = new FormData(); fd.append('cover', file);
await api.post(`admin/books/${id}/upload-cover`, fd);

// CRUD Penulis
await api.get('admin/authors', { params: { page, per_page, search } });
await api.post('admin/authors', authorData);
await api.put(`admin/authors/${id}`, authorData);

// Auth
await api.post('auth/login', { email, password });
// Token: localStorage.getItem('token') → auto di header
```

## ⚠️ ATURAN PENTING

### SEMUA Data dari API — JANGAN Dummy
```tsx
// ❌ SALAH
const books = [{ id: 1, title: 'Book A' }];

// ✅ BENAR
const [books, setBooks] = useState([]);
useEffect(() => {
  api.get('admin/books', { params: { per_page: 5 } })
    .then(r => setBooks(r.data.data));
}, []);
```

### Tabel: Server-side Pagination
```tsx
<Table
  dataSource={books}
  pagination={{ current: page, total, pageSize: perPage, onChange: setPage }}
  loading={loading}
  rowKey="id"
/>
```

### Status Buku: Tag Warna
```tsx
const colors = { draft: 'default', review: 'processing', editing: 'warning', published: 'success', rejected: 'error' };
<Tag color={colors[book.status]}>{book.status}</Tag>
```

### Upload File: Ant Design Upload
```tsx
<Upload action={`/api/v1/admin/books/${id}/upload-cover`}
  headers={{ Authorization: `Bearer ${token}` }}
  accept="image/*" showUploadList={false} onChange={handleChange}>
  <Button icon={<UploadOutlined />}>Upload Cover</Button>
</Upload>
```

### Auth Flow
- Token di `localStorage('token')`
- Interceptor auto-attach ke header Authorization
- 401 → redirect ke /login

## Tugas Prioritas
1. ✅ Dashboard real data — DONE
2. ❌ Book list: pagination + search + filter status
3. ❌ Book form: create & edit + upload cover/PDF
4. ❌ Author list: CRUD lengkap
5. ❌ Royalty page: tabel perhitungan per penulis
6. ❌ Settings: editor FAQ, Testimonial

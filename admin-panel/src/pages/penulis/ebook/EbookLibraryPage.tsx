import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../api/base';
import LibraryHeader from './components/LibraryHeader';
import LibraryTabs from './components/LibraryTabs';
import MyBooksTab from './components/MyBooksTab';
import AllBooksTab from './components/AllBooksTab';
import type { EbookFilters, LibraryStats, LibraryTab, MyEbook, PublicEbook } from './types';
import './EbookLibraryPage.css';
type ApiBook = Record<string, unknown> & {
  id?: number | string;
  title?: string;
  judul?: string;
  slug?: string;
  cover_url?: string;
  cover_path?: string;
  published_at?: string;
  created_at?: string;
  category?: string;
  genre?: string;
  price?: number | string;
  harga?: number | string;
  rating?: number | string;
  review_count?: number | string;
  sales_count?: number | string;
  total_revenue?: number | string;
  status?: string;
  marketplace_count?: number | string;
  description?: string;
  sinopsis?: string;
  discount_price?: number | string;
  preview_available?: boolean;
  penulis?: string;
  author?: { nama?: string; name?: string };
  short_pdf_url?: string;
  short_pdf_name?: string;
  short_pdf_uploaded_at?: string;
};
type PaginatedPayload<T> = { data?: T[]; current_page?: number; last_page?: number };

const normalizeCategory = (value?: string | null) => (value && value.trim() ? value : 'General');
const toNum = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toMyEbook = (item: ApiBook): MyEbook => ({
  id: toNum(item.id),
  title: item.title || item.judul || 'Untitled Book',
  slug: String(item.slug || item.id),
  coverImage: item.cover_url || item.cover_path || '',
  publishedDate: item.published_at || item.created_at || new Date().toISOString(),
  category: normalizeCategory(item.category || item.genre),
  price: toNum(item.price || item.harga),
  rating: toNum(item.rating),
  reviewCount: toNum(item.review_count),
  salesCount: toNum(item.sales_count),
  totalRevenue: toNum(item.total_revenue),
  status: (item.status === 'published' ? 'published' : item.status === 'draft' ? 'draft' : 'unpublished'),
  marketplaceCount: toNum(item.marketplace_count),
  description: item.description || '',
  shortPdfUrl: item.short_pdf_url || undefined,
  shortPdfName: item.short_pdf_name || undefined,
  shortPdfUploadedAt: item.short_pdf_uploaded_at || undefined,
});

const toPublicEbook = (item: ApiBook): PublicEbook => ({
  id: toNum(item.id),
  title: item.title || item.judul || 'Untitled Book',
  slug: String(item.slug || item.id),
  coverImage: item.cover_url || item.cover_path || '',
  authorName: item.author?.nama || item.author?.name || item.penulis || 'Unknown Author',
  category: normalizeCategory(item.category || item.genre),
  price: toNum(item.price || item.harga),
  discountPrice: item.discount_price ? toNum(item.discount_price) : undefined,
  rating: toNum(item.rating),
  reviewCount: toNum(item.review_count),
  description: item.description || item.sinopsis || 'Deskripsi buku belum tersedia.',
  previewAvailable: Boolean(item.preview_available ?? true),
  publishedDate: item.published_at || item.created_at || new Date().toISOString(),
});

const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

const EbookLibraryPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<LibraryTab>('my-books');
  const [myBooks, setMyBooks] = useState<MyEbook[]>([]);
  const [publicBooks, setPublicBooks] = useState<PublicEbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [filters, setFilters] = useState<EbookFilters>({ category: 'all', search: '' });
  const [publicPage, setPublicPage] = useState(1);
  const [publicLastPage, setPublicLastPage] = useState(1);
  const [editTarget, setEditTarget] = useState<MyEbook | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<MyEbook | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PublicEbook | null>(null);
  const [shortPdfTarget, setShortPdfTarget] = useState<MyEbook | null>(null);
  const [shortPdfFile, setShortPdfFile] = useState<File | null>(null);
  const [uploadingShortPdf, setUploadingShortPdf] = useState(false);

  const loadMyBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/v1/user/books?per_page=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json() as PaginatedPayload<ApiBook>;
      const mapped = (payload.data || []).map((item) => toMyEbook(item));
      setMyBooks(mapped.filter((book: MyEbook) => book.status === 'published'));
    } catch {
      setError('Gagal memuat daftar e-book Anda.');
      setMyBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPublicBooks = useCallback(async (page: number, reset = false) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' });
      if (filters.search.trim()) params.set('search', filters.search.trim());
      const res = await fetch(`${API_BASE}/v1/public/catalog?${params.toString()}`);
      const payload = await res.json() as PaginatedPayload<ApiBook>;
      const mapped = (payload.data || []).map((item) => toPublicEbook(item));
      setPublicBooks((prev) => (reset ? mapped : [...prev, ...mapped]));
      setPublicPage(payload.current_page || page);
      setPublicLastPage(payload.last_page || page);
    } catch {
      setError('Gagal memuat katalog e-book publik.');
      if (reset) setPublicBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters.search]);

  useEffect(() => {
    if (activeTab === 'my-books') {
      loadMyBooks();
    } else {
      loadPublicBooks(1, true);
    }
  }, [activeTab, loadMyBooks, loadPublicBooks]);

  useEffect(() => {
    if (activeTab === 'all-books') {
      const timer = setTimeout(() => loadPublicBooks(1, true), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, filters.search, loadPublicBooks]);

  const myCategories = useMemo(() => [...new Set(myBooks.map((book) => book.category))], [myBooks]);
  const publicCategories = useMemo(() => [...new Set(publicBooks.map((book) => book.category))], [publicBooks]);

  const sortedMyBooks = useMemo(() => {
    const filtered = myBooks.filter((book) => filters.category === 'all' || book.category === filters.category);
    const list = [...filtered];

    switch (sortBy) {
      case 'best-selling':
        list.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case 'highest-rated':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'title-az':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        list.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        break;
    }

    return list;
  }, [myBooks, filters.category, sortBy]);

  const sortedPublicBooks = useMemo(() => {
    const filtered = publicBooks.filter((book) => {
      const matchCategory = filters.category === 'all' || book.category === filters.category;
      const matchSearch = !filters.search.trim() ||
        `${book.title} ${book.authorName} ${book.category}`.toLowerCase().includes(filters.search.trim().toLowerCase());
      return matchCategory && matchSearch;
    });

    const list = [...filtered];
    switch (sortBy) {
      case 'best-sellers':
      case 'most-reviewed':
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'top-rated':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        list.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case 'price-high':
        list.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      default:
        list.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        break;
    }

    return list;
  }, [publicBooks, filters, sortBy]);

  const myStats = useMemo<LibraryStats>(() => {
    const totalPublished = myBooks.length;
    const totalSales = myBooks.reduce((sum, book) => sum + book.salesCount, 0);
    const totalRevenue = myBooks.reduce((sum, book) => sum + book.totalRevenue, 0);
    const averageRating = totalPublished > 0 ? myBooks.reduce((sum, book) => sum + book.rating, 0) / totalPublished : 0;

    return { totalPublished, totalSales, totalRevenue, averageRating };
  }, [myBooks]);

  const handleUpdateBook = async (ebook: MyEbook) => {
    const title = prompt('Ubah judul buku:', ebook.title);
    if (!title || title.trim() === '') return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/v1/user/books/${ebook.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      setMyBooks((prev) => prev.map((book) => (book.id === ebook.id ? { ...book, title } : book)));
      setEditTarget(null);
    } catch {
      alert('Gagal mengubah metadata buku.');
    }
  };

  const canLoadMore = publicPage < publicLastPage;

  const handleUploadShortPdf = async () => {
    if (!shortPdfTarget) return;
    if (!shortPdfFile) {
      message.warning('Pilih file PDF terlebih dahulu.');
      return;
    }

    setUploadingShortPdf(true);
    try {
      const token = localStorage.getItem('token');
      const form = new FormData();
      form.append('file', shortPdfFile);

      const res = await fetch(`${API_BASE}/v1/user/books/${shortPdfTarget.id}/short-pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.message || 'Gagal upload PDF singkat.');
      }

      setMyBooks((prev) => prev.map((book) => (
        book.id === shortPdfTarget.id
          ? {
              ...book,
              shortPdfUrl: payload.data?.short_pdf_url || book.shortPdfUrl,
              shortPdfName: payload.data?.short_pdf_name || book.shortPdfName,
              shortPdfUploadedAt: payload.data?.short_pdf_uploaded_at || new Date().toISOString(),
            }
          : book
      )));
      message.success('PDF singkat berhasil disimpan.');
      setShortPdfFile(null);
      setShortPdfTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload gagal.';
      message.error(msg);
    } finally {
      setUploadingShortPdf(false);
    }
  };

  return (
    <div className="el-page">
      <LibraryHeader />

      <LibraryTabs active={activeTab} myBooksCount={myBooks.length} onChange={(tab) => {
        setActiveTab(tab);
        setFilters({ category: 'all', search: '' });
        setSortBy(tab === 'my-books' ? 'latest' : 'newest');
      }} />

      {activeTab === 'my-books' ? (
        <MyBooksTab
          loading={loading}
          error={error}
          books={sortedMyBooks}
          stats={myStats}
          filters={filters}
          categories={myCategories}
          sortBy={sortBy}
          onFilterCategory={(value) => setFilters((prev) => ({ ...prev, category: value }))}
          onSort={setSortBy}
          onViewDetail={(ebook) => navigate(`/ebooks/${ebook.id}`)}
          onEdit={(ebook) => setEditTarget(ebook)}
          onPromote={(ebook) => setPromoteTarget(ebook)}
          onReport={(ebook) => message.info(`${ebook.title} — Sales: ${ebook.salesCount} | Revenue: ${formatCurrency(ebook.totalRevenue)}`)}
          onDownload={(ebook) => message.info(`Download untuk "${ebook.title}" segera hadir.`)}
          onRead={(ebook) => navigate(`/katalog/${ebook.slug}/baca`)}
          onShortPdf={(ebook) => setShortPdfTarget(ebook)}
        />
      ) : (
        <AllBooksTab
          loading={loading}
          error={error}
          books={sortedPublicBooks}
          categories={publicCategories}
          filters={filters}
          sortBy={sortBy}
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          onFilterCategory={(value) => setFilters((prev) => ({ ...prev, category: value }))}
          onSort={setSortBy}
          onPreview={(ebook) => setPreviewTarget(ebook)}
          onAddToCart={(ebook) => message.info(`${ebook.title} — fitur cart segera hadir.`)}
          onLoadMore={() => loadPublicBooks(publicPage + 1)}
          canLoadMore={canLoadMore}
        />
      )}

      {editTarget && (
        <div className="el-modal-backdrop" onClick={() => setEditTarget(null)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Edit Metadata</h4>
            <p>{editTarget.title}</p>
            <div className="el-modal__actions">
              <button onClick={() => setEditTarget(null)}>Batal</button>
              <button onClick={() => handleUpdateBook(editTarget)}>Ubah Judul</button>
            </div>
          </div>
        </div>
      )}

      {promoteTarget && (
        <div className="el-modal-backdrop" onClick={() => setPromoteTarget(null)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Promote: {promoteTarget.title}</h4>
            <p>Bagikan link berikut ke marketplace atau media sosial:</p>
            <textarea
              readOnly
              value={`https://rizquna.id/ebooks/${promoteTarget.slug}\nhttps://gramedia.com/book/${promoteTarget.slug}\nhttps://play.google.com/store/books/details?id=${promoteTarget.id}`}
            />
            <div className="el-modal__actions">
              <button onClick={() => setPromoteTarget(null)}>Tutup</button>
              <button onClick={() => navigator.clipboard.writeText(`https://rizquna.id/ebooks/${promoteTarget.slug}`)}>Copy Link</button>
            </div>
          </div>
        </div>
      )}

      {previewTarget && (
        <div className="el-modal-backdrop" onClick={() => setPreviewTarget(null)}>
          <div className="el-modal" onClick={(e) => e.stopPropagation()}>
            <h4>{previewTarget.title}</h4>
            <p><strong>by {previewTarget.authorName}</strong></p>
            <p>{previewTarget.description}</p>
            <div className="el-modal__actions">
              <button onClick={() => setPreviewTarget(null)}>Close</button>
              <button onClick={() => { if (!previewTarget.previewAvailable) { message.info('Preview belum tersedia untuk buku ini.'); } else { window.open(`https://rizquna.id/ebooks/${previewTarget.slug}`, '_blank'); } }}>Open Preview</button>
            </div>
          </div>
        </div>
      )}

      {shortPdfTarget && (
        <div className="el-modal-backdrop" onClick={() => { setShortPdfTarget(null); setShortPdfFile(null); }}>
          <div className="el-modal el-modal--blog" onClick={(e) => e.stopPropagation()}>
            <div className="el-blog-preview">
              <div className="el-blog-preview__image" style={shortPdfTarget.coverImage ? { backgroundImage: `url(${shortPdfTarget.coverImage})` } : undefined} />
              <div className="el-blog-preview__content">
                <p className="el-blog-preview__date">
                  {shortPdfTarget.shortPdfUploadedAt
                    ? `Terakhir upload: ${new Date(shortPdfTarget.shortPdfUploadedAt).toLocaleDateString('id-ID')}`
                    : 'Belum ada PDF singkat'}
                </p>
                <h4>{shortPdfTarget.title}</h4>
                <p>Tambahkan PDF singkat (teaser/preview) untuk mendukung promosi buku di katalog dan halaman publik.</p>

                {shortPdfTarget.shortPdfUrl && (
                  <a
                    className="el-blog-preview__link"
                    href={shortPdfTarget.shortPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Buka PDF Saat Ini
                  </a>
                )}

                <label className="el-file-input">
                  <span>Pilih PDF singkat</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setShortPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
                <small>{shortPdfFile ? `File dipilih: ${shortPdfFile.name}` : 'Format: PDF, maks 10MB.'}</small>
              </div>
            </div>

            <div className="el-modal__actions">
              <button onClick={() => { setShortPdfTarget(null); setShortPdfFile(null); }}>Tutup</button>
              <button onClick={handleUploadShortPdf} disabled={uploadingShortPdf}>
                {uploadingShortPdf ? 'Mengupload...' : 'Upload PDF Singkat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EbookLibraryPage;

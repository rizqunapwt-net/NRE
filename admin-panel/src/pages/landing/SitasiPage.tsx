import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, Pagination, Spin, Button, Tag, Tooltip } from 'antd';
import {
    SearchOutlined,
    BookOutlined,
    FileTextOutlined,
    DownloadOutlined,
    CopyOutlined,
    EyeOutlined,
    CalendarOutlined,
    UserOutlined,
    TagOutlined,
} from '@ant-design/icons';
import api from '../../api';
import './SitasiPage.css';

interface BookResult {
    id: number;
    title: string;
    subtitle?: string;
    slug: string;
    author: { id: number; name: string } | null;
    published_year?: number;
    isbn?: string;
    abstract?: string;
    publisher?: string;
    cover_url: string | null;
    category?: { id: number; name: string } | null;
}

const SitasiPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '');
    const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');

    const currentPage = Number(searchParams.get('page') || '1');
    const perPage = 9;

    const { data, isLoading } = useQuery({
        queryKey: ['sitasi', searchParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(searchParams);
            params.set('per_page', String(perPage));
            // API baseURL is already /api/v1, so use relative paths
            const endpoint = searchParams.get('q')
                ? `search?${params}`
                : `public/sitasi?${params}`;
            const res = await api.get(endpoint);
            // API returns: { success: true, data: { total: X, data: [...], last_page: X } }
            const apiData = res.data?.data;
            return {
                books: apiData?.data || [],
                total: apiData?.total || 0,
                last_page: apiData?.last_page || 1,
            };
        },
    });

    const books: BookResult[] = data?.books || [];
    const total = data?.total || 0;
    const lastPage = data?.last_page || 1;

    const handleSearch = () => {
        const params: Record<string, string> = {};
        if (query.trim()) params.q = query.trim();
        if (yearFilter) params.year = yearFilter;
        if (categoryFilter) params.category = categoryFilter;
        setSearchParams(params);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        if (page > 1) {
            params.set('page', String(page));
        } else {
            params.delete('page');
        }
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setQuery('');
        setYearFilter('');
        setCategoryFilter('');
        setSearchParams({});
    };

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 20 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i),
    }));

    const hasActiveFilters = query || yearFilter || categoryFilter;

    return (
        <div className="sitasi-page">
            {/* Hero Section */}
            <section className="repo-hero">
                <div className="repo-hero__bg-pattern" />
                <div className="container repo-hero__content">
                    <div className="repo-hero__badge">
                        <FileTextOutlined />
                        <span>Repositori Akademik Digital</span>
                    </div>
                    <h1 className="repo-hero__title">
                        Pustaka Ilmiah &<br />
                        <span className="repo-hero__title-highlight">Referensi Akademik</span>
                    </h1>
                    <p className="repo-hero__description">
                        Akses ribuan buku akademik, jurnal, dan publikasi ilmiah dengan fitur sitasi lengkap
                        untuk mendukung penelitian dan studi Anda.
                    </p>

                    {/* Search Bar */}
                    <div className="repo-hero__search">
                        <div className="repo-search-box">
                            <SearchOutlined className="repo-search-box__icon" />
                            <input
                                type="text"
                                className="repo-search-box__input"
                                placeholder="Cari judul buku, ISBN, penulis, atau kata kunci..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button
                                type="primary"
                                className="repo-search-box__btn"
                                onClick={handleSearch}
                            >
                                Cari
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="repo-hero__stats">
                        <div className="repo-stat">
                            <span className="repo-stat__number">{total}</span>
                            <span className="repo-stat__label">Publikasi</span>
                        </div>
                        <div className="repo-stat-divider" />
                        <div className="repo-stat">
                            <span className="repo-stat__number">APA, MLA, Chicago</span>
                            <span className="repo-stat__label">Format Sitasi</span>
                        </div>
                        <div className="repo-stat-divider" />
                        <div className="repo-stat">
                            <span className="repo-stat__number">Gratis</span>
                            <span className="repo-stat__label">Akses Terbuka</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <main className="repo-main">
                <div className="container">
                    <div className="repo-layout">
                        {/* Sidebar Filters */}
                        <aside className="repo-sidebar">
                            <div className="repo-filters">
                                <div className="repo-filters__header">
                                    <h3>
                                        <TagOutlined />
                                        Filter Pencarian
                                    </h3>
                                    {hasActiveFilters && (
                                        <Button type="link" className="repo-filters__clear" onClick={clearFilters}>
                                            Reset
                                        </Button>
                                    )}
                                </div>

                                <div className="repo-filters__group">
                                    <label className="repo-filter-label">
                                        <SearchOutlined />
                                        Kata Kunci
                                    </label>
                                    <Input
                                        className="repo-filter-input"
                                        placeholder="Judul, ISBN, penulis..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        allowClear
                                    />
                                </div>

                                <div className="repo-filters__group">
                                    <label className="repo-filter-label">
                                        <CalendarOutlined />
                                        Tahun Terbit
                                    </label>
                                    <Select
                                        className="repo-filter-select"
                                        placeholder="Pilih tahun"
                                        options={yearOptions}
                                        value={yearFilter || undefined}
                                        onChange={(val) => setYearFilter(val || '')}
                                        allowClear
                                        showSearch
                                    />
                                </div>

                                <div className="repo-filters__group">
                                    <label className="repo-filter-label">
                                        <TagOutlined />
                                        Kategori
                                    </label>
                                    <Select
                                        className="repo-filter-select"
                                        placeholder="Semua kategori"
                                        options={[
                                            { label: 'Sains & Teknologi', value: 'sains' },
                                            { label: 'Sosial & Humaniora', value: 'sosial' },
                                            { label: 'Kedokteran & Kesehatan', value: 'kedokteran' },
                                            { label: 'Ekonomi & Bisnis', value: 'ekonomi' },
                                            { label: 'Hukum', value: 'hukum' },
                                            { label: 'Pendidikan', value: 'pendidikan' },
                                            { label: 'Agama & Filsafat', value: 'agama' },
                                            { label: 'Seni & Budaya', value: 'seni' },
                                        ]}
                                        value={categoryFilter || undefined}
                                        onChange={(val) => setCategoryFilter(val || '')}
                                        allowClear
                                    />
                                </div>

                                <Button
                                    type="primary"
                                    className="repo-filters__apply"
                                    onClick={handleSearch}
                                    block
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </aside>

                        {/* Results */}
                        <section className="repo-results">
                            <div className="repo-results-header">
                                <div className="repo-results-info">
                                    <h2 className="repo-results-title">Koleksi Publikasi</h2>
                                    <p className="repo-results-count">
                                        {isLoading ? (
                                            <Spin size="small" />
                                        ) : (
                                            <>Menampilkan <strong>{total}</strong> dokumen akademik</>
                                        )}
                                    </p>
                                </div>
                                <div className="repo-results-actions">
                                    <Select
                                        className="repo-sort-select"
                                        defaultValue="newest"
                                        options={[
                                            { label: 'Terbaru', value: 'newest' },
                                            { label: 'Terlama', value: 'oldest' },
                                            { label: 'A-Z', value: 'az' },
                                            { label: 'Z-A', value: 'za' },
                                        ]}
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="repo-loading">
                                    <Spin size="large" />
                                    <p>Memuat data dari repositori...</p>
                                </div>
                            ) : books.length === 0 ? (
                                <div className="repo-empty">
                                    <div className="repo-empty__icon">
                                        <BookOutlined />
                                    </div>
                                    <h3>Tidak Ditemukan</h3>
                                    <p>
                                        {hasActiveFilters
                                            ? 'Tidak ada hasil yang sesuai dengan filter Anda. Coba ubah kriteria pencarian.'
                                            : 'Belum ada publikasi dalam repositori.'}
                                    </p>
                                    {hasActiveFilters && (
                                        <Button onClick={clearFilters}>Bersihkan Filter</Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="repo-grid">
                                        {books.map((book) => (
                                            <article
                                                key={book.id}
                                                className="repo-card"
                                                onClick={() => navigate(`/sitasi/${book.slug}`)}
                                            >
                                                <div className="repo-card__cover">
                                                    {book.cover_url ? (
                                                        <img src={book.cover_url} alt={book.title} />
                                                    ) : (
                                                        <div className="repo-card__cover-placeholder">
                                                            <BookOutlined />
                                                        </div>
                                                    )}
                                                    <div className="repo-card__overlay">
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            icon={<EyeOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/sitasi/${book.slug}`);
                                                            }}
                                                        >
                                                            Lihat Detail
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="repo-card__content">
                                                    {book.category && (
                                                        <Tag className="repo-card__category" color="blue">
                                                            {book.category.name}
                                                        </Tag>
                                                    )}

                                                    <h3 className="repo-card__title" title={book.title}>
                                                        {book.title}
                                                    </h3>

                                                    {book.subtitle && (
                                                        <p className="repo-card__subtitle">{book.subtitle}</p>
                                                    )}

                                                    <div className="repo-card__author">
                                                        <UserOutlined />
                                                        <span>{book.author?.name || 'Penulis Tidak Diketahui'}</span>
                                                    </div>

                                                    <div className="repo-card__meta">
                                                        <span className="repo-card__year">
                                                            <CalendarOutlined />
                                                            {book.published_year || 'n.d.'}
                                                        </span>
                                                        {book.isbn && (
                                                            <Tooltip title={`ISBN: ${book.isbn}`}>
                                                                <span className="repo-card__isbn">
                                                                    ISBN
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                    </div>

                                                    {book.abstract && (
                                                        <p className="repo-card__abstract">
                                                            {book.abstract.substring(0, 120)}...
                                                        </p>
                                                    )}

                                                    <div className="repo-card__actions">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<CopyOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Copy citation logic here
                                                            }}
                                                        >
                                                            Sitasi
                                                        </Button>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<DownloadOutlined />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Download citation logic here
                                                            }}
                                                        >
                                                            Ekspor
                                                        </Button>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    {lastPage > 1 && (
                                        <div className="repo-pagination">
                                            <Pagination
                                                current={currentPage}
                                                total={total}
                                                pageSize={perPage}
                                                onChange={handlePageChange}
                                                showSizeChanger={false}
                                                showTotal={(total, range) =>
                                                    `${range[0]}-${range[1]} dari ${total} hasil`
                                                }
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="repo-footer">
                <div className="container">
                    <div className="repo-footer__content">
                        <div className="repo-footer__brand">
                            <div className="repo-footer__logo">
                                <FileTextOutlined />
                                <span>Rizquna Sitasi</span>
                            </div>
                            <p>Sistem Repositori Akademik & Perpustakaan Digital</p>
                        </div>
                        <div className="repo-footer__info">
                            <p>© {currentYear} Rizquna Elfath. Hak Cipta Dilindungi.</p>
                            <p>Mendukung akses terbuka untuk penelitian dan pendidikan.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SitasiPage;

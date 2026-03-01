import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, Pagination, Spin, Button } from 'antd';
import { SearchOutlined, BookOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../api';

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
}

const RepositoryPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // States for inputs
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '');
    
    const currentPage = Number(searchParams.get('page') || '1');
    const perPage = 10; // Menggunakan 10 item per halaman untuk list view

    // Data Fetching
    const { data, isLoading } = useQuery({
        queryKey: ['repository', searchParams.toString()],
        queryFn: async () => {
            const params = new URLSearchParams(searchParams);
            params.set('per_page', String(perPage));
            const endpoint = searchParams.get('q') 
                ? `/api/v1/search?${params}` 
                : `/api/v1/public/repository?${params}`;
            const res = await api.get(endpoint);
            return res.data?.data || { data: [], total: 0, last_page: 1 };
        }
    });

    const books: BookResult[] = data?.data || [];
    const total = data?.total || 0;

    // Handlers
    const handleSearch = () => {
        const params: Record<string, string> = {};
        if (query.trim()) params.q = query.trim();
        if (yearFilter) params.year = yearFilter;
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
    };

    // Helper: Years for filter
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 15 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i)
    }));

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-800">
            {/* Minimalist Topbar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-teal-700 text-white flex items-center justify-center font-bold rounded shadow-sm">
                            R
                        </div>
                        <span className="font-bold text-slate-800 tracking-wide text-sm hidden sm:block">
                            RIZQUNA REPOSITORY
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button type="text" onClick={() => navigate('/')} className="text-slate-500 hover:text-teal-700">
                            Beranda
                        </Button>
                        <Button type="text" onClick={() => navigate('/katalog')} className="text-slate-500 hover:text-teal-700">
                            Katalog Buku
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
                
                {/* Left Sidebar: Filters */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                            Pencarian
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Kata Kunci</label>
                                <Input 
                                    placeholder="Judul, ISBN, Penulis..." 
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    prefix={<SearchOutlined className="text-slate-400" />}
                                    className="rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Tahun Terbit</label>
                                <Select
                                    allowClear
                                    placeholder="Pilih Tahun"
                                    className="w-full rounded-md"
                                    options={yearOptions}
                                    value={yearFilter || undefined}
                                    onChange={(val) => setYearFilter(val || '')}
                                />
                            </div>

                            <Button 
                                type="primary" 
                                className="w-full bg-teal-700 hover:bg-teal-800 border-none rounded-md h-10 font-semibold shadow-md shadow-teal-700/20 mt-2"
                                onClick={handleSearch}
                            >
                                Terapkan Filter
                            </Button>
                        </div>
                    </div>
                </aside>

                {/* Right Content: Results */}
                <section className="flex-1 min-w-0">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-serif text-slate-900 mb-1">Pustaka Ilmiah</h1>
                            <p className="text-sm text-slate-500">
                                {isLoading ? 'Menghitung dokumen...' : `Ditemukan ${total} dokumen akademik`}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Spin size="large" />
                            <p className="mt-4 text-slate-400 text-sm">Mengambil data dari repositori...</p>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
                            <FileTextOutlined className="text-5xl text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">Tidak Ada Hasil</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                                Kami tidak dapat menemukan publikasi yang cocok dengan kriteria pencarian Anda. Silakan ubah kata kunci atau hapus filter.
                            </p>
                            <Button 
                                className="mt-6 border-slate-300 text-slate-600 rounded-md"
                                onClick={() => { setQuery(''); setYearFilter(''); setSearchParams({}); }}
                            >
                                Bersihkan Filter
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {books.map(book => (
                                <article 
                                    key={book.id} 
                                    className="bg-white border border-slate-200 p-6 rounded-xl hover:border-teal-600 transition-colors shadow-sm flex flex-col sm:flex-row gap-6"
                                >
                                    {/* Optional Cover Thumbnail */}
                                    <div className="w-24 h-32 flex-shrink-0 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden hidden sm:flex">
                                        {book.cover_url ? (
                                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <BookOutlined className="text-2xl text-slate-300" />
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold text-teal-700 uppercase tracking-wider">
                                            <span>Buku Referensi</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{book.published_year || 'Tahun Tidak Diketahui'}</span>
                                        </div>
                                        
                                        <Link to={`/repository/${book.slug}`} className="group block mb-1">
                                            <h2 className="text-xl font-serif font-medium text-slate-900 group-hover:text-teal-700 leading-snug">
                                                {book.title}
                                                {book.subtitle && <span className="text-slate-500 text-lg font-normal ml-2">: {book.subtitle}</span>}
                                            </h2>
                                        </Link>

                                        <p className="text-sm font-medium text-slate-700 mb-3">
                                            {book.author?.name || 'Penulis Tidak Diketahui'}
                                        </p>

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                                            {book.publisher && <span>Penerbit: {book.publisher}</span>}
                                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                                        </div>

                                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                                            {book.abstract || 'Abstrak tidak tersedia untuk publikasi ini.'}
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <Button 
                                                type="primary" 
                                                className="bg-teal-700 hover:bg-teal-800 border-none rounded-md"
                                                onClick={() => navigate(`/repository/${book.slug}`)}
                                            >
                                                Lihat Detail
                                            </Button>
                                            <Link 
                                                to={`/repository/${book.slug}`} 
                                                className="text-teal-700 text-sm font-semibold hover:underline"
                                            >
                                                Sitasi Karya Ini →
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {total > perPage && (
                        <div className="mt-10 flex justify-center">
                            <Pagination
                                current={currentPage}
                                total={total}
                                pageSize={perPage}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                                className="bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm"
                            />
                        </div>
                    )}
                </section>
            </main>

            <footer className="bg-slate-900 py-8 text-center text-slate-400 text-sm mt-10">
                <div className="max-w-6xl mx-auto px-6">
                    © {currentYear} Rizquna Elfath. Hak Cipta Dilindungi.<br/>
                    Sistem Repositori Akademik & Perpustakaan Digital.
                </div>
            </footer>
        </div>
    );
};

export default RepositoryPage;

import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../api/base';
import './EbookSayaPage.css';

interface Book {
    id: number;
    judul: string;
    penulis?: string;
    author?: { nama: string };
    cover_url?: string;
    harga?: number;
    status?: string;
    format?: string;
    category?: string;
}

const EbookSayaPage: React.FC = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [allBooks, setAllBooks] = useState<Book[]>([]);
    const [tab, setTab] = useState<'mine' | 'all'>('mine');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        Promise.all([
            fetch(`${API_BASE}/v1/user/books`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch(`${API_BASE}/v1/public/catalog?per_page=20`)
                .then(r => r.json()).catch(() => ({ data: [] })),
        ]).then(([mine, all]) => {
            setBooks((mine.data || []).filter((b: Book) => b.status === 'published'));
            setAllBooks(all.data || []);
            setLoading(false);
        });
    }, []);

    const displayBooks = tab === 'mine' ? books : allBooks;
    const filtered = displayBooks.filter((book: Book) =>
        !search || book.judul?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="ebook-library">
            <div className="ebook-header">
                <h1 className="ebook-title">Perpustakaan E-Book</h1>
                
                <div className="ebook-tabs">
                    <button 
                        className={`ebook-tab ${tab === 'mine' ? 'ebook-tab--active' : ''}`}
                        onClick={() => setTab('mine')}
                    >
                        📚 Milik Saya
                    </button>
                    <button 
                        className={`ebook-tab ${tab === 'all' ? 'ebook-tab--active' : ''}`}
                        onClick={() => setTab('all')}
                    >
                        🌐 Semua E-Book
                    </button>
                </div>
            </div>

            <input
                type="text"
                className="ebook-search"
                placeholder="Cari judul buku atau penulis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            {loading ? (
                <div className="ebook-loading">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="ebook-card">
                            <div className="ebook-cover" />
                            <div className="ebook-info" />
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="ebook-grid">
                    {filtered.map((book: Book) => (
                        <div key={book.id} className="ebook-card">
                            <div className="ebook-cover">
                                {book.cover_url ? (
                                    <img src={book.cover_url} alt={book.judul} />
                                ) : (
                                    <span>📚</span>
                                )}
                                {book.status === 'published' && (
                                    <span className="ebook-badge">Published</span>
                                )}
                            </div>
                            <div className="ebook-info">
                                <h3 className="ebook-title-text">{book.judul}</h3>
                                <p className="ebook-author">
                                    by {book.author?.nama || book.penulis || 'Unknown Author'}
                                </p>
                                {book.harga && (
                                    <p className="ebook-price">
                                        Rp {Number(book.harga).toLocaleString('id-ID')}
                                    </p>
                                )}
                                <div className="ebook-meta">
                                    <span className="ebook-tag">PDF</span>
                                    {book.category && (
                                        <span className="ebook-tag">{book.category}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="ebook-empty">
                    <div className="ebook-empty__icon">📚</div>
                    <p className="ebook-empty__text">
                        {tab === 'mine' 
                            ? 'Kamu belum memiliki e-book yang diterbitkan.' 
                            : 'Tidak ada e-book ditemukan.'}
                    </p>
                    <p className="ebook-empty__sub">
                        {tab === 'mine' 
                            ? 'Naskah Anda akan muncul di sini setelah diterbitkan menjadi e-book.' 
                            : 'Katalog e-book akan segera hadir.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default EbookSayaPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BookCoverPlaceholder from './components/BookCoverPlaceholder';
import { useSEO } from '../../hooks/useSEO';
import { DetailPageSkeleton } from '../../components/SkeletonLoaders';

interface MarketplaceLink {
    marketplace: string;
    code: string;
    url: string;
    price?: number;
}

interface Book {
    id: number;
    title: string;
    slug: string;
    author: { id: number; nama: string } | null;
    price: number;
    cover_url: string | null;
    description: string;
    isbn?: string;
    type?: string;
    is_digital?: boolean;
    marketplace_links?: MarketplaceLink[];
    category?: { id: number; name: string; slug: string; icon: string } | null;
    publisher?: string;
    page_count?: number;
    published_year?: number;
    published_at?: string;
    tracking_code?: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(star => (
                <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill={star <= rating ? '#FFBD1E' : '#D4D9E1'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
        </div>
    );
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(price);
};

const CITATION_FORMATS: { key: string; label: string }[] = [
    { key: 'apa', label: 'APA 7th' },
    { key: 'mla', label: 'MLA 9th' },
    { key: 'chicago', label: 'Chicago' },
    { key: 'ieee', label: 'IEEE' },
    { key: 'turabian', label: 'Turabian' },
    { key: 'bibtex', label: 'BibTeX' },
    { key: 'ris', label: 'RIS' },
];

const BookDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
    const [citations, setCitations] = useState<Record<string, string> | null>(null);
    const [citationsLoading, setCitationsLoading] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
    const [downloadType, setDownloadType] = useState<'ris' | 'bib' | null>(null);
    const [showCitationModal, setShowCitationModal] = useState(false);
    const [selectedCitFormat, setSelectedCitFormat] = useState('apa');

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBook();
    }, [slug]);

    // Set SEO metadata when book loads
    useSEO(
        book ? {
            title: book.title,
            description: book.description ? book.description.substring(0, 160) : `Baca ${book.title} dari Penerbit Rizquna Elfath`,
            image: book.cover_url || undefined,
            url: window.location.href,
            type: 'book'
        } : {
            title: 'Buku',
            description: 'Katalog buku dari Penerbit Rizquna Elfath'
        }
    );

    const fetchBook = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/public/catalog/${slug}`);
            const result = await response.json();
            if (result.data) {
                setBook(result.data);

                // Fetch related books and skip current one
                const relatedResponse = await fetch('/api/v1/public/catalog?per_page=4');
                const relatedResult = await relatedResponse.json();
                if (relatedResult.data) {
                    setRelatedBooks(
                        relatedResult.data
                            .filter((b: Book) => b.id !== result.data.id && b.slug !== slug)
                            .slice(0, 3)
                    );
                }
            }
        } catch (err) {
            console.error('Failed to fetch book:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCitations = async () => {
        if (!book || citations || citationsLoading) return;
        setCitationsLoading(true);
        try {
            const resp = await fetch(`/api/v1/books/${book.id}/cite/all`);
            const result = await resp.json();
            if (result.success && result.data?.formats) {
                setCitations(result.data.formats);
            }
        } catch (err) {
            console.error('Failed to fetch citations:', err);
        } finally {
            setCitationsLoading(false);
        }
    };

    const handleCopy = async (format: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFormat(format);
            setTimeout(() => setCopiedFormat(null), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedFormat(format);
            setTimeout(() => setCopiedFormat(null), 2000);
        }
    };

    const extractFilename = (contentDisposition: string | null, fallback: string) => {
        if (!contentDisposition) return fallback;

        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match?.[1]) {
            return decodeURIComponent(utf8Match[1].trim());
        }

        const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (basicMatch?.[1]) {
            return basicMatch[1].trim();
        }

        return fallback;
    };

    const handleDownload = async (type: 'ris' | 'bib') => {
        if (!book || downloadType) return;

        setDownloadType(type);

        try {
            const resp = await fetch(`/api/v1/books/${book.id}/cite/download?type=${type}`, {
                method: 'GET',
                credentials: 'same-origin',
            });

            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }

            const blob = await resp.blob();
            const ext = type === 'ris' ? 'ris' : 'bib';
            const fallbackName = `${book?.slug || `book-${book.id}`}-citation.${ext}`;
            const filename = extractFilename(resp.headers.get('content-disposition'), fallbackName);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download citation file:', err);
            // Fallback paling kompatibel lintas browser: pakai navigation langsung.
            window.location.href = `/api/v1/books/${book.id}/cite/download?type=${type}`;
        } finally {
            setDownloadType(null);
        }
    };

    if (loading || !book) {
        return <DetailPageSkeleton />;
    }

    return (
        <div style={{
            background: '#fff',
            fontFamily: "'Jost', sans-serif",
            color: '#2B2B2B'
        }}>

            <main style={{ padding: '40px 0 100px' }}>
                <div className="container" style={{ maxWidth: 1140, margin: '0 auto' }}>
                    {/* Breadcrumbs */}
                    <nav style={{
                        marginBottom: 60,
                        fontSize: 15,
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10
                    }}>
                        <Link to="/" style={{ textDecoration: 'none', color: '#2B2B2B', opacity: 0.6 }}>Home</Link>
                        <span style={{ color: '#999' }}>/</span>
                        <Link to="/katalog" style={{ textDecoration: 'none', color: '#2B2B2B', opacity: 0.6 }}>Books</Link>
                        <span style={{ color: '#999' }}>/</span>
                        <span style={{ color: '#008B94' }}>{book.title}</span>
                    </nav>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 520px) 1fr', gap: 60, alignItems: 'start' }}>
                        {/* Left Column: Cover Image */}
                        <div style={{
                            background: '#F8FAFC',
                            padding: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 520,
                            borderRadius: 24,
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{
                                width: '100%',
                                maxWidth: 360,
                                position: 'relative',
                                borderRadius: 12,
                                overflow: 'hidden',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                transform: 'translateY(0)',
                                transition: 'all 0.3s ease'
                            }}>
                                {book.cover_url ? (
                                    <img 
                                        src={book.cover_url} 
                                        alt={book.title}
                                        loading="eager"
                                        style={{ 
                                            width: '100%', 
                                            height: 'auto', 
                                            display: 'block',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div style={{ height: 480 }}>
                                        <BookCoverPlaceholder
                                            title={book.title}
                                            author={book.author?.nama}
                                            isbn={book.isbn}
                                            size="large"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Info */}
                        <div style={{ padding: '10px 0' }}>
                            <span style={{
                                display: 'inline-block',
                                background: '#008B94',
                                color: '#fff',
                                padding: '4px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 4,
                                marginBottom: 20,
                                textTransform: 'uppercase'
                            }}>
                                {book.is_digital ? 'Digital' : 'Tersedia'}
                            </span>

                            <h1 style={{
                                fontSize: 'clamp(28px, 4vw, 44px)',
                                fontWeight: 500,
                                marginBottom: 16,
                                lineHeight: 1.2
                            }}>
                                {book.title}
                            </h1>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                                <span style={{ fontSize: 28, fontWeight: 600 }}>
                                    {book.price > 0 ? formatPrice(book.price) : 'Hubungi Kami'}
                                </span>
                                <div style={{ height: 24, width: 1, background: '#dde3ef' }}></div>
                                <StarRating rating={4} />
                            </div>

                            {book.description && (
                                <p style={{
                                    fontSize: 16,
                                    lineHeight: 1.7,
                                    color: '#5a5a5a',
                                    marginBottom: 32,
                                    maxWidth: 600
                                }}>
                                    {book.description}
                                </p>
                            )}

                            {book.author && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 20, height: 20, borderRadius: '50%', background: '#008B94',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 6L9 17L4 12" />
                                            </svg>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 16 }}>By, {book.author.nama}</span>
                                    </div>
                                </div>
                            )}

                            {/* ── Metadata Tiles (Codekop-inspired) ── */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                gap: 12,
                                marginBottom: 32,
                            }}>
                                {[
                                    { label: 'ISBN', value: book.isbn },
                                    { label: 'Kategori', value: book.category?.name },
                                    { label: 'Penerbit', value: book.publisher || 'Rizquna Elfath' },
                                    { label: 'Penulis', value: book.author?.nama },
                                    { label: 'Tipe', value: book.is_digital ? 'E-Book / Digital' : 'Cetak' },
                                    { label: 'Bahasa', value: 'Indonesia' },
                                    { label: 'Halaman', value: book.page_count },
                                    { label: 'Tahun', value: book.published_year || (book.published_at ? new Date(book.published_at).getFullYear() : undefined) },
                                ].filter(m => m.value).map(m => (
                                    <div key={m.label} style={{
                                        background: '#f5f7fa',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        transition: 'background 0.2s',
                                    }}>
                                        <div style={{
                                            textTransform: 'uppercase',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: '#888',
                                            letterSpacing: '0.06em',
                                            marginBottom: 6,
                                        }}>{m.label}</div>
                                        <div style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            color: '#2B2B2B',
                                            wordBreak: 'break-word',
                                        }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
                                {book.is_digital && book.price > 0 && (
                                    <button
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            if (!token) {
                                                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                                                return;
                                            }
                                            fetch(`/api/v1/books/${book.id}/purchase`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                                            })
                                                .then(r => r.json())
                                                .then(res => {
                                                    if (res.data?.payment_url) {
                                                        window.open(res.data.payment_url, '_blank');
                                                    } else if (res.data?.status === 'completed') {
                                                        alert('Anda sudah memiliki akses ke buku ini.');
                                                    } else {
                                                        alert(res.message || 'Gagal memproses pembelian.');
                                                    }
                                                })
                                                .catch(() => alert('Gagal memproses pembelian.'));
                                        }}
                                        className="primary-gradient hover-glow"
                                        style={{
                                            padding: '16px 36px', color: '#fff',
                                            border: 0, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                                            borderRadius: 12,
                                            display: 'inline-flex', alignItems: 'center', gap: 10,
                                            boxShadow: '0 4px 15px rgba(124, 179, 66, 0.35)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
                                        Beli Digital — {formatPrice(book.price)}
                                    </button>
                                )}

                                {book.is_digital && (
                                    <Link
                                        to={`/katalog/${book.slug}/baca`}
                                        className="hover-glow"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px 24px', background: '#ffffff',
                                            border: '2px solid #2B2B2B', borderRadius: 12,
                                            color: '#2B2B2B', textDecoration: 'none', fontSize: 16, fontWeight: 700,
                                            gap: 10, transition: 'all 0.3s'
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
                                        Preview PDF
                                    </Link>
                                )}

                                {/* Sitasi Akademik Button */}
                                <button
                                    onClick={() => {
                                        setShowCitationModal(true);
                                        fetchCitations();
                                    }}
                                    className="hover-glow"
                                    aria-label="Tampilkan sitasi akademik"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '16px 24px', background: '#ffffff',
                                        border: '2px solid #008B94', borderRadius: 12,
                                        color: '#008B94', fontSize: 16, fontWeight: 700,
                                        gap: 10, cursor: 'pointer', transition: 'all 0.3s'
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                                    Sitasi Akademik
                                </button>
                            </div>

                            {/* ── Social Share ── */}
                            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bagikan:</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { 
                                            name: 'Facebook', 
                                            icon: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />, 
                                            color: '#1877F2',
                                            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
                                        },
                                        { 
                                            name: 'Twitter', 
                                            icon: <path d="M4 4l11.733 16h4.267l-11.733 -16z M4 20l6.768 -6.768 M13.232 10.768l6.768 -6.768" />, 
                                            color: '#000000',
                                            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(book.title)}`
                                        },
                                        { 
                                            name: 'WhatsApp', 
                                            icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.7.9L21 3l-1.5 6.5L21 11.5z" />, 
                                            color: '#25D366',
                                            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(book.title + ' ' + window.location.href)}`
                                        }
                                    ].map(social => (
                                        <a
                                            key={social.name}
                                            href={social.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Bagikan ke ${social.name}`}
                                            style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: '#f1f5f9', color: '#64748b',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                textDecoration: 'none'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.background = social.color; e.currentTarget.style.color = '#fff'; }}
                                            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {social.icon}
                                            </svg>
                                        </a>
                                    ))}
                                    <button
                                        onClick={() => handleCopy('link', window.location.href)}
                                        aria-label="Salin tautan"
                                        style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: copiedFormat === 'link' ? '#008B94' : '#f1f5f9',
                                            color: copiedFormat === 'link' ? '#fff' : '#64748b',
                                            border: 0, cursor: 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        {copiedFormat === 'link' ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Marketplace Links */}
                            {book.marketplace_links && book.marketplace_links.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: '#999', marginBottom: 10, textTransform: 'uppercase' }}>
                                        {book.is_digital ? 'Tersedia juga di:' : 'Beli di Marketplace:'}
                                    </p>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {book.marketplace_links.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                                    padding: '10px 18px', border: '1px solid #dde3ef',
                                                    borderRadius: 6, textDecoration: 'none', color: '#2B2B2B',
                                                    fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                                                    background: '#fff'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.borderColor = '#008B94'; e.currentTarget.style.color = '#008B94'; }}
                                                onMouseOut={e => { e.currentTarget.style.borderColor = '#dde3ef'; e.currentTarget.style.color = '#2B2B2B'; }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                {link.marketplace}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Tabs */}
            <section style={{ padding: '80px 0', borderTop: '1px solid #eee' }}>
                <div className="container" style={{ maxWidth: 1140, margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        background: '#f1f5f9',
                        padding: '6px',
                        borderRadius: '16px',
                        gap: '8px',
                        marginBottom: 60,
                        marginLeft: '50%',
                        transform: 'translateX(-50%)'
                    }}>
                        {[
                            { key: 'description', label: 'Deskripsi Buku' },
                            { key: 'reviews', label: 'Ulasan Pembaca' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    background: activeTab === tab.key ? '#fff' : 'transparent',
                                    border: 0,
                                    borderRadius: '12px',
                                    fontSize: 15,
                                    fontWeight: activeTab === tab.key ? 700 : 500,
                                    padding: '12px 24px',
                                    color: activeTab === tab.key ? '#008B94' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: activeTab === tab.key ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ maxWidth: 800, margin: '0 auto', lineHeight: 1.8, color: '#5a5a5a', fontSize: 17 }}>
                        {activeTab === 'description' && (
                            <p style={{ textAlign: 'center' }}>{book.description || 'Deskripsi belum tersedia.'}</p>
                        )}

                        {activeTab === 'reviews' && (
                            <p style={{ textAlign: 'center' }}>Belum ada ulasan untuk buku ini.</p>
                        )}
                    </div>
                </div>
            </section>

            {/* Related Books */}
            {relatedBooks.length > 0 && (
                <section style={{ padding: '100px 0', background: '#fcfcfc', borderTop: '1px solid #eee' }}>
                    <div className="container" style={{ maxWidth: 1140, margin: '0 auto' }}>
                        <h2 style={{
                            textAlign: 'center',
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: 42,
                            marginBottom: 60,
                            fontWeight: 400
                        }}>
                            Buku Lainnya
                        </h2>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 40,
                            flexWrap: 'wrap'
                        }}>
                            {relatedBooks.map(b => (
                                <Link
                                    to={`/katalog/${b.slug}`}
                                    key={b.id}
                                    style={{
                                        textDecoration: 'none', color: 'inherit', textAlign: 'center',
                                        width: 'calc(33.333% - 27px)', minWidth: 280,
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-10px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{
                                        background: 'linear-gradient(145deg, #f0f2f5, #e8eaef)',
                                        padding: 24, marginBottom: 20,
                                        display: 'flex', justifyContent: 'center',
                                        perspective: '800px',
                                    }}>
                                        <div style={{
                                            transformStyle: 'preserve-3d', transform: 'rotateY(-15deg)',
                                            position: 'relative', width: 150, height: 210,
                                        }}>
                                            <div style={{
                                                position: 'absolute', width: '100%', height: '100%',
                                                borderRadius: '0 3px 3px 0', overflow: 'hidden',
                                                boxShadow: '2px 2px 8px rgba(0,0,0,0.15)',
                                            }}>
                                                {b.cover_url ? (
                                                    <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <BookCoverPlaceholder title={b.title} size="small" />
                                                )}
                                            </div>
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, width: 20, height: '100%',
                                                backgroundColor: '#1e2d44',
                                                background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.2) 100%)',
                                                transform: 'translateX(-20px) rotateY(90deg)', transformOrigin: 'right center',
                                                borderRadius: '3px 0 0 3px',
                                            }} />
                                            <div style={{
                                                position: 'absolute', right: 0, top: 3, width: 18, height: 'calc(100% - 6px)',
                                                background: 'repeating-linear-gradient(90deg, #f5f5f0 0px, #ede8df 2px, #f5f5f0 4px)',
                                                transform: 'translateX(18px) rotateY(-90deg)', transformOrigin: 'left center',
                                                borderRadius: '0 2px 2px 0',
                                            }} />
                                        </div>
                                    </div>
                                    <h4 style={{
                                        fontFamily: "'DM Serif Display', serif",
                                        fontSize: 20, fontWeight: 400,
                                        marginBottom: 10, color: '#2B2B2B'
                                    }}>
                                        {b.title}
                                    </h4>
                                    <div style={{ fontWeight: 600, color: '#008B94', fontSize: 18 }}>{formatPrice(b.price)}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Citation Popup Modal ── */}
            {showCitationModal && (
                <div
                    onClick={(e) => { if (e.target === e.currentTarget) setShowCitationModal(false); }}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, padding: 20
                    }}
                >
                    <div className="fade-in" style={{
                        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #f0f0f0'
                        }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Kutip</h3>
                            <button
                                onClick={() => setShowCitationModal(false)}
                                style={{
                                    width: 32, height: 32, borderRadius: '50%', border: 0,
                                    background: '#f5f5f5', cursor: 'pointer', fontSize: 16,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {citationsLoading ? (
                            <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
                                <div style={{ width: 28, height: 28, border: '3px solid #f0f0f0', borderTopColor: '#008B94', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                                Memuat sitasi...
                            </div>
                        ) : citations ? (
                            <>
                                {/* Format Tabs */}
                                <div style={{
                                    display: 'flex', gap: 6, padding: '16px 24px 0',
                                    flexWrap: 'wrap'
                                }}>
                                    {CITATION_FORMATS.map(fmt => {
                                        if (!citations[fmt.key]) return null;
                                        const isActive = selectedCitFormat === fmt.key;
                                        return (
                                            <button
                                                key={fmt.key}
                                                onClick={() => setSelectedCitFormat(fmt.key)}
                                                style={{
                                                    padding: '7px 14px', border: '1px solid',
                                                    borderColor: isActive ? '#008B94' : '#e5e7eb',
                                                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                                                    background: isActive ? '#008B94' : '#fff',
                                                    color: isActive ? '#fff' : '#64748b',
                                                    cursor: 'pointer', transition: 'all 0.15s'
                                                }}
                                            >
                                                {fmt.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Preview */}
                                <div style={{ padding: '16px 24px' }}>
                                    <div style={{
                                        background: '#f9fafb', border: '1px solid #f0f0f0',
                                        borderRadius: 10, padding: '20px',
                                        fontSize: 14, lineHeight: 1.8, color: '#374151',
                                        fontFamily: selectedCitFormat === 'bibtex' || selectedCitFormat === 'ris' ? "'JetBrains Mono', monospace" : 'inherit',
                                        whiteSpace: selectedCitFormat === 'bibtex' || selectedCitFormat === 'ris' ? 'pre-wrap' : 'normal',
                                        minHeight: 60, userSelect: 'text'
                                    }}>
                                        {citations[selectedCitFormat] || 'Format ini tidak tersedia.'}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0 24px 20px', gap: 12
                                }}>
                                    <button
                                        onClick={() => citations[selectedCitFormat] && handleCopy(selectedCitFormat, citations[selectedCitFormat])}
                                        style={{
                                            padding: '10px 20px', border: '1px solid #e5e7eb',
                                            borderRadius: 10, background: copiedFormat === selectedCitFormat ? '#008B94' : '#fff',
                                            color: copiedFormat === selectedCitFormat ? '#fff' : '#1e293b',
                                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {copiedFormat === selectedCitFormat ? (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                                Tersalin!
                                            </>
                                        ) : (
                                            <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                                Salin
                                            </>
                                        )}
                                    </button>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => handleDownload('ris')}
                                            disabled={downloadType !== null}
                                            style={{
                                                padding: '10px 16px', background: 'transparent',
                                                border: '1px solid #e5e7eb', borderRadius: 10,
                                                fontSize: 12, fontWeight: 600, color: '#475569',
                                                cursor: downloadType ? 'not-allowed' : 'pointer',
                                                opacity: downloadType ? 0.6 : 1,
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                            RIS
                                        </button>
                                        <button
                                            onClick={() => handleDownload('bib')}
                                            disabled={downloadType !== null}
                                            style={{
                                                padding: '10px 16px', background: 'transparent',
                                                border: '1px solid #e5e7eb', borderRadius: 10,
                                                fontSize: 12, fontWeight: 600, color: '#475569',
                                                cursor: downloadType ? 'not-allowed' : 'pointer',
                                                opacity: downloadType ? 0.6 : 1,
                                                display: 'flex', alignItems: 'center', gap: 6
                                            }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                            BibTeX
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#888', padding: '40px 24px' }}>Sitasi tidak tersedia untuk buku ini.</p>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap');
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
                @media (max-width: 991px) {
                  main .container > div {
                    grid-template-columns: 1fr !important;
                  }
                }
            `}</style>
        </div>
    );
};

export default BookDetailPage;

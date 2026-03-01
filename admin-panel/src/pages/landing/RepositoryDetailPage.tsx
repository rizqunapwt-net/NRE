import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BookCoverPlaceholder from './components/BookCoverPlaceholder';
import './LandingPage_Bokify.css';

interface BookDetail {
    id: number;
    title: string;
    subtitle?: string;
    slug: string;
    author: { id: number; name: string } | null;
    year?: number;
    publisher?: string;
    publisher_city?: string;
    isbn?: string;
    edition?: string;
    total_pages?: number;
    abstract?: string;
    cover_url: string | null;
    language?: string;
    category?: { id: number; name: string } | null;
    references?: { id: number; raw_text: string; order_number: number }[];
    citations?: Record<string, string>;
}

const CITATION_FORMATS: { key: string; label: string; mono?: boolean }[] = [
    { key: 'apa', label: 'APA 7th' },
    { key: 'mla', label: 'MLA 9th' },
    { key: 'chicago', label: 'Chicago' },
    { key: 'ieee', label: 'IEEE' },
    { key: 'turabian', label: 'Turabian' },
    { key: 'bibtex', label: 'BibTeX', mono: true },
    { key: 'ris', label: 'RIS', mono: true },
];

// ── Brand Palette ──
const C = {
    teal: '#008B94',
    tealDark: '#006B73',
    tealLight: '#E6F5F6',
    tealSubtle: '#F2FAFA',
    accent: '#F4A91D',
    accentLight: '#FFF8EB',
    white: '#FFFFFF',
    black: '#2B2B2B',
    gray: '#A0A0A0',
    grayLight: '#E8E8E8',
    grayBg: '#F7F8F9',
    success: '#10b981',
} as const;

const RepositoryDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [citations, setCitations] = useState<Record<string, string> | null>(null);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
    const [downloadType, setDownloadType] = useState<'ris' | 'bib' | null>(null);
    const [activeSection, setActiveSection] = useState<'info' | 'cite' | 'refs'>('cite');
    const [activeCiteFormat, setActiveCiteFormat] = useState('apa');

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBook();
    }, [slug]);

    const fetchBook = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`/api/v1/public/repository/${slug}`);
            const result = await resp.json();
            if (result.data) {
                setBook(result.data);
                if (result.data.citations) {
                    setCitations(result.data.citations);
                }
            }
        } catch (err) {
            console.error('Failed to fetch book:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (format: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    const handleDownload = async (type: 'ris' | 'bib') => {
        if (!book || downloadType) return;
        setDownloadType(type);
        try {
            const resp = await fetch(`/api/v1/books/${book.id}/cite/download?type=${type}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const blob = await resp.blob();
            const ext = type === 'ris' ? 'ris' : 'bib';
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${book.slug}-citation.${ext}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            window.location.href = `/api/v1/books/${book.id}/cite/download?type=${type}`;
        } finally {
            setDownloadType(null);
        }
    };

    if (loading || !book) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.white }}>
                <div style={{ width: 44, height: 44, border: `4px solid ${C.tealLight}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const metaItems = [
        { label: 'Penulis', value: book.author?.name },
        { label: 'Penerbit', value: book.publisher },
        { label: 'Kota Terbit', value: book.publisher_city },
        { label: 'Tahun', value: book.year },
        { label: 'Edisi', value: book.edition },
        { label: 'ISBN', value: book.isbn },
        { label: 'Halaman', value: book.total_pages },
        { label: 'Bahasa', value: book.language },
        { label: 'Kategori', value: book.category?.name },
    ].filter(m => m.value);

    const activeCitation = citations?.[activeCiteFormat];
    const activeFmt = CITATION_FORMATS.find(f => f.key === activeCiteFormat);

    return (
        <div style={{
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Jost', 'Plus Jakarta Sans', sans-serif",
            background: C.white,
        }}>
            {/* Subtle teal glow */}
            <div style={{
                position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)',
                width: 1200, height: 600,
                background: `radial-gradient(50% 50% at 50% 50%, rgba(0, 139, 148, 0.05) 0%, rgba(255,255,255,0) 100%)`,
                zIndex: 0, pointerEvents: 'none',
            }} />

            <main style={{ position: 'relative', zIndex: 1, padding: '60px 0 120px' }}>
                <div className="container" style={{ maxWidth: 1080 }}>
                    {/* Breadcrumbs */}
                    <nav style={{ marginBottom: 48, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Link to="/" style={{ textDecoration: 'none', color: C.gray, transition: 'color 0.2s' }}>Home</Link>
                        <span style={{ color: C.grayLight }}>/</span>
                        <Link to="/repository" style={{ textDecoration: 'none', color: C.gray, transition: 'color 0.2s' }}>Repository</Link>
                        <span style={{ color: C.grayLight }}>/</span>
                        <span style={{ color: C.black, fontWeight: 500 }}>{book.title}</span>
                    </nav>

                    {/* Header: Cover + Meta */}
                    <div className="repo-detail-header" style={{
                        display: 'grid', gridTemplateColumns: '300px 1fr',
                        gap: 56, marginBottom: 64, alignItems: 'start',
                    }}>
                        {/* 3D Book */}
                        <div style={{
                            background: `linear-gradient(145deg, ${C.grayBg} 0%, #EEEFF1 100%)`,
                            padding: '48px 32px', display: 'flex', justifyContent: 'center',
                            perspective: '1000px', position: 'relative',
                        }}>
                            <div style={{
                                position: 'absolute', bottom: 20, left: '18%', right: '18%', height: 30,
                                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, transparent 70%)',
                                filter: 'blur(5px)',
                            }} />
                            <div style={{
                                transformStyle: 'preserve-3d',
                                transform: 'rotateY(-18deg)',
                                position: 'relative', width: 200, height: 290, zIndex: 1,
                            }}>
                                <div style={{
                                    position: 'absolute', width: '100%', height: '100%',
                                    borderRadius: '0 4px 4px 0', overflow: 'hidden',
                                    boxShadow: '4px 4px 16px rgba(0,0,0,0.16)',
                                }}>
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <BookCoverPlaceholder title={book.title} author={book.author?.name} size="large" />
                                    )}
                                </div>
                                {/* Spine */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, width: 32, height: '100%',
                                    background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.2) 100%)',
                                    backgroundColor: C.tealDark,
                                    transform: 'translateX(-32px) rotateY(90deg)', transformOrigin: 'right center',
                                    borderRadius: '4px 0 0 4px',
                                }} />
                                {/* Pages */}
                                <div style={{
                                    position: 'absolute', right: 0, top: 4, width: 30, height: 'calc(100% - 8px)',
                                    background: 'repeating-linear-gradient(90deg, #f5f5f0 0px, #ede8df 2px, #f5f5f0 4px)',
                                    transform: 'translateX(30px) rotateY(-90deg)', transformOrigin: 'left center',
                                    borderRadius: '0 3px 3px 0', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)',
                                }} />
                            </div>
                        </div>

                        {/* Info */}
                        <div style={{ paddingTop: 8 }}>
                            {book.category && (
                                <span style={{
                                    display: 'inline-block', fontSize: 12, fontWeight: 700,
                                    color: C.accent, background: C.accentLight,
                                    padding: '4px 12px', borderRadius: 16,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em', marginBottom: 16,
                                }}>
                                    {book.category.name}
                                </span>
                            )}
                            <h1 style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 'clamp(28px, 4vw, 42px)',
                                fontWeight: 400, color: C.black,
                                marginBottom: 8, lineHeight: 1.2,
                            }}>
                                {book.title}
                            </h1>
                            {book.subtitle && (
                                <p style={{ fontSize: 18, color: C.gray, marginBottom: 16, fontWeight: 400 }}>
                                    {book.subtitle}
                                </p>
                            )}
                            {book.author && (
                                <p style={{ fontSize: 16, color: C.teal, fontWeight: 600, marginBottom: 28 }}>
                                    {book.author.name}
                                </p>
                            )}

                            {/* Meta grid */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '16px 32px', padding: '24px 0',
                                borderTop: `1px solid ${C.grayLight}`, borderBottom: `1px solid ${C.grayLight}`,
                            }}>
                                {metaItems.map(m => (
                                    <div key={m.label}>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, color: C.gray,
                                            textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            {m.label}
                                        </span>
                                        <p style={{ fontSize: 15, fontWeight: 500, color: C.black, margin: '4px 0 0' }}>
                                            {m.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Export buttons */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                                <button
                                    onClick={() => handleDownload('ris')}
                                    disabled={downloadType !== null}
                                    style={{
                                        padding: '10px 20px', background: C.teal, color: C.white,
                                        border: 0, fontSize: 13, fontWeight: 600,
                                        cursor: downloadType ? 'not-allowed' : 'pointer',
                                        opacity: downloadType ? 0.6 : 1,
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        transition: 'opacity 0.2s', borderRadius: 4,
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                    {downloadType === 'ris' ? 'Mengunduh...' : 'Ekspor RIS'}
                                </button>
                                <button
                                    onClick={() => handleDownload('bib')}
                                    disabled={downloadType !== null}
                                    style={{
                                        padding: '10px 20px', background: 'transparent', color: C.black,
                                        border: `1px solid ${C.grayLight}`, fontSize: 13, fontWeight: 600,
                                        cursor: downloadType ? 'not-allowed' : 'pointer',
                                        opacity: downloadType ? 0.6 : 1,
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        transition: 'opacity 0.2s', borderRadius: 4,
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                    {downloadType === 'bib' ? 'Mengunduh...' : 'Ekspor BibTeX'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section Tabs */}
                    <div style={{
                        display: 'flex', gap: 0,
                        borderBottom: `2px solid ${C.grayLight}`,
                        marginBottom: 48,
                    }}>
                        {([
                            { key: 'cite', label: 'Sitasi Akademik' },
                            { key: 'info', label: 'Abstrak' },
                            { key: 'refs', label: 'Daftar Pustaka' },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveSection(tab.key)}
                                style={{
                                    background: 'transparent', border: 0,
                                    borderBottom: activeSection === tab.key ? `2px solid ${C.teal}` : '2px solid transparent',
                                    padding: '14px 28px', fontSize: 15,
                                    fontWeight: activeSection === tab.key ? 700 : 500,
                                    color: activeSection === tab.key ? C.teal : C.gray,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    marginBottom: -2,
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Citation Tab */}
                    {activeSection === 'cite' && (
                        <div style={{ maxWidth: 800 }}>
                            {citations ? (
                                <>
                                    {/* Format selector pills */}
                                    <div style={{
                                        display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap',
                                    }}>
                                        {CITATION_FORMATS.map(fmt => (
                                            <button
                                                key={fmt.key}
                                                onClick={() => setActiveCiteFormat(fmt.key)}
                                                style={{
                                                    padding: '8px 18px',
                                                    border: `1px solid ${activeCiteFormat === fmt.key ? C.teal : C.grayLight}`,
                                                    background: activeCiteFormat === fmt.key ? C.teal : C.white,
                                                    color: activeCiteFormat === fmt.key ? C.white : C.black,
                                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                    transition: 'all 0.2s', borderRadius: 4,
                                                }}
                                            >
                                                {fmt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active citation display */}
                                    {activeCitation && (
                                        <div style={{
                                            border: `1px solid ${C.grayLight}`,
                                            borderRadius: 6, overflow: 'hidden',
                                        }}>
                                            {/* Citation header with format label */}
                                            <div style={{
                                                padding: '12px 24px',
                                                background: C.tealSubtle,
                                                borderBottom: `1px solid ${C.grayLight}`,
                                                display: 'flex', alignItems: 'center', gap: 10,
                                            }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, color: C.teal, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                    {activeFmt?.label}
                                                </span>
                                            </div>

                                            {/* Citation content */}
                                            <div style={{
                                                padding: '28px 24px',
                                                fontSize: 15, lineHeight: 1.9,
                                                fontFamily: activeFmt?.mono ? "'JetBrains Mono', 'Fira Code', monospace" : 'inherit',
                                                whiteSpace: activeFmt?.mono ? 'pre-wrap' : 'normal',
                                                color: C.black,
                                                background: C.white,
                                            }}>
                                                {activeCitation}
                                            </div>

                                            {/* Copy bar */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'flex-end',
                                                padding: '12px 20px', borderTop: `1px solid ${C.grayLight}`,
                                                background: C.grayBg,
                                            }}>
                                                <button
                                                    onClick={() => handleCopy(activeCiteFormat, activeCitation)}
                                                    style={{
                                                        padding: '8px 20px',
                                                        border: `1px solid ${copiedFormat === activeCiteFormat ? C.success : C.grayLight}`,
                                                        background: copiedFormat === activeCiteFormat ? C.success : C.white,
                                                        color: copiedFormat === activeCiteFormat ? C.white : C.black,
                                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                                        transition: 'all 0.2s', borderRadius: 4,
                                                    }}
                                                >
                                                    {copiedFormat === activeCiteFormat ? (
                                                        <>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                                                            Tersalin
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                                            Salin Sitasi
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p style={{ color: C.gray, fontStyle: 'italic' }}>Sitasi tidak tersedia untuk buku ini.</p>
                            )}
                        </div>
                    )}

                    {/* Abstract Tab */}
                    {activeSection === 'info' && (
                        <div style={{ maxWidth: 800, lineHeight: 1.9, fontSize: 16, color: C.black }}>
                            {book.abstract ? (
                                <p style={{ opacity: 0.85 }}>{book.abstract}</p>
                            ) : (
                                <p style={{ color: C.gray, fontStyle: 'italic' }}>Abstrak belum tersedia untuk buku ini.</p>
                            )}
                        </div>
                    )}

                    {/* References Tab */}
                    {activeSection === 'refs' && (
                        <div style={{ maxWidth: 800 }}>
                            {book.references && book.references.length > 0 ? (
                                <>
                                    <p style={{ fontSize: 14, color: C.gray, marginBottom: 24 }}>
                                        {book.references.length} referensi tercatat
                                    </p>
                                    <ol style={{ paddingLeft: 24, lineHeight: 2, fontSize: 15, color: C.black }}>
                                        {book.references.map(ref => (
                                            <li key={ref.id} style={{ marginBottom: 8, paddingLeft: 4, opacity: 0.85 }}>
                                                {ref.raw_text}
                                            </li>
                                        ))}
                                    </ol>
                                </>
                            ) : (
                                <p style={{ color: C.gray, fontStyle: 'italic' }}>Daftar pustaka belum tersedia.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .repo-detail-header {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default RepositoryDetailPage;

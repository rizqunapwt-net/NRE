import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    BookOutlined, 
    DownloadOutlined, 
    CopyOutlined, 
    CheckOutlined,
    FileTextOutlined,
    LinkOutlined,
    CalendarOutlined,
    UserOutlined,
    TagOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { Button, Tag, Spin, Tabs, message, Tooltip } from 'antd';
import api from '../../api';
import './SitasiDetailPage.css';

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

interface CitationFormat {
    key: string;
    label: string;
    description?: string;
    mono?: boolean;
}

const CITATION_FORMATS: CitationFormat[] = [
    { key: 'apa', label: 'APA 7th', description: 'American Psychological Association', mono: false },
    { key: 'mla', label: 'MLA 9th', description: 'Modern Language Association', mono: false },
    { key: 'chicago', label: 'Chicago', description: 'Chicago Manual of Style', mono: false },
    { key: 'ieee', label: 'IEEE', description: 'Institute of Electrical and Electronics Engineers', mono: false },
    { key: 'turabian', label: 'Turabian', description: 'Turabian Style', mono: false },
    { key: 'harvard', label: 'Harvard', description: 'Harvard Referencing Style', mono: false },
    { key: 'bibtex', label: 'BibTeX', description: 'BibTeX format', mono: true },
    { key: 'ris', label: 'RIS', description: 'Research Information Systems', mono: true },
];

const SitasiDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [citations, setCitations] = useState<Record<string, string> | null>(null);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('citation');

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchBook();
    }, [slug]);

    const fetchBook = async () => {
        setLoading(true);
        try {
            const resp = await api.get(`/api/v1/public/sitasi/${slug}`);
            const result = resp.data;
            if (result.data) {
                setBook(result.data);
                if (result.data.citations) {
                    setCitations(result.data.citations);
                }
            }
        } catch (err) {
            console.error('Failed to fetch book:', err);
            message.error('Gagal memuat detail buku');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (format: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFormat(format);
            message.success('Sitasi berhasil disalin!');
            setTimeout(() => setCopiedFormat(null), 2000);
        } catch (err) {
            message.error('Gagal menyalin sitasi');
        }
    };

    const handleDownload = async (type: 'ris' | 'bib') => {
        if (!book || downloading) return;
        setDownloading(type);
        try {
            const resp = await api.get(`/api/v1/books/${book.id}/cite/download?type=${type}`, {
                responseType: 'blob',
            });
            const ext = type === 'ris' ? 'ris' : 'bib';
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${book.slug}-citation.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            message.success('File sitasi berhasil diunduh!');
        } catch (err) {
            window.location.href = `/api/v1/books/${book.id}/cite/download?type=${type}`;
        } finally {
            setDownloading(null);
        }
    };

    if (loading) {
        return (
            <div className="repo-detail-loading">
                <Spin size="large" />
                <p>Memuat detail publikasi...</p>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="repo-detail-not-found">
                <BookOutlined />
                <h2>Publikasi Tidak Ditemukan</h2>
                <p>Maaf, publikasi yang Anda cari tidak tersedia.</p>
                <Button type="primary" onClick={() => navigate('/sitasi')}>
                    <ArrowLeftOutlined /> Kembali ke Sitasi
                </Button>
            </div>
        );
    }

    const metaItems = [
        { label: 'Penulis', value: book.author?.name, icon: <UserOutlined /> },
        { label: 'Penerbit', value: book.publisher, icon: <BookOutlined /> },
        { label: 'Kota Terbit', value: book.publisher_city, icon: <TagOutlined /> },
        { label: 'Tahun', value: book.year, icon: <CalendarOutlined /> },
        { label: 'Edisi', value: book.edition, icon: <FileTextOutlined /> },
        { label: 'ISBN', value: book.isbn, icon: <FileTextOutlined /> },
        { label: 'Halaman', value: book.total_pages, icon: <FileTextOutlined /> },
        { label: 'Bahasa', value: book.language, icon: <LinkOutlined /> },
        { label: 'Kategori', value: book.category?.name, icon: <TagOutlined /> },
    ].filter(m => m.value);

    return (
        <div className="sitasi-detail-page">
            {/* Breadcrumb */}
            <nav className="repo-breadcrumb">
                <div className="container">
                    <Link to="/" className="repo-breadcrumb__link">Home</Link>
                    <span className="repo-breadcrumb__separator">/</span>
                    <Link to="/sitasi" className="repo-breadcrumb__link">Sitasi</Link>
                    <span className="repo-breadcrumb__separator">/</span>
                    <span className="repo-breadcrumb__current">{book.title}</span>
                </div>
            </nav>

            {/* Main Content */}
            <main className="repo-detail-main">
                <div className="container">
                    <div className="repo-detail-grid">
                        {/* Left: Book Cover */}
                        <aside className="repo-detail-sidebar">
                            <div className="repo-detail-cover-wrapper">
                                <div className="repo-detail-cover">
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} />
                                    ) : (
                                        <div className="repo-detail-cover-placeholder">
                                            <BookOutlined />
                                            <span>{book.title.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="repo-detail-cover-shadow" />
                            </div>

                            {/* Export Actions */}
                            <div className="repo-detail-actions">
                                <h4 className="repo-detail-actions-title">Ekspor Sitasi</h4>
                                <div className="repo-detail-actions-buttons">
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload('ris')}
                                        loading={downloading === 'ris'}
                                        block
                                    >
                                        Download RIS
                                    </Button>
                                    <Button
                                        icon={<DownloadOutlined />}
                                        onClick={() => handleDownload('bib')}
                                        loading={downloading === 'bib'}
                                        block
                                    >
                                        Download BibTeX
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className="repo-detail-quick-info">
                                <h4 className="repo-detail-quick-info-title">Informasi Singkat</h4>
                                <div className="repo-detail-quick-info-list">
                                    {book.isbn && (
                                        <div className="repo-detail-info-item">
                                            <FileTextOutlined />
                                            <span>{book.isbn}</span>
                                        </div>
                                    )}
                                    {book.year && (
                                        <div className="repo-detail-info-item">
                                            <CalendarOutlined />
                                            <span>{book.year}</span>
                                        </div>
                                    )}
                                    {book.total_pages && (
                                        <div className="repo-detail-info-item">
                                            <FileTextOutlined />
                                            <span>{book.total_pages} halaman</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>

                        {/* Right: Content */}
                        <section className="repo-detail-content">
                            {/* Header */}
                            <div className="repo-detail-header">
                                {book.category && (
                                    <Tag className="repo-detail-category" color="blue">
                                        <TagOutlined />
                                        {book.category.name}
                                    </Tag>
                                )}
                                
                                <h1 className="repo-detail-title">{book.title}</h1>
                                
                                {book.subtitle && (
                                    <p className="repo-detail-subtitle">{book.subtitle}</p>
                                )}
                                
                                {book.author && (
                                    <div className="repo-detail-author">
                                        <UserOutlined />
                                        <span>{book.author.name}</span>
                                    </div>
                                )}

                                {/* Meta Grid */}
                                <div className="repo-detail-meta-grid">
                                    {metaItems.map(item => (
                                        <div key={item.label} className="repo-detail-meta-item">
                                            <span className="repo-detail-meta-icon">{item.icon}</span>
                                            <div className="repo-detail-meta-content">
                                                <span className="repo-detail-meta-label">{item.label}</span>
                                                <span className="repo-detail-meta-value">{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                className="repo-detail-tabs"
                                items={[
                                    {
                                        key: 'citation',
                                        label: (
                                            <span>
                                                <FileTextOutlined />
                                                Sitasi Akademik
                                            </span>
                                        ),
                                        children: (
                                            <div className="repo-citation-section">
                                                <div className="repo-citation-intro">
                                                    <h3>Pilih Format Sitasi</h3>
                                                    <p>
                                                        Pilih format sitasi yang sesuai dengan kebutuhan akademik Anda. 
                                                        Setiap format memiliki gaya penulisan referensi yang berbeda.
                                                    </p>
                                                </div>

                                                {/* Format Pills */}
                                                <div className="repo-citation-formats">
                                                    {CITATION_FORMATS.map(format => (
                                                        <Tooltip 
                                                            key={format.key} 
                                                            title={format.description}
                                                            placement="top"
                                                        >
                                                            <button
                                                                className={`repo-citation-format ${
                                                                    activeTab === 'citation' && 
                                                                    (!citations || !citations[format.key]) 
                                                                        ? 'disabled' 
                                                                        : ''
                                                                }`}
                                                                onClick={() => {
                                                                    if (citations?.[format.key]) {
                                                                        setActiveTab(`cite-${format.key}`);
                                                                    }
                                                                }}
                                                                disabled={!citations?.[format.key]}
                                                            >
                                                                {format.label}
                                                            </button>
                                                        </Tooltip>
                                                    ))}
                                                </div>

                                                {/* Citation Display Tabs */}
                                                <div className="repo-citation-display">
                                                    <Tabs
                                                        type="card"
                                                        activeKey={activeTab.startsWith('cite-') ? activeTab : undefined}
                                                        onChange={(key) => setActiveTab(key)}
                                                        items={CITATION_FORMATS
                                                            .filter(f => citations?.[f.key])
                                                            .map(format => ({
                                                                key: `cite-${format.key}`,
                                                                label: format.label,
                                                                children: (
                                                                    <div className="repo-citation-block">
                                                                        <div className="repo-citation-header">
                                                                            <div className="repo-citation-format-info">
                                                                                <span className="repo-citation-format-name">
                                                                                    {format.label}
                                                                                </span>
                                                                                {format.description && (
                                                                                    <span className="repo-citation-format-desc">
                                                                                        {format.description}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                icon={copiedFormat === format.key ? <CheckOutlined /> : <CopyOutlined />}
                                                                                onClick={() => handleCopy(format.key, citations![format.key])}
                                                                                type={copiedFormat === format.key ? 'primary' : 'default'}
                                                                            >
                                                                                {copiedFormat === format.key ? 'Disalin' : 'Salin'}
                                                                            </Button>
                                                                        </div>
                                                                        <div className={`repo-citation-content ${format.mono ? 'repo-citation-content-mono' : ''}`}>
                                                                            {citations![format.key]}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            }))
                                                        }
                                                    />
                                                </div>

                                                {(!citations || Object.keys(citations).length === 0) && (
                                                    <div className="repo-citation-empty">
                                                        <FileTextOutlined />
                                                        <p>Sitasi tidak tersedia untuk publikasi ini.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'abstract',
                                        label: (
                                            <span>
                                                <FileTextOutlined />
                                                Abstrak
                                            </span>
                                        ),
                                        children: (
                                            <div className="repo-abstract-section">
                                                <h3>Abstrak</h3>
                                                {book.abstract ? (
                                                    <div className="repo-abstract-content">
                                                        <p>{book.abstract}</p>
                                                    </div>
                                                ) : (
                                                    <div className="repo-abstract-empty">
                                                        <FileTextOutlined />
                                                        <p>Abstrak belum tersedia untuk publikasi ini.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'references',
                                        label: (
                                            <span>
                                                <LinkOutlined />
                                                Daftar Pustaka
                                            </span>
                                        ),
                                        children: (
                                            <div className="repo-references-section">
                                                <h3>Daftar Pustaka</h3>
                                                {book.references && book.references.length > 0 ? (
                                                    <ol className="repo-references-list">
                                                        {book.references.map((ref) => (
                                                            <li key={ref.id} className="repo-reference-item">
                                                                {ref.raw_text}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                ) : (
                                                    <div className="repo-references-empty">
                                                        <BookOutlined />
                                                        <p>Daftar pustaka belum tersedia untuk publikasi ini.</p>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="repo-detail-footer">
                <div className="container">
                    <p>
                        © {new Date().getFullYear()} Rizquna Sitasi. 
                        Sistem Repositori Akademik & Perpustakaan Digital.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default SitasiDetailPage;

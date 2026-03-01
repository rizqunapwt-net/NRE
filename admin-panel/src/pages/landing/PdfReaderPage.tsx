import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Layout,
  Button,
  Space,
  InputNumber,
  Tooltip,
  Spin,
  Typography,
  ConfigProvider,
  theme as antdTheme,
  Divider,
  Select,
  Empty,
  message
} from 'antd';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCw,
  Download,
  Printer,
  Layout as LayoutIcon,
  ShoppingBag,
  ArrowLeft,
  Lock,
  MousePointer2,
  Hand
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../../api';
import BookCoverPlaceholder from './components/BookCoverPlaceholder';

// Use a reliable CDN for the worker to avoid local resolution issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

interface BookDetail {
  id: number;
  slug: string;
  title: string;
  author: { id: number; nama: string } | null;
  description: string;
  isbn?: string;
  price: number;
  cover_url?: string;
}

interface PdfState {
  data: any; // Blob or Uint8Array
  total_pages: number;
  preview_pages: number;
  has_full_access: boolean;
  book: BookDetail;
}

const PdfReaderPage: React.FC = () => {
  const { slug: id } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [pdfState, setPdfState] = useState<PdfState | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Fetch PDF & Metadata
  useEffect(() => {
    async function loadPdf() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // 1. Get Book Metadata
        const metaRes = await api.get(`/public/catalog/${id}`).catch(err => {
          if (err.response?.status === 404) throw new Error('Buku tidak ditemukan di katalog.');
          throw err;
        });

        const book = metaRes.data?.data;
        if (!book) throw new Error('Data buku tidak valid.');

        let pdfData: any = null;
        let hasFullAccess = false;
        let previewPages = book.preview_pages ?? 10;

        // 2. Try Full Access (if token exists)
        if (token) {
          try {
            const fullRes = await api.get(`/books/${id}/read`, {
              responseType: 'blob',
            });
            if (fullRes.status === 200) {
              pdfData = fullRes.data;
              hasFullAccess = true;
            }
          } catch (e) {
            console.warn('Akses penuh ditolak, mencoba preview...');
          }
        }

        // 3. Fallback to Preview if no full access yet
        if (!pdfData) {
          try {
            const previewRes = await api.get(`/public/books/${id}/preview`);
            if (previewRes.data?.success) {
              const meta = previewRes.data.data;
              previewPages = meta.preview_pages ?? 10;
              const pdfUrl = meta.url;

              if (pdfUrl) {
                // Jika pdfUrl sudah mengandung /api/v1, gunakan axios instance yang sudah punya base URL
                // tapi hilangkan base URL-nya agar tidak dobel.
                const cleanUrl = pdfUrl.startsWith('/api/v1')
                  ? pdfUrl.substring(7)
                  : pdfUrl;

                const pdfRes = await api.get(cleanUrl, { responseType: 'blob' });
                if (pdfRes.status === 200) {
                  pdfData = pdfRes.data;
                }
              }
            }
          } catch (e) {
            console.error('Gagal memuat preview:', e);
          }
        }

        if (!pdfData) {
          throw new Error('File PDF tidak ditemukan di server. Pastikan file sudah diunggah.');
        }

        setPdfState({
          data: pdfData,
          total_pages: book.page_count || 200,
          preview_pages: previewPages,
          has_full_access: hasFullAccess,
          book
        });
      } catch (err: any) {
        console.error('PDF Load Error:', err);
        setError(err.message || 'Gagal memuat buku.');
      } finally {
        setLoading(false);
      }
    }

    loadPdf();
  }, [id]);

  // Stable file reference — prevent Document re-init on re-renders
  const pdfFile = useMemo(() => pdfState?.data ?? null, [pdfState]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    message.success('Dokumen berhasil dimuat');
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF Rendering Error:', err);
    setError('Gagal merender file PDF. Format mungkin tidak didukung.');
  }, []);

  const goToPage = (page: number) => {
    if (!pdfState) return;
    const targetPage = Math.max(1, Math.min(page, pdfState.total_pages ?? numPages));

    if (!pdfState.has_full_access && targetPage > pdfState.preview_pages) {
      const paywallElement = document.getElementById('preview-paywall-card');
      if (paywallElement) {
        paywallElement.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setCurrentPage(targetPage);

    const element = pageRefs.current[targetPage];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Sync scroll with page number
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const top = container.scrollTop + 150;
      let visiblePage = 1;

      for (let i = 1; i <= numPages; i++) {
        const el = pageRefs.current[i];
        if (el && el.offsetTop <= top) {
          visiblePage = i;
        }
      }
      if (visiblePage !== currentPage) {
        setCurrentPage(visiblePage);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [numPages, currentPage]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!pdfState || !pdfState.has_full_access) {
      return;
    }
    const url = window.URL.createObjectURL(pdfState.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#323639' }}>
        <Spin size="large" tip="Mempersiapkan dokumen..." />
      </div>
    );
  }

  if (error || !pdfState) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <Empty description={error} image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={() => navigate('/katalog')}>Kembali ke Katalog</Button>
        </Empty>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: '#008B94',
          colorBgBase: '#323639',
          colorBgContainer: '#424649',
          borderRadius: 4,
        },
      }}
    >
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Top Header */}
        <Header style={{
          background: '#323639',
          padding: '0 12px',
          height: 48,
          lineHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #202224',
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <Tooltip title="Kembali">
              <Button type="text" icon={<ArrowLeft size={18} color="#e5e7eb" />} onClick={() => navigate('/katalog')} />
            </Tooltip>
            <Divider type="vertical" style={{ background: '#525659', height: 20 }} />
            <Text style={{ color: '#e5e7eb', fontSize: 13, fontWeight: 500 }} ellipsis>
              {pdfState.book.title}.pdf
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Space size="middle">
              {!pdfState.has_full_access && (
                <Button
                  size="small"
                  type="primary"
                  icon={<ShoppingBag size={14} />}
                  onClick={() => navigate(`/katalog/${pdfState.book.slug}`)}
                  style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
                >
                  Beli Full Akses
                </Button>
              )}
              <Tooltip title="Print">
                <Button type="text" size="small" icon={<Printer size={16} color="#d1d5db" />} disabled={!pdfState.has_full_access} />
              </Tooltip>
              <Tooltip title="Download">
                <Button type="text" size="small" icon={<Download size={16} color="#d1d5db" />} onClick={handleDownload} disabled={!pdfState.has_full_access} />
              </Tooltip>
            </Space>
          </div>
        </Header>

        {/* Control Toolbar */}
        <div style={{
          background: '#424649',
          height: 40,
          borderBottom: '1px solid #202224',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          zIndex: 90
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <Button
              type="text"
              size="small"
              icon={<LayoutIcon size={16} color="#d1d5db" />}
              onClick={() => setShowSidebar(!showSidebar)}
              style={{ background: showSidebar ? '#525659' : 'transparent' }}
            />
            <Divider type="vertical" style={{ background: '#525659', height: 20, margin: 'auto 8px' }} />
            <Button type="text" size="small" icon={<MousePointer2 size={16} color={toolMode === 'select' ? '#008B94' : '#d1d5db'} />} onClick={() => setToolMode('select')} />
            <Button type="text" size="small" icon={<Hand size={16} color={toolMode === 'pan' ? '#008B94' : '#d1d5db'} />} onClick={() => setToolMode('pan')} />
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
            <Button type="text" size="small" icon={<ChevronLeft size={16} color="#d1d5db" />} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />
            <InputNumber
              size="small"
              min={1}
              max={pdfState.total_pages}
              value={currentPage}
              onChange={(v) => v && goToPage(v)}
              controls={false}
              style={{ width: 45, textAlign: 'center', background: '#323639', borderColor: '#525659' }}
            />
            <span style={{ color: '#9ca3af', fontSize: 12 }}>/ {pdfState.total_pages}</span>
            <Button type="text" size="small" icon={<ChevronRight size={16} color="#d1d5db" />} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pdfState.total_pages} />
          </div>

          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Button type="text" size="small" icon={<RotateCw size={16} color="#d1d5db" />} onClick={() => setRotation(r => (r + 90) % 360)} />
            <Divider type="vertical" style={{ background: '#525659', height: 20, margin: 'auto 4px' }} />
            <Button type="text" size="small" icon={<ZoomOut size={16} color="#d1d5db" />} onClick={() => setScale(s => Math.max(0.5, s - 0.2))} />
            <Select
              size="small"
              value={scale}
              onChange={setScale}
              style={{ width: 80 }}
              options={[
                { value: 0.5, label: '50%' },
                { value: 0.75, label: '75%' },
                { value: 1.0, label: '100%' },
                { value: 1.2, label: '120%' },
                { value: 1.5, label: '150%' },
                { value: 2.0, label: '200%' },
              ]}
            />
            <Button type="text" size="small" icon={<ZoomIn size={16} color="#d1d5db" />} onClick={() => setScale(s => Math.min(3.0, s + 0.2))} />
            <Divider type="vertical" style={{ background: '#525659', height: 20, margin: 'auto 4px' }} />
            <Button type="text" size="small" icon={isFullscreen ? <Minimize size={16} color="#d1d5db" /> : <Maximize size={16} color="#d1d5db" />} onClick={toggleFullscreen} />
          </div>
        </div>

        <Layout>
          {/* Sidebar */}
          <Sider
            width={240}
            collapsed={!showSidebar}
            collapsedWidth={0}
            style={{
              background: '#323639',
              borderRight: '1px solid #202224',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Book Profile Header in Sidebar */}
            <div style={{
              padding: '24px 16px',
              borderBottom: '1px solid #202224',
              background: '#2b2e31',
              textAlign: 'center'
            }}>
              <div style={{ height: 160, marginBottom: 16 }}>
                <BookCoverPlaceholder
                  title={pdfState.book.title}
                  author={pdfState.book.author?.nama}
                  imageUrl={pdfState.book.cover_url}
                  size="small"
                />
              </div>
              <div style={{ padding: '0 8px' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                  {pdfState.book.title}
                </div>
                <div style={{ color: '#9ca3af', fontSize: 11 }}>
                  {pdfState.book.author?.nama || 'Rizquna Author'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }} className="custom-scrollbar">
              {Array.from({ length: Math.min(numPages, pdfState.total_pages) }, (_, i) => i + 1).map(page => {
                const isLocked = !pdfState.has_full_access && page > pdfState.preview_pages;
                const isActive = page === currentPage;
                return (
                  <div
                    key={page}
                    onClick={() => goToPage(page)}
                    style={{
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: isActive ? 'rgba(0,139,148,0.15)' : 'transparent',
                      borderLeft: isActive ? '3px solid #008B94' : '3px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      opacity: isLocked ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{
                      width: 28, height: 36,
                      background: isLocked ? '#424649' : '#525659',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: '#9ca3af',
                      border: '1px solid #525659',
                      flexShrink: 0,
                    }}>
                      {isLocked ? <Lock size={10} color="#666" /> : page}
                    </div>
                    <span style={{ color: isActive ? '#008B94' : '#9ca3af', fontSize: 12 }}>
                      {isLocked ? '🔒 ' : ''}Halaman {page}
                    </span>
                  </div>
                );
              })}
              {/* Locked pages indicator */}
              {!pdfState.has_full_access && numPages < pdfState.total_pages && (
                <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #424649', marginTop: 8 }}>
                  <Lock size={14} color="#6b7280" />
                  <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>
                    +{pdfState.total_pages - numPages} halaman terkunci
                  </div>
                </div>
              )}
            </div>
          </Sider>

          {/* Viewport */}
          <Content
            id="pdf-scroll-container"
            ref={scrollContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#525659',
              padding: '24px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: toolMode === 'pan' ? 'grab' : 'auto'
            }}
            className="custom-scrollbar"
          >
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Spin size="large" style={{ margin: 100 }} />}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
                <div
                  key={page}
                  id={`pdf-page-${page}`}
                  ref={el => { pageRefs.current[page] = el; }}
                  style={{ marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', background: '#fff' }}
                >
                  <Page
                    pageNumber={page}
                    scale={scale}
                    rotate={rotation}
                    renderTextLayer={toolMode === 'select'}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </Document>

            {/* Paywall Card */}
            {!pdfState.has_full_access && (
              <div
                id="preview-paywall-card"
                ref={el => { pageRefs.current[pdfState.preview_pages + 1] = el; }}
                style={{
                  width: 595 * scale,
                  minHeight: 400,
                  background: '#2b2e31',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: 60,
                  textAlign: 'center',
                  border: '1px solid #424649',
                  marginBottom: 100
                }}
              >
                <div style={{ width: 64, height: 64, background: 'rgba(0,139,148,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <Lock size={32} color="#008B94" />
                </div>
                <Title level={3} style={{ color: '#fff' }}>Halaman Terkunci</Title>
                <Paragraph style={{ color: '#9ca3af', marginBottom: 32 }}>
                  Anda telah mencapai akhir pratinjau ({pdfState.preview_pages} halaman).
                  Beli buku ini untuk membuka seluruh {pdfState.total_pages} halaman dan akses fitur lengkap.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingBag size={18} />}
                  onClick={() => navigate(`/katalog/${pdfState.book.slug}`)}
                  style={{ height: 50, padding: '0 40px', fontWeight: 600 }}
                >
                  Beli Full Akses — Rp {pdfState.book.price.toLocaleString('id-ID')}
                </Button>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 12px; height: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #323639; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #525659; border: 3px solid #323639; border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </ConfigProvider>
  );
};

export default PdfReaderPage;

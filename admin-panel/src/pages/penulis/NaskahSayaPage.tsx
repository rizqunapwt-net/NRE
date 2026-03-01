import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
    Row, Col, Card, Typography, Button, Input, Select, 
    Tag, Space, Spin, Tabs, Empty, Progress 
} from 'antd';
import { 
    Search, Plus, Book, Clock, Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import BookCoverPlaceholder from '../landing/components/BookCoverPlaceholder';

const { Title, Text, Paragraph } = Typography;

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type ManuscriptItem = {
    id: number;
    title: string;
    slug: string;
    genre: string | null;
    synopsis: string | null;
    category?: string;
    cover_image?: string;
    status: string;
    status_label: string;
    status_color: string;
    current_stage?: string;
    progress_percentage?: number;
    submitted_at?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
};

type StatusOption = {
    value: string;
    label: string;
    color: string;
    count?: number;
};

type CategoryOption = {
    value: string;
    label: string;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    status_options: StatusOption[];
    category_options: CategoryOption[];
    status_counts?: Record<string, number>;
};

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { color: string, label: string }> = {
    draft: { color: 'default', label: 'Draft' },
    submitted: { color: 'processing', label: 'Dikirim' },
    review: { color: 'purple', label: 'Review' },
    editing: { color: 'warning', label: 'Editing' },
    layout: { color: 'magenta', label: 'Layout' },
    isbn: { color: 'error', label: 'Proses ISBN' },
    printing: { color: 'cyan', label: 'Cetak' },
    published: { color: 'success', label: 'Terbit' },
    rejected: { color: 'error', label: 'Ditolak' },
};

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

const formatRelativeTime = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} m lalu`;
    if (diffHours < 24) return `${diffHours} j lalu`;
    if (diffDays < 7) return `${diffDays} h lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────

const NaskahSayaPage: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [items, setItems] = useState<ManuscriptItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    // Pagination
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        status_options: [],
        category_options: [],
        status_counts: {},
    });

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            setSearch(searchInput.trim());
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Load manuscripts
    useEffect(() => {
        let isMounted = true;

        const loadManuscripts = async () => {
            setLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page,
                    per_page: 12,
                };

                if (status !== 'all') params.status = status;
                if (sortBy) params.sort = sortBy;
                if (search) params.search = search;

                const res = await api.get('/user/publishing-requests', { params });
                const payload = res.data?.data?.success ? res.data.data : res.data;

                if (!isMounted) return;

                setItems(payload.data || []);
                setMeta({
                    current_page: payload.meta?.current_page ?? 1,
                    last_page: payload.meta?.last_page ?? 1,
                    per_page: payload.meta?.per_page ?? 12,
                    total: payload.meta?.total ?? 0,
                    status_options: payload.meta?.status_options ?? [],
                    category_options: payload.meta?.category_options ?? [],
                    status_counts: payload.meta?.status_counts ?? {},
                });
            } catch {
                if (!isMounted) return;
                setItems([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadManuscripts();
        return () => { isMounted = false; };
    }, [page, search, status, sortBy]);

    const handleCreateNew = useCallback(() => {
        navigate('/penulis/kirim-naskah');
    }, [navigate]);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Card 
                style={{ 
                    marginBottom: 24, 
                    background: 'linear-gradient(135deg, #1b3764 0%, #112240 100%)',
                    borderRadius: 16,
                    border: 'none'
                }}
                bodyStyle={{ padding: '32px' }}
            >
                <Row align="middle" justify="space-between">
                    <Col xs={24} md={16}>
                        <Title level={2} style={{ color: '#fff', margin: 0, fontFamily: "'DM Serif Display', serif" }}>
                            Karya Naskah Saya
                        </Title>
                        <Paragraph style={{ color: '#9ca3af', fontSize: 16, marginTop: 8, marginBottom: 0 }}>
                            Kelola, pantau progres, dan ajukan naskah baru Anda untuk diterbitkan.
                        </Paragraph>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<Plus size={18} />}
                            onClick={handleCreateNew}
                            style={{ background: '#3b82f6', borderRadius: 8, fontWeight: 600, border: 'none' }}
                        >
                            Kirim Naskah Baru
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Filter Section */}
            <Card 
                bordered={false} 
                style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                bodyStyle={{ padding: '16px 24px' }}
            >
                <Row gutter={[16, 16]} align="middle" justify="space-between">
                    <Col xs={24} md={16}>
                        <Tabs 
                            activeKey={status} 
                            onChange={(key) => { setStatus(key); setPage(1); }}
                            items={[
                                { key: 'all', label: `Semua (${meta.total})` },
                                { key: 'draft', label: 'Draft' },
                                { key: 'submitted', label: 'Dalam Proses' },
                                { key: 'published', label: 'Sudah Terbit' },
                            ]}
                            style={{ marginBottom: -16 }}
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Input 
                                placeholder="Cari judul naskah..." 
                                prefix={<Search size={16} color="#9ca3af" />}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{ borderRadius: 8, width: 220 }}
                            />
                            <Select 
                                value={sortBy} 
                                onChange={setSortBy}
                                style={{ width: 140 }}
                                options={[
                                    { value: 'newest', label: 'Terbaru' },
                                    { value: 'oldest', label: 'Terlama' },
                                    { value: 'title_asc', label: 'Judul A-Z' },
                                ]}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Content List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" tip="Memuat daftar naskah..." />
                </div>
            ) : items.length === 0 ? (
                <Card bordered={false} style={{ borderRadius: 16, textAlign: 'center', padding: '60px 0' }}>
                    <Empty 
                        description={<Text style={{ color: '#6b7280', fontSize: 16 }}>Belum ada naskah yang ditemukan.</Text>}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={handleCreateNew} style={{ marginTop: 16 }}>
                            Mulai Menulis
                        </Button>
                    </Empty>
                </Card>
            ) : (
                <>
                    <Row gutter={[24, 24]}>
                        {items.map(item => {
                            const statusInfo = STATUS_MAP[item.status] || { color: 'default', label: item.status };
                            return (
                                <Col xs={24} sm={12} lg={8} key={item.id}>
                                    <Card 
                                        hoverable 
                                        bordered={false}
                                        style={{ 
                                            borderRadius: 16, 
                                            height: '100%', 
                                            display: 'flex', 
                                            flexDirection: 'column',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                            transition: 'transform 0.3s, box-shadow 0.3s'
                                        }}
                                        bodyStyle={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}
                                        onClick={() => navigate(`/penulis/kirim-naskah?id=${item.id}`)}
                                    >
                                        <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                                            <div style={{ width: 80, height: 110, flexShrink: 0 }}>
                                                <BookCoverPlaceholder 
                                                    title={item.title} 
                                                    size="small" 
                                                    imageUrl={item.cover_image}
                                                />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Tag color={statusInfo.color} style={{ borderRadius: 4, marginBottom: 8, fontWeight: 600 }}>
                                                    {statusInfo.label.toUpperCase()}
                                                </Tag>
                                                <Title level={5} style={{ margin: '0 0 4px', fontSize: 16, lineHeight: 1.3 }} ellipsis={{ rows: 2 }}>
                                                    {item.title}
                                                </Title>
                                                <Text type="secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Book size={14} /> {item.genre || 'Tanpa Kategori'}
                                                </Text>
                                            </div>
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 16 }}>
                                                {item.synopsis || 'Sinopsis belum ditambahkan.'}
                                            </Paragraph>
                                        </div>

                                        <div style={{ 
                                            background: '#f8f9fa', 
                                            padding: '12px 16px', 
                                            borderRadius: 8,
                                            marginTop: 'auto'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>
                                                    <Activity size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                                                    {item.current_stage || 'Menunggu Proses'}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                                    <Clock size={12} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                                                    {formatRelativeTime(item.updated_at)}
                                                </Text>
                                            </div>
                                            {item.progress_percentage !== undefined && item.progress_percentage > 0 && (
                                                <Progress 
                                                    percent={item.progress_percentage} 
                                                    size="small" 
                                                    strokeColor="#3b82f6" 
                                                    trailColor="#e5e7eb"
                                                    status="active"
                                                />
                                            )}
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    {/* Pagination */}
                    {meta.last_page > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
                            <Space size="middle">
                                <Button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                                    disabled={page === 1}
                                    icon={<ChevronLeft size={16} />}
                                >
                                    Sebelumnya
                                </Button>
                                <Text strong style={{ color: '#4b5563' }}>
                                    Halaman {page} dari {meta.last_page}
                                </Text>
                                <Button 
                                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} 
                                    disabled={page === meta.last_page}
                                >
                                    Berikutnya <ChevronRight size={16} />
                                </Button>
                            </Space>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NaskahSayaPage;

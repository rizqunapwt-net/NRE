import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Typography, message, Select, Input, Space, Statistic, Row, Col, Drawer, Descriptions, Progress, Timeline, Form, Popconfirm, Alert, Tabs, DatePicker, notification } from 'antd';
import { ReloadOutlined, EyeOutlined, FileTextOutlined, PrinterOutlined, BookOutlined, InboxOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, SearchOutlined, DownloadOutlined, UndoOutlined } from '@ant-design/icons';
import api from '../../api';
import { TableSkeleton } from '../../components/SkeletonLoaders';
import { API_V1_BASE } from '../../api/base';
import dayjs from 'dayjs';
import BookFormModal from './components/BookFormModal';

const { Title, Text } = Typography;

interface BookRecord {
    id: number;
    type: string;
    title: string;
    isbn?: string;
    tracking_code?: string;
    author?: { id: number; name: string };
    author_name?: string;
    description?: string;
    price?: number;
    stock?: number;
    status: string;
    status_label?: string;
    progress?: number;
    cover_path?: string;
    cover_file_path?: string;
    gdrive_link?: string;
    surat_status?: string;
    revision_notes?: string;
    published_year?: number;
    page_count?: number;
    size?: string;
    publisher?: string;
    publisher_city?: string;
    pdf_full_path?: string;
    cover_url?: string;
    is_digital?: boolean;
    files?: { id: number; file_type: string; file_path: string; original_name: string; created_at?: string }[];
    status_logs?: { id: number; from_status: string; to_status: string; changed_by?: string; notes?: string; created_at?: string }[];
    created_at?: string;
    updated_at?: string;
}

// Combined statuses from both publishing and printing
const ALL_STATUSES = [
    { value: 'draft', label: 'Draft', color: '#8c8c8c' },
    { value: 'incoming', label: 'Naskah Masuk', color: '#008B94' },
    { value: 'review', label: 'Review', color: '#fa8c16' },
    { value: 'editorial', label: 'Editing & Layout', color: '#008B94' },
    { value: 'covering', label: 'Desain Cover', color: '#722ed1' },
    { value: 'approving', label: 'Approval', color: '#eb2f96' },
    { value: 'surat_pernyataan', label: 'Surat Pernyataan', color: '#13c2c2' },
    { value: 'isbn_process', label: 'Proses ISBN', color: '#f5222d' },
    { value: 'production', label: 'Cetak', color: '#2f54eb' },
    { value: 'warehouse', label: 'Stok Gudang', color: '#52c41a' },
    { value: 'published', label: 'Terbit & Jual', color: '#52c41a' },
    { value: 'done', label: 'Selesai', color: '#52c41a' },
    { value: 'revision', label: 'Revisi', color: '#ff4d4f' },
    { value: 'archived', label: 'Arsip Lama', color: '#8c8c8c' },
];

const statusInfo = (val: string) => ALL_STATUSES.find(s => s.value === val) || { label: val, color: '#8c8c8c' };

const TYPE_MAP: Record<string, { label: string; color: string }> = {
    publishing: { label: 'Penerbitan', color: 'blue' },
    printing: { label: 'Pencetakan', color: 'orange' },
};

const ManajemenBukuPage: React.FC = () => {
    const [data, setData] = useState<BookRecord[]>([]);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
    const [dateRange, setDateRange] = useState<[string, string] | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [publishingCount, setPublishingCount] = useState(0);
    const [printingCount, setPrintingCount] = useState(0);
    const [totalStock, setTotalStock] = useState(0);
    const [detailDrawer, setDetailDrawer] = useState(false);
    const [detailData, setDetailData] = useState<BookRecord | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
    const [form] = Form.useForm();
    const searchInputRef = React.useRef<any>(null);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Shortcut 'k' or '/' to focus search
            if ((e.key === 'k' || e.key === '/') && 
                document.activeElement?.tagName !== 'INPUT' && 
                document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                page,
                per_page: perPage,
            };
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category_id = categoryFilter;
            if (dateRange) {
                params.start_date = dateRange[0];
                params.end_date = dateRange[1];
            }
            const res = await api.get('/books', { params });
            const list = res.data.data || res.data || [];
            setData(Array.isArray(list) ? list : []);
            setTotal(res.data.total || (Array.isArray(list) ? list.length : 0));
            
            // Update stats if available in meta or data root
            const meta = res.data.meta || {};
            if (meta.total !== undefined) setTotal(meta.total);
            if (res.data.publishing_count !== undefined) {
                setPublishingCount(res.data.publishing_count);
                setPrintingCount(res.data.printing_count);
                setTotalStock(res.data.total_stock);
            }
        } catch {
            message.error('Gagal memuat data buku.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/public/categories');
            setCategories(res.data.data || []);
        } catch { /* ignore */ }
    };

    useEffect(() => { 
        fetchData(); 
        if (categories.length === 0) fetchCategories();
    }, [page, perPage, typeFilter, statusFilter, categoryFilter, dateRange, search]);

    const loadDetail = async (id: number) => {
        try {
            const res = await api.get(`/books/${id}`);
            setDetailData(res.data.data || res.data);
        } catch { /* ignore */ }
    };

    const openDetail = async (book: BookRecord) => {
        setDetailDrawer(true);
        loadDetail(book.id);
    };

    const openAdd = () => {
        setEditingBook(null);
        form.resetFields();
        setEditModalOpen(true);
    };

    const openEdit = (book: BookRecord) => {
        setEditingBook(book);
        form.setFieldsValue({
            title: book.title,
            author_name: book.author?.name || book.author_name || '',
            author_email: '',
            author_phone: '',
            isbn: book.isbn || '',
            price: book.price || 0,
            stock: book.stock || 0,
            page_count: book.page_count || '',
            size: book.size || '',
            description: book.description || '',
            published_year: book.published_year || '',
            publisher: book.publisher || '',
            publisher_city: book.publisher_city || '',
            cover_path: book.cover_path || '',
            pdf_full_path: book.pdf_full_path || '',
        });
        setEditModalOpen(true);
    };

    const handleDelete = async (book: BookRecord) => {
        try {
            await api.delete(`/books/${book.id}`);
            
            // Notification with Undo
            const key = `delete_${book.id}`;
            notification.success({
                key,
                message: 'Buku Berhasil Dihapus',
                description: `Buku "${book.title}" telah dihapus.`,
                duration: 5,
                btn: (
                    <Button 
                        type="primary" 
                        size="small" 
                        icon={<UndoOutlined />}
                        onClick={async () => {
                            try {
                                await api.post(`/books/${book.id}/restore`);
                                message.success(`Buku "${book.title}" dipulihkan`);
                                fetchData();
                                notification.destroy(key);
                            } catch {
                                message.error('Gagal memulihkan buku');
                            }
                        }}
                    >
                        Batalkan (Undo)
                    </Button>
                ),
            });
            
            fetchData();
        } catch {
            message.error(`Gagal menghapus buku "${book.title}"`);
        }
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;
        
        const headers = ['ID', 'Tracking Code', 'Title', 'Author', 'ISBN', 'Status', 'Stock', 'Price', 'Type'];
        const csvRows = [
            headers.join(','),
            ...data.map(r => [
                r.id,
                `"${r.tracking_code || ''}"`,
                `"${r.title.replace(/"/g, '""')}"`,
                `"${getAuthorName(r).replace(/"/g, '""')}"`,
                `"${r.isbn || ''}"`,
                `"${r.status_label || r.status}"`,
                r.stock || 0,
                r.price || 0,
                r.type || 'publishing'
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `katalog_buku_${dayjs().format('YYYY-MM-DD')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getAuthorName = (r: BookRecord) => r.author?.name || r.author_name || '-';

    const columns = [
        {
            title: 'Kode', dataIndex: 'tracking_code', key: 'code', width: 120,
            render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
        },
        {
            title: 'Judul', dataIndex: 'title', key: 'title',
            sorter: (a: BookRecord, b: BookRecord) => a.title.localeCompare(b.title),
            render: (v: string, r: BookRecord) => (
                <a onClick={() => openDetail(r)} style={{ fontWeight: 500 }}>{v}</a>
            ),
        },
        {
            title: 'Penulis', key: 'author', width: 160,
            render: (_: unknown, r: BookRecord) => <Text>{getAuthorName(r)}</Text>,
        },
        {
            title: 'ISBN', dataIndex: 'isbn', key: 'isbn', width: 140,
            render: (v: string) => v || <Text type="secondary">-</Text>,
        },
        {
            title: 'Sumber', key: 'type', width: 110,
            render: (_: unknown, r: BookRecord) => {
                const t = TYPE_MAP[r.type] || TYPE_MAP.publishing;
                return <Tag color={t.color}>{t.label}</Tag>;
            },
        },
        {
            title: 'Status', key: 'status', width: 150,
            render: (_: unknown, r: BookRecord) => {
                const si = statusInfo(r.status);
                return <Tag color={si.color}>{r.status_label || si.label}</Tag>;
            },
        },
        {
            title: 'Stok', dataIndex: 'stock', key: 'stock', width: 70,
            render: (v: number) => v ?? 0,
        },
        {
            title: 'Progress', key: 'progress', width: 110,
            render: (_: unknown, r: BookRecord) => (
                <Progress percent={r.progress || 0} size="small" strokeColor={r.progress === 100 ? '#52c41a' : '#008B94'} />
            ),
        },
        {
            title: 'Aksi', key: 'actions', width: 120,
            render: (_: unknown, r: BookRecord) => (
                <Space size="small">
                    <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                    <Popconfirm title={`Hapus buku "${r.title}"?`} onConfirm={() => handleDelete(r)} okText="Hapus" cancelText="Batal" okButtonProps={{ danger: true }}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filtered = data;

    // Use state stats if populated, fallback to current page stats
    const totalCount = total > 0 ? total : total;
    const pubCount = publishingCount > 0 ? publishingCount : data.filter(b => (b.type || 'publishing') === 'publishing').length;
    const printCount = printingCount > 0 ? printingCount : data.filter(b => b.type === 'printing').length;
    const tStock = totalStock > 0 ? totalStock : data.reduce((sum, b) => sum + (b.stock || 0), 0);

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, background: 'linear-gradient(90deg, #006B73 0%, #008B94 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Manajemen Katalog Buku
                    </Title>
                    <Space size="middle">
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExportCSV}
                            disabled={data.length === 0}
                            style={{ borderRadius: 10 }}
                        >
                            Export CSV
                        </Button>
                        <Button
                            className="hover-glow"
                            icon={<ReloadOutlined />}
                            onClick={fetchData}
                            style={{ borderRadius: 10, fontWeight: 600 }}
                        >
                            Refresh
                        </Button>
                        <Button
                            type="primary"
                            className="primary-gradient hover-glow"
                            icon={<PlusOutlined />}
                            onClick={openAdd}
                            style={{ height: 40, padding: '0 24px', borderRadius: 10, border: 0, fontWeight: 700, boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)' }}
                        >
                            Tambah Buku
                        </Button>
                    </Space>
                </div>

                <Space wrap align="center" style={{ width: '100%', justifyContent: 'flex-start', background: '#f8fafc', padding: '12px', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
                        <Select placeholder="Semua Sumber" allowClear style={{ width: 160 }}
                            className="hover-glow"
                            options={[
                                { label: '📚 Penerbitan', value: 'publishing' },
                                { label: '🖨️ Pencetakan', value: 'printing' },
                            ]}
                            onChange={v => { setTypeFilter(v); setPage(1); }} />
                        <Select placeholder="Semua Status" allowClear style={{ width: 180 }}
                            className="hover-glow"
                            options={ALL_STATUSES.map(s => ({ label: s.label, value: s.value }))}
                            onChange={v => { setStatusFilter(v); setPage(1); }} />
                        <Select placeholder="Semua Kategori" allowClear style={{ width: 160 }}
                            className="hover-glow"
                            options={categories.map(c => ({ label: c.name, value: c.id }))}
                            onChange={v => { setCategoryFilter(v); setPage(1); }} />
                        <DatePicker.RangePicker 
                            style={{ width: 240 }}
                            className="hover-glow"
                            onChange={(dates) => {
                                if (dates) {
                                    setDateRange([dates[0]!.format('YYYY-MM-DD'), dates[1]!.format('YYYY-MM-DD')]);
                                } else {
                                    setDateRange(undefined);
                                }
                                setPage(1);
                            }}
                        />
                    </div>
                    <div style={{ height: 24, width: 1, background: '#e2e8f0', margin: '0 8px' }}></div>
                    <Input
                        ref={searchInputRef}
                        placeholder="Cari judul, penulis, atau ISBN... (Tekan 'k' untuk fokus)"
                        allowClear
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        onPressEnter={e => { setSearch((e.target as any).value); setPage(1); }}
                        style={{ width: 320 }} 
                        suffix={
                            <Tag color="default" style={{ margin: 0, opacity: 0.6 }}>K</Tag>
                        }
                    />
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Total Buku</span>}
                            value={totalCount}
                            prefix={<div style={{ background: 'rgba(0, 139, 148, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><BookOutlined style={{ color: '#008B94' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#1e293b' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Penerbitan</span>}
                            value={pubCount}
                            prefix={<div style={{ background: 'rgba(0, 139, 148, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><FileTextOutlined style={{ color: '#008B94' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#008B94' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Pencetakan</span>}
                            value={printCount}
                            prefix={<div style={{ background: 'rgba(250, 140, 22, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><PrinterOutlined style={{ color: '#fa8c16' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#fa8c16' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Total Stok</span>}
                            value={tStock}
                            prefix={<div style={{ background: 'rgba(82, 196, 26, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><InboxOutlined style={{ color: '#52c41a' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#52c41a' }} />
                    </Card>
                </Col>
            </Row>

            {loading && data.length === 0 ? (
                <TableSkeleton rows={10} />
            ) : (
                <Card className="glass-card" style={{ borderRadius: 16, border: 0, padding: 0, overflow: 'hidden' }}>
                    <Table
                        columns={columns}
                        dataSource={filtered}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize: perPage,
                            total: totalCount,
                            onChange: (p, s) => { setPage(p); setPerPage(s); },
                            showTotal: (t) => <span style={{ fontWeight: 700, color: '#64748b' }}>Total {t} buku terdaftar</span>,
                            position: ['bottomRight']
                        }}
                        scroll={{ x: 1000 }}
                        rowClassName="hover-row"
                        onRow={(record) => ({
                            onClick: () => openDetail(record),
                            style: { cursor: 'pointer' }
                        })}
                    />
                </Card>
            )}

            {/* Improved Detail Drawer (read-only) */}
            <Drawer title={detailData?.title || 'Detail Buku'} open={detailDrawer}
                onClose={() => { setDetailDrawer(false); setDetailData(null); }} width={600}>
                {detailData && (
                    <div className="fade-in">
                        <Card size="small" style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <img 
                                        src={detailData.cover_url || (detailData.cover_path ? `${API_V1_BASE}/../storage/${detailData.cover_path}` : 'https://placehold.co/150x200?text=No+Cover')} 
                                        alt="Cover" 
                                        style={{ width: '100%', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} 
                                    />
                                </Col>
                                <Col span={16}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <Space direction="vertical" size={0}>
                                            <Tag color={statusInfo(detailData.status).color} style={{ fontSize: 13, marginBottom: 4 }}>
                                                {detailData.status_label || statusInfo(detailData.status).label}
                                            </Tag>
                                            <Tag color={TYPE_MAP[detailData.type]?.color || 'blue'}>
                                                {TYPE_MAP[detailData.type]?.label || 'Penerbitan'}
                                            </Tag>
                                        </Space>
                                        <Text type="secondary" copyable>{detailData.tracking_code}</Text>
                                    </div>
                                    <Title level={4} style={{ margin: '4px 0 0', fontWeight: 700 }}>{detailData.title}</Title>
                                    <Text type="secondary" style={{ fontSize: 14 }}>Oleh: {detailData.author?.name || detailData.author_name || '-'}</Text>
                                    <div style={{ marginTop: 16 }}>
                                        <Text strong>Progress Naskah:</Text>
                                        <Progress percent={detailData.progress || 0} strokeColor={detailData.progress === 100 ? '#52c41a' : '#008B94'} size="small" />
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        <Tabs defaultActiveKey="main" items={[
                            {
                                key: 'main',
                                label: 'Informasi',
                                children: (
                                    <Descriptions column={1} bordered size="small" style={{ borderRadius: 8, overflow: 'hidden' }}>
                                        <Descriptions.Item label="ISBN">{detailData.isbn || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Halaman">{detailData.page_count || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Ukuran">{detailData.size || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Tahun Terbit">{detailData.published_year || '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Harga">{detailData.price ? `Rp ${Number(detailData.price).toLocaleString('id-ID')}` : '-'}</Descriptions.Item>
                                        <Descriptions.Item label="Stok">{detailData.stock ?? 0}</Descriptions.Item>
                                        <Descriptions.Item label="Format">{detailData.is_digital ? 'Digital (E-Book)' : 'Fisik'}</Descriptions.Item>
                                    </Descriptions>
                                )
                            },
                            {
                                key: 'market',
                                label: 'Toko Online',
                                children: (
                                    <div style={{ minHeight: 100 }}>
                                        {(detailData as any).marketplace_links && (detailData as any).marketplace_links.length > 0 ? (
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {(detailData as any).marketplace_links.map((link: any, idx: number) => (
                                                    <a key={idx} href={link.product_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                                        <Space>
                                                            <LinkOutlined />
                                                            <Text strong>{link.marketplace_name || 'Toko'}</Text>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>{link.product_url}</Text>
                                                        </Space>
                                                    </a>
                                                ))}
                                            </Space>
                                        ) : (
                                            <Alert message="Belum ada tautan marketplace" type="info" />
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: 'logs',
                                label: 'Riwayat',
                                children: (
                                    <div style={{ padding: '8px 0' }}>
                                        {detailData.status_logs && detailData.status_logs.length > 0 ? (
                                            <Timeline items={detailData.status_logs.map((log) => ({
                                                color: statusInfo(log.to_status).color,
                                                children: (
                                                    <div style={{ paddingBottom: 8 }}>
                                                        <Text strong>{statusInfo(log.to_status).label}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {log.changed_by || 'System'} · {log.created_at ? dayjs(log.created_at).format('DD MMM YYYY HH:mm') : ''}
                                                        </Text>
                                                        {log.notes && <><br /><Text style={{ fontSize: 12 }}>{log.notes}</Text></>}
                                                    </div>
                                                ),
                                            }))} />
                                        ) : <Text italic>Belum ada riwayat status</Text>}
                                    </div>
                                )
                            }
                        ]} />
                    </div>
                )}
            </Drawer>

            <BookFormModal
                open={editModalOpen}
                editingBook={editingBook}
                onCancel={() => setEditModalOpen(false)}
                onSuccess={() => {
                    setEditModalOpen(false);
                    fetchData();
                }}
            />
        </div>
    );
};

export default ManajemenBukuPage;

import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Typography, message, Select, Input, Space, Statistic, Row, Col, Drawer, Descriptions, Progress, Timeline, Modal, Form, InputNumber, Popconfirm, Divider } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, FileTextOutlined, PrinterOutlined, BookOutlined, InboxOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

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
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [detailDrawer, setDetailDrawer] = useState(false);
    const [detailData, setDetailData] = useState<BookRecord | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<BookRecord | null>(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/books', { params });
            const list = res.data.data || res.data || [];
            setData(Array.isArray(list) ? list : []);
        } catch {
            message.error('Gagal memuat data buku.');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [typeFilter, statusFilter]);

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

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingBook) {
                try {
                    await api.patch(`/books/${editingBook.id}`, values);
                    message.success(`Buku "${values.title}" berhasil diperbarui`);
                } catch {
                    setData(prev => prev.map(b => b.id === editingBook.id ? { ...b, ...values, author_name: values.author_name } : b));
                    message.success(`Buku "${values.title}" diperbarui (lokal)`);
                }
            } else {
                try {
                    await api.post('/books', values);
                    message.success(`Buku "${values.title}" berhasil ditambahkan`);
                } catch {
                    setData(prev => [...prev, { id: Date.now(), type: 'publishing', status: 'draft', ...values, author: { id: 0, name: values.author_name } }]);
                    message.success(`Buku "${values.title}" ditambahkan (lokal)`);
                }
            }
            setEditModalOpen(false);
            form.resetFields();
            fetchData();
        } catch { /* validation failed */ }
    };

    const handleDelete = async (book: BookRecord) => {
        try {
            await api.delete(`/books/${book.id}`);
            message.success(`Buku "${book.title}" dihapus`);
            fetchData();
        } catch {
            setData(prev => prev.filter(b => b.id !== book.id));
            message.success(`Buku "${book.title}" dihapus (lokal)`);
        }
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

    const filtered = data.filter(b => {
        if (!search) return true;
        const s = search.toLowerCase();
        return b.title.toLowerCase().includes(s) ||
            getAuthorName(b).toLowerCase().includes(s) ||
            (b.isbn || '').toLowerCase().includes(s) ||
            (b.tracking_code || '').toLowerCase().includes(s);
    });

    const total = data.length;
    const publishingCount = data.filter(b => (b.type || 'publishing') === 'publishing').length;
    const printingCount = data.filter(b => b.type === 'printing').length;
    const totalStock = data.reduce((sum, b) => sum + (b.stock || 0), 0);

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 24, padding: '16px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800, background: 'linear-gradient(90deg, #006B73 0%, #008B94 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Manajemen Katalog Buku
                    </Title>
                    <Space size="middle">
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
                            onChange={v => setTypeFilter(v)} />
                        <Select placeholder="Semua Status" allowClear style={{ width: 180 }}
                            className="hover-glow"
                            options={ALL_STATUSES.map(s => ({ label: s.label, value: s.value }))}
                            onChange={v => setStatusFilter(v)} />
                    </div>
                    <div style={{ height: 24, width: 1, background: '#e2e8f0', margin: '0 8px' }}></div>
                    <Input placeholder="Cari judul, penulis, atau ISBN..."
                        prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: 320, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Total Buku</span>}
                            value={total}
                            prefix={<div style={{ background: 'rgba(0, 139, 148, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><BookOutlined style={{ color: '#008B94' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#1e293b' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Penerbitan</span>}
                            value={publishingCount}
                            prefix={<div style={{ background: 'rgba(0, 139, 148, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><FileTextOutlined style={{ color: '#008B94' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#008B94' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Pencetakan</span>}
                            value={printingCount}
                            prefix={<div style={{ background: 'rgba(250, 140, 22, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><PrinterOutlined style={{ color: '#fa8c16' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#fa8c16' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" className="glass-card hover-glow" style={{ borderRadius: 16, border: 0 }}>
                        <Statistic title={<span style={{ fontWeight: 600, color: '#64748b' }}>Total Stok</span>}
                            value={totalStock}
                            prefix={<div style={{ background: 'rgba(82, 196, 26, 0.1)', padding: 8, borderRadius: 8, marginRight: 8 }}><InboxOutlined style={{ color: '#52c41a' }} /></div>}
                            valueStyle={{ fontWeight: 800, color: '#52c41a' }} />
                    </Card>
                </Col>
            </Row>

            <Card className="glass-card" style={{ borderRadius: 16, border: 0, padding: 0, overflow: 'hidden' }}>
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
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

            {/* Detail Drawer (read-only) */}
            <Drawer title={detailData?.title || 'Detail Buku'} open={detailDrawer}
                onClose={() => { setDetailDrawer(false); setDetailData(null); }} width={520}>
                {detailData && (
                    <div>
                        <Card size="small" style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Space>
                                    <Tag color={statusInfo(detailData.status).color} style={{ fontSize: 14, padding: '4px 12px' }}>
                                        {detailData.status_label || statusInfo(detailData.status).label}
                                    </Tag>
                                    <Tag color={TYPE_MAP[detailData.type]?.color || 'blue'}>
                                        {TYPE_MAP[detailData.type]?.label || 'Penerbitan'}
                                    </Tag>
                                </Space>
                                <Text type="secondary">{detailData.tracking_code}</Text>
                            </div>
                            <Progress percent={detailData.progress || 0} strokeColor={detailData.progress === 100 ? '#52c41a' : '#008B94'} />
                        </Card>

                        <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Judul">{detailData.title}</Descriptions.Item>
                            <Descriptions.Item label="Penulis">{detailData.author?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="ISBN">{detailData.isbn || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Harga">{detailData.price ? `Rp ${Number(detailData.price).toLocaleString('id-ID')}` : '-'}</Descriptions.Item>
                            <Descriptions.Item label="Stok">{detailData.stock ?? 0}</Descriptions.Item>
                            <Descriptions.Item label="Sumber">{TYPE_MAP[detailData.type]?.label || 'Penerbitan'}</Descriptions.Item>
                            {detailData.page_count && <Descriptions.Item label="Halaman">{detailData.page_count}</Descriptions.Item>}
                            {detailData.size && <Descriptions.Item label="Ukuran">{detailData.size}</Descriptions.Item>}
                        </Descriptions>

                        {detailData.status_logs && detailData.status_logs.length > 0 && (
                            <Card title="Riwayat Status" size="small">
                                <Timeline items={detailData.status_logs.map((log) => ({
                                    color: statusInfo(log.to_status).color,
                                    children: (
                                        <div>
                                            <Text strong>{statusInfo(log.from_status).label || 'Baru'}</Text>
                                            <Text> → </Text>
                                            <Text strong>{statusInfo(log.to_status).label}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                {log.changed_by || 'System'} · {log.created_at ? dayjs(log.created_at).format('DD MMM YYYY HH:mm') : ''}
                                            </Text>
                                            {log.notes && <><br /><Text style={{ fontSize: 12 }}>{log.notes}</Text></>}
                                        </div>
                                    ),
                                }))} />
                            </Card>
                        )}
                    </div>
                )}
            </Drawer>

            {/* Edit/Add Modal */}
            <Modal
                title={editingBook ? `Edit: ${editingBook.title}` : 'Tambah Buku Baru'}
                open={editModalOpen}
                onCancel={() => { setEditModalOpen(false); form.resetFields(); }}
                onOk={handleSave}
                okText="Simpan"
                cancelText="Batal"
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Divider style={{ marginTop: 0 }}>Data Buku</Divider>
                    <Form.Item name="title" label="Judul Buku" rules={[{ required: true, message: 'Judul wajib diisi' }]}>
                        <Input placeholder="Contoh: Metodologi Penelitian Kualitatif" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="isbn" label="ISBN">
                            <Input placeholder="978-xxx-xxx-xxx" />
                        </Form.Item>
                        <Form.Item name="published_year" label="Tahun Terbit">
                            <InputNumber style={{ width: '100%' }} placeholder="2026" />
                        </Form.Item>
                        <Form.Item name="price" label="Harga (Rp)">
                            <InputNumber style={{ width: '100%' }} min={0} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} placeholder="0" />
                        </Form.Item>
                        <Form.Item name="stock" label="Stok">
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                        </Form.Item>
                        <Form.Item name="page_count" label="Jumlah Halaman">
                            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                        </Form.Item>
                        <Form.Item name="size" label="Ukuran">
                            <Input placeholder="Contoh: A5, B5, 15x23 cm" />
                        </Form.Item>
                    </div>
                    <Form.Item name="description" label="Deskripsi / Sinopsis">
                        <Input.TextArea rows={2} placeholder="Deskripsi singkat buku..." />
                    </Form.Item>

                    <Divider>Metadata & File Path (Khusus Admin)</Divider>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="publisher" label="Penerbit">
                            <Input placeholder="Penerbit Rizquna Elfath" />
                        </Form.Item>
                        <Form.Item name="publisher_city" label="Kota Penerbit">
                            <Input placeholder="Cirebon" />
                        </Form.Item>
                    </div>
                    <Form.Item name="cover_path" label="Path Cover (Storage)">
                        <Input placeholder="books/7/cover_7.png" />
                    </Form.Item>
                    <Form.Item name="pdf_full_path" label="Path PDF Full (Storage)">
                        <Input placeholder="books/7/pdf_7.pdf" />
                    </Form.Item>

                    <Divider>Data Penulis</Divider>
                    <Form.Item name="author_name" label="Nama Penulis" rules={[{ required: true, message: 'Nama penulis wajib diisi' }]}>
                        <Input placeholder="Contoh: Dr. Ahmad Dahlan, M.Pd" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="author_email" label="Email Penulis">
                            <Input placeholder="penulis@email.com" />
                        </Form.Item>
                        <Form.Item name="author_phone" label="No. WA Penulis">
                            <Input placeholder="08123456789" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ManajemenBukuPage;

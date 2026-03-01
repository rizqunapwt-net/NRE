import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Card, Typography, Modal, Form, Popconfirm, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, WhatsAppOutlined, MailOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

interface Author {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    bio?: string;
    books_count?: number;
}

const PenulisPage: React.FC = () => {
    const [data, setData] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/authors');
            const list = res.data.data || res.data || [];
            setData(Array.isArray(list) ? list : []);
        } catch {
            message.info('API Penulis belum tersedia — menunggu integrasi backend');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setEditingAuthor(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (author: Author) => {
        setEditingAuthor(author);
        form.setFieldsValue(author);
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (editingAuthor) {
                // Edit existing
                try {
                    await api.put(`/authors/${editingAuthor.id}`, values);
                    message.success(`Data "${values.name}" berhasil diperbarui`);
                } catch {
                    // If API not ready, update locally
                    setData(prev => prev.map(a => a.id === editingAuthor.id ? { ...a, ...values } : a));
                    message.success(`Data "${values.name}" diperbarui (lokal)`);
                }
            } else {
                // Add new
                try {
                    await api.post('/authors', values);
                    message.success(`Penulis "${values.name}" berhasil ditambahkan`);
                } catch {
                    // If API not ready, add locally
                    setData(prev => [...prev, { id: Date.now(), ...values, books_count: 0 }]);
                    message.success(`Penulis "${values.name}" ditambahkan (lokal)`);
                }
            }
            setModalOpen(false);
            form.resetFields();
            fetchData();
        } catch {
            // validation failed
        }
    };

    const handleDelete = async (author: Author) => {
        try {
            await api.delete(`/authors/${author.id}`);
            message.success(`Penulis "${author.name}" dihapus`);
            fetchData();
        } catch {
            setData(prev => prev.filter(a => a.id !== author.id));
            message.success(`Penulis "${author.name}" dihapus (lokal)`);
        }
    };

    const columns = [
        { title: 'Nama', dataIndex: 'name', key: 'name', sorter: (a: Author, b: Author) => a.name.localeCompare(b.name) },
        { title: 'Email', dataIndex: 'email', key: 'email', render: (v: string) => v ? <span><MailOutlined style={{ marginRight: 4, color: '#008B94' }} />{v}</span> : '-' },
        { title: 'No. WA / Telepon', dataIndex: 'phone', key: 'phone', render: (v: string) => v ? <span><WhatsAppOutlined style={{ marginRight: 4, color: '#25d366' }} />{v}</span> : '-' },
        { title: 'Alamat', dataIndex: 'address', key: 'address', ellipsis: true, render: (v: string) => v || '-' },
        { title: 'Jumlah Buku', dataIndex: 'books_count', key: 'books_count', width: 110, align: 'center' as const, render: (v: number) => v ?? 0 },
        {
            title: 'Aksi', key: 'action', width: 120, align: 'center' as const,
            render: (_: unknown, record: Author) => (
                <Space size="small">
                    <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
                    <Popconfirm title={`Hapus penulis "${record.name}"?`} onConfirm={() => handleDelete(record)} okText="Hapus" cancelText="Batal" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filtered = data.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Manajemen Penulis</Title>
                <Space>
                    <Input placeholder="Cari penulis..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 250 }} />
                    <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Tambah Penulis</Button>
                </Space>
            </div>
            <Card>
                <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 15, showSizeChanger: true }} />
            </Card>

            <Modal
                title={editingAuthor ? `Edit Penulis: ${editingAuthor.name}` : 'Tambah Penulis Baru'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                onOk={handleSave}
                okText="Simpan"
                cancelText="Batal"
                width={520}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Nama Lengkap" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
                        <Input placeholder="Contoh: Dr. Ahmad Dahlan" />
                    </Form.Item>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item name="email" label="Email">
                            <Input placeholder="penulis@email.com" />
                        </Form.Item>
                        <Form.Item name="phone" label="No. WA / Telepon">
                            <Input placeholder="08123456789" />
                        </Form.Item>
                    </div>
                    <Form.Item name="address" label="Alamat">
                        <Input placeholder="Kota / Alamat lengkap" />
                    </Form.Item>
                    <Form.Item name="bio" label="Bio Singkat">
                        <Input.TextArea rows={3} placeholder="Dosen di Universitas X, penulis 5 buku bidang Y..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PenulisPage;

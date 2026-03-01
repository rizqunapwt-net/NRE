import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Modal, Form, Input, InputNumber, Switch, Tag, message, Popconfirm, Rate, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

interface Testimonial {
    id: number;
    name: string;
    role: string;
    institution: string;
    content: string;
    avatar_url: string | null;
    rating: number;
    is_featured: boolean;
    is_active: boolean;
    sort_order: number;
}

const KelolaTestimoni: React.FC = () => {
    const [data, setData] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/website/testimonials');
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            message.error('Gagal mengambil data testimoni.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        form.setFieldsValue({ rating: 5, is_active: true, is_featured: true, sort_order: data.length });
        setModalVisible(true);
    };

    const handleEdit = (record: Testimonial) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/website/testimonials/${id}`);
            message.success('Testimoni berhasil dihapus.');
            fetchData();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            message.error('Gagal menghapus testimoni.');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingItem) {
                await api.put(`/admin/website/testimonials/${editingItem.id}`, values);
                message.success('Testimoni berhasil diperbarui.');
            } else {
                await api.post('/admin/website/testimonials', values);
                message.success('Testimoni berhasil ditambahkan.');
            }

            setModalVisible(false);
            fetchData();
        } catch (error) {
            console.error('Error saving testimonial:', error);
            message.error('Gagal menyimpan testimoni.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Info Penulis',
            key: 'user_info',
            render: (_: any, record: Testimonial) => (
                <Space>
                    <Avatar src={record.avatar_url} icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 600 }}>{record.name}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.role}, {record.institution}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 150,
            render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
        },
        {
            title: 'Isi Testimoni',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (text: string) => <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>{text}</Paragraph>
        },
        {
            title: 'Urutan',
            dataIndex: 'sort_order',
            key: 'sort_order',
            width: 80,
        },
        {
            title: 'Fitur',
            dataIndex: 'is_featured',
            key: 'is_featured',
            width: 90,
            render: (featured: boolean) => featured ? <Tag color="gold">FEATURED</Tag> : null
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 90,
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>{active ? 'AKTIF' : 'NON'}</Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 100,
            render: (_: any, record: Testimonial) => (
                <Space size="small">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Hapus Testimoni"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Hapus"
                        cancelText="Batal"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Title level={2}>Kelola Testimoni</Title>
                    <Paragraph>
                        Kelola ulasan dan testimoni dari penulis yang telah menerbitkan karyanya di Rizquna.
                    </Paragraph>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleAdd}
                    style={{ borderRadius: 8 }}
                >
                    Tambah Testimoni
                </Button>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            <Modal
                title={editingItem ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
                width={700}
                okText="Simpan Testimoni"
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 24 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="name"
                            label="Nama Lengkap"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Nama pengirim testimoni" />
                        </Form.Item>

                        <Form.Item
                            name="rating"
                            label="Rating Bintang"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Rate style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="role"
                            label="Peran / Jabatan"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Contoh: Penulis, Dosen, Guru" />
                        </Form.Item>

                        <Form.Item
                            name="institution"
                            label="Institusi / Asal"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Contoh: Universitas Indonesia" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="content"
                        label="Isi Testimoni"
                        rules={[{ required: true, message: 'Harus diisi' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Masukkan ulasan detail..." />
                    </Form.Item>

                    <Form.Item
                        name="avatar_url"
                        label="URL Foto Profil"
                        extra="Link gambar untuk foto profil (opsional)"
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '32px' }}>
                        <Form.Item name="sort_order" label="Urutan Tampil">
                            <InputNumber min={0} />
                        </Form.Item>

                        <Form.Item name="is_featured" label="Tampilkan di Home" valuePropName="checked">
                            <Switch checkedChildren="YA" unCheckedChildren="TIDAK" />
                        </Form.Item>

                        <Form.Item name="is_active" label="Status Aktif" valuePropName="checked">
                            <Switch checkedChildren="AKTIF" unCheckedChildren="NON" />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default KelolaTestimoni;

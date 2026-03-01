import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Modal, Form, Input, Switch, Tag, message, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, GlobalOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface BlogPost {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    featured_image: string;
    is_published: boolean;
    created_at: string;
}

const KelolaBlog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [form] = Form.useForm();

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/blog');
            const items = (res.data?.data || res.data || []).map((item: any) => ({
                id: item.id,
                title: item.title || '',
                slug: item.slug || '',
                excerpt: item.excerpt || '',
                content: item.content || '',
                author: item.author_name || item.author || '',
                category: item.category || '',
                featured_image: item.featured_image || '',
                is_published: item.is_published ?? true,
                created_at: item.created_at || '',
            }));
            setPosts(items);
        } catch (err) {
            console.error('Failed to load blog posts:', err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleAdd = () => {
        setEditingPost(null);
        form.resetFields();
        form.setFieldsValue({
            is_published: true,
            author: 'Admin Rizquna',
            category: 'Berita'
        });
        setModalVisible(true);
    };

    const handleEdit = (record: BlogPost) => {
        setEditingPost(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/blog/${id}`);
            setPosts(posts.filter(p => p.id !== id));
            message.success('Artikel berhasil dihapus.');
        } catch {
            message.error('Gagal menghapus artikel.');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingPost) {
                await api.put(`/admin/blog/${editingPost.id}`, values);
                setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...values } : p));
                message.success('Artikel berhasil diperbarui.');
            } else {
                const res = await api.post('/admin/blog', values);
                const newPost = {
                    ...values,
                    id: res.data?.data?.id || Date.now(),
                    slug: values.title.toLowerCase().replace(/ /g, '-'),
                    created_at: new Date().toISOString()
                };
                setPosts([newPost, ...posts]);
                message.success('Artikel berhasil ditambahkan.');
            }
            setModalVisible(false);
        } catch (error) {
            console.error('Error saving blog post:', error);
            message.error('Gagal menyimpan artikel.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Info Artikel',
            key: 'info',
            render: (_: any, record: BlogPost) => (
                <Space direction="vertical" size={0}>
                    <Typography.Text strong style={{ fontSize: 16 }}>{record.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{record.slug}</Typography.Text>
                </Space>
            )
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'Penulis',
            dataIndex: 'author',
            key: 'author',
            width: 150,
        },
        {
            title: 'Status',
            dataIndex: 'is_published',
            key: 'is_published',
            width: 120,
            render: (published: boolean) => (
                <Tag color={published ? 'green' : 'orange'}>{published ? 'PUBLISHED' : 'DRAFT'}</Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 120,
            render: (_: any, record: BlogPost) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Hapus Artikel"
                        description="Yakin ingin menghapus artikel ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                    <Button type="text" icon={<GlobalOutlined />} onClick={() => window.open(`/blog/${record.slug}`, '_blank')} />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <Title level={2}>Kelola Blog & Artikel</Title>
                    <Paragraph>
                        Kelola konten edukasi, berita, dan tips untuk penulis di website Rizquna Elfath.
                    </Paragraph>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleAdd}
                    style={{ borderRadius: 8 }}
                >
                    Tulis Artikel Baru
                </Button>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={posts}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={<Space><FileTextOutlined /><span>{editingPost ? 'Edit Artikel' : 'Tulis Artikel Baru'}</span></Space>}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
                width={800}
                okText="Simpan Artikel"
                cancelText="Batal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 24 }}
                >
                    <Form.Item
                        name="title"
                        label="Judul Artikel"
                        rules={[{ required: true, message: 'Judul harus diisi' }]}
                    >
                        <Input placeholder="Masukkan judul artikel..." size="large" />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="Kategori"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Select placeholder="Pilih Kategori">
                                <Option value="Berita">Berita</Option>
                                <Option value="Tips Menulis">Tips Menulis</Option>
                                <Option value="Penerbitan">Penerbitan</Option>
                                <Option value="Inspirasi">Inspirasi</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="author"
                            label="Penulis"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Nama penulis..." />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="featured_image"
                        label="URL Gambar Utama"
                        rules={[{ required: true, message: 'Harus diisi' }]}
                    >
                        <Input placeholder="https://..." />
                    </Form.Item>

                    <Form.Item
                        name="excerpt"
                        label="Ringkasan (Excerpt)"
                        rules={[{ required: true, message: 'Ringkasan harus diisi' }]}
                    >
                        <Input.TextArea rows={2} placeholder="Ringkasan singkat untuk tampilan kartu blog..." />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="Konten Artikel (HTML / Text)"
                        rules={[{ required: true, message: 'Konten harus diisi' }]}
                    >
                        <Input.TextArea rows={10} placeholder="Tulis isi artikel lengkap di sini..." />
                    </Form.Item>

                    <Form.Item
                        name="is_published"
                        label="Status Publikasi"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="PUBLISH" unCheckedChildren="DRAFT" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default KelolaBlog;

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Checkbox, Tabs, Space, Button, Divider, Upload, Alert, message, Typography, Progress } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../../api';
import { API_V1_BASE } from '../../../api/base';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Text } = Typography;

interface BookFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    editingBook: any | null;
}

const BookFormModal: React.FC<BookFormModalProps> = ({ open, onCancel, onSuccess, editingBook }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [authors, setAuthors] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [marketplaces, setMarketplaces] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('1');
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (open) {
            fetchInitialData();
            if (editingBook) {
                loadBookDetail(editingBook.id);
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: 'publishing',
                    status: 'draft',
                    price: 0,
                    stock: 0,
                    is_digital: false,
                    is_featured: false,
                });
                setCoverPreview(null);
            }
            setActiveTab('1');
        }
    }, [open, editingBook]);

    const fetchInitialData = async () => {
        try {
            const [authRes, catRes, markRes] = await Promise.all([
                api.get('/authors'),
                api.get('/public/categories'),
                api.get('/marketplaces')
            ]);
            setAuthors(authRes.data.data || []);
            setCategories(catRes.data.data || []);
            setMarketplaces(markRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch initial data', err);
        }
    };

    const loadBookDetail = async (id: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/books/${id}`);
            const book = res.data.data || res.data;
            form.setFieldsValue({
                ...book,
                author_id: book.author?.id,
                published_at: book.published_at ? dayjs(book.published_at) : null,
                marketplace_links: book.marketplace_links || []
            });
            if (book.cover_path) {
                setCoverPreview(book.cover_url || (book.cover_path ? `${API_V1_BASE}/../storage/${book.cover_path}` : null));
            } else {
                setCoverPreview(null);
            }
        } catch (err) {
            message.error('Gagal memuat detail buku');
        } finally {
            setLoading(false);
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingBook) {
            const title = e.target.value;
            const slug = title.toLowerCase().replace(/[^a-z0-8]+/g, '-').replace(/(^-|-$)/g, '');
            form.setFieldsValue({ slug });
        }
    };

    const onFinish = async () => {
        try {
            const values = await form.validateFields();
            
            // Validation: Cover required for published books
            if (values.status === 'published' && !coverPreview) {
                setActiveTab('4');
                message.error('Buku yang diterbitkan (Published) wajib memiliki foto sampul.');
                return;
            }

            setLoading(true);
            
            const payload = {
                ...values,
                published_at: values.published_at ? values.published_at.format('YYYY-MM-DD HH:mm:ss') : null,
            };

            if (editingBook) {
                await api.patch(`/books/${editingBook.id}`, payload);
                message.success('Buku berhasil diperbarui');
            } else {
                await api.post('/books', payload);
                message.success('Buku berhasil ditambahkan');
            }
            onSuccess();
        } catch (err: any) {
            console.error('Save failed', err);
            if (err.response?.data?.errors) {
                const errors = err.response.data.errors;
                Object.keys(errors).forEach(key => {
                    message.error(`${key}: ${errors[key][0]}`);
                });
            } else {
                message.error('Terjadi kesalahan saat menyimpan data');
            }
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: '1',
            label: 'Informasi Dasar',
            children: (
                <div className="fade-in">
                    <Form.Item name="title" label="Judul Utama" rules={[{ required: true, max: 255 }]}>
                        <Input placeholder="Masukkan judul buku" onChange={handleTitleChange} />
                    </Form.Item>
                    <Form.Item name="slug" label="Slug" tooltip="URL ramah SEO, otomatis dari judul" rules={[{ required: true }]}>
                        <Input placeholder="judul-buku-anda" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="category_id" label="Kategori" rules={[{ required: true }]}>
                                <Select placeholder="Pilih Kategori" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={categories.map(c => ({ value: c.id, label: c.name }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="author_id" label="Penulis Utama" rules={[{ required: true }]}>
                                <Select placeholder="Pilih Penulis" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={authors.map(a => ({ value: a.id, label: a.name }))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Deskripsi (Sinopsis)" rules={[{ required: true }]}>
                        <TextArea rows={4} placeholder="Tuliskan deskripsi atau sinopsis buku secara mendetail..." />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="isbn" label="ISBN" tooltip="Format: 10 atau 13 digit" rules={[
                                { pattern: /^(\d{10}|\d{13}|[\d-]{13,17})$/, message: 'Format ISBN tidak valid' }
                            ]}>
                                <Input placeholder="978-xxx-xxx-xxx" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="language" label="Bahasa">
                                <Select options={[{ value: 'id', label: 'Bahasa Indonesia' }, { value: 'en', label: 'English' }]} defaultValue="id" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            key: '2',
            label: 'Detail & Harga',
            children: (
                <div className="fade-in">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="price" label="Harga (Rp)" rules={[{ required: true, type: 'number', min: 0 }]}>
                                <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={v => v!.replace(/\.\s?|/g, '')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="stock" label="Stok Tersedia">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="page_count" label="Jumlah Halaman">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="published_at" label="Tanggal Terbit">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Tipe Katalog" rules={[{ required: true }]}>
                                <Select options={[
                                    { value: 'publishing', label: '📚 Penerbitan' },
                                    { value: 'printing', label: '🖨️ Pencetakan' }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                <Select options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'published', label: 'Published' },
                                    { value: 'archived', label: 'Archived' }
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Space size="large" style={{ marginTop: 8 }}>
                        <Form.Item name="is_digital" valuePropName="checked">
                            <Checkbox>E-Book (Digital)</Checkbox>
                        </Form.Item>
                        <Form.Item name="is_featured" valuePropName="checked">
                            <Checkbox>Tampilkan di Unggulan</Checkbox>
                        </Form.Item>
                    </Space>
                    
                    <Divider plain>Metadata Fisik</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="size" label="Ukuran Buku">
                                <Input placeholder="A5, B5, 14.8 x 21 cm" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="dimension" label="Dimensi (PxLxT)">
                                <Input placeholder="14x21x1.5 cm" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            key: '3',
            label: 'Marketplace',
            children: (
                <div className="fade-in">
                    <Alert message="Tautkan buku ini ke berbagai toko online untuk memudahkan pembelian." type="info" showIcon style={{ marginBottom: 16 }} />
                    <Form.List name="marketplace_links">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'marketplace_id']} rules={[{ required: true, message: 'Pilih Marketplace' }]} style={{ width: 180 }}>
                                            <Select placeholder="Pilih Toko" options={marketplaces.map(m => ({ value: m.id, label: m.name }))} />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'product_url']} rules={[{ required: true, message: 'Wajib URL', type: 'url' }]} style={{ width: 300 }}>
                                            <Input prefix={<LinkOutlined />} placeholder="https://shopee.co.id/..." />
                                        </Form.Item>
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Tambah Link Marketplace
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>
            )
        },
        {
            key: '4',
            label: 'File & Media',
            children: (
                <div className="fade-in">
                    {!editingBook ? (
                        <Alert message="Upload file Cover dan PDF dapat dilakukan setelah buku disimpan (Mode Edit)." type="warning" showIcon style={{ marginBottom: 24 }} />
                    ) : (
                        <Row gutter={24}>
                            <Col span={12}>
                                <Divider plain>Foto Sampul (Cover)</Divider>
                                <div className="upload-container">
                                    <Upload.Dragger
                                        name="cover"
                                        action={`${API_V1_BASE}/admin/books/${editingBook.id}/upload-cover`}
                                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                                        accept="image/jpeg,image/png,image/webp"
                                        showUploadList={false}
                                        className="hover-glow"
                                        style={{ background: '#fafafa', borderRadius: 12 }}
                                        onChange={(info) => {
                                            if (info.file.status === 'uploading') {
                                                setLoading(true);
                                            }
                                            if (info.file.status === 'done') {
                                                setLoading(false);
                                                message.success('Sampul berhasil diunggah');
                                                loadBookDetail(editingBook.id);
                                            } else if (info.file.status === 'error') {
                                                setLoading(false);
                                                message.error('Gagal mengunggah sampul');
                                            }
                                        }}
                                    >
                                        {coverPreview ? (
                                            <div style={{ padding: '8px' }}>
                                                <img src={coverPreview} alt="Cover Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <div style={{ marginTop: 12 }}>
                                                    <Button icon={<UploadOutlined />} size="small">Ganti Foto</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '20px 0' }}>
                                                <p className="ant-upload-drag-icon">
                                                    <InboxOutlined style={{ color: '#008B94' }} />
                                                </p>
                                                <p className="ant-upload-text" style={{ fontWeight: 600 }}>Klik atau Seret file ke sini</p>
                                                <p className="ant-upload-hint" style={{ fontSize: 12 }}>Mendukung JPG, PNG, WebP (Maks. 5MB)</p>
                                            </div>
                                        )}
                                    </Upload.Dragger>
                                </div>
                            </Col>
                            <Col span={12}>
                                <Divider plain>File Naskah (PDF)</Divider>
                                <div className="upload-container">
                                    <Upload.Dragger
                                        name="pdf"
                                        action={`${API_V1_BASE}/admin/books/${editingBook.id}/upload-pdf`}
                                        headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                                        accept="application/pdf"
                                        showUploadList={false}
                                        className="hover-glow"
                                        style={{ background: '#fafafa', borderRadius: 12 }}
                                        onChange={(info) => {
                                            if (info.file.status === 'uploading') {
                                                setLoading(true);
                                            }
                                            if (info.file.status === 'done') {
                                                setLoading(false);
                                                message.success('File PDF berhasil disimpan');
                                                loadBookDetail(editingBook.id);
                                            } else if (info.file.status === 'error') {
                                                setLoading(false);
                                                message.error('Gagal mengunggah file PDF');
                                            }
                                        }}
                                    >
                                        <div style={{ padding: '20px 0' }}>
                                            <p className="ant-upload-drag-icon">
                                                <FileTextOutlined style={{ color: editingBook.pdf_full_path ? '#008B94' : '#d9d9d9' }} />
                                            </p>
                                            {editingBook.pdf_full_path ? (
                                                <p className="ant-upload-text" style={{ color: '#008B94', fontWeight: 700 }}>Dokumen PDF Tersedia</p>
                                            ) : (
                                                <p className="ant-upload-text" style={{ fontWeight: 600 }}>Klik atau Seret file PDF</p>
                                            )}
                                            <p className="ant-upload-hint" style={{ fontSize: 12 }}>Maksimal file 50MB</p>
                                            <div style={{ marginTop: 16 }}>
                                                <Button icon={<UploadOutlined />} size="small" type={editingBook.pdf_full_path ? 'default' : 'primary'} ghost>
                                                    {editingBook.pdf_full_path ? 'Ganti Naskah' : 'Pilih File'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Upload.Dragger>
                                </div>
                            </Col>
                        </Row>
                    )}
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <Space>
                    <BookOutlined style={{ color: '#008B94' }} />
                    <span>{editingBook ? `Edit Buku: ${editingBook.title}` : 'Input Katalog Buku Baru'}</span>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={onFinish}
            confirmLoading={loading}
            width={800}
            okText="Simpan Data"
            cancelText="Batal"
            bodyStyle={{ padding: '0 24px 24px' }}
            style={{ top: 20 }}
        >
            <Form form={form} layout="vertical">
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
            </Form>
        </Modal>
    );
};

import { BookOutlined, FileTextOutlined } from '@ant-design/icons';
import { Col, Row } from 'antd';

export default BookFormModal;

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, DatePicker, Checkbox, Tabs, Space, Button, Divider, Upload, Alert, message, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, LinkOutlined, InboxOutlined } from '@ant-design/icons';
import api from '../../../api';
import { API_V1_BASE } from '../../../api/base';
import dayjs from 'dayjs';

const { Title } = Typography;

interface BookFormModalProps {
    open: boolean;
    editingBook: any;
    onCancel: () => void;
    onSuccess: () => void;
}

const BookFormModal: React.FC<BookFormModalProps> = ({ open, editingBook, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [authors, setAuthors] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchAuthors();
            fetchCategories();
            if (editingBook) {
                loadBookDetail(editingBook.id);
            } else {
                form.resetFields();
                setCoverPreview(null);
            }
        }
    }, [open, editingBook]);

    const fetchAuthors = async () => {
        try {
            const res = await api.get('/authors');
            setAuthors(res.data.data || []);
        } catch { /* ignore */ }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/public/categories');
            setCategories(res.data.data || []);
        } catch { /* ignore */ }
    };

    const loadBookDetail = async (id: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/books/${id}`);
            const book = res.data.data;
            form.setFieldsValue({
                ...book,
                author_id: book.author?.id,
                published_at: book.published_at ? dayjs(book.published_at) : null,
                marketplace_links: book.marketplace_links || [],
                book_type: book.is_digital ? (book.is_physical !== false ? 'both' : 'digital') : 'physical'
            });
            if (book.cover_path) {
                setCoverPreview(book.cover_url || (book.cover_path ? `${API_V1_BASE}/../storage/${book.cover_path}` : null));
            }
        } catch {
            message.error('Gagal mengambil data buku');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const formData = new FormData();
            
            const payload = {
                ...values,
                type: values.type || 'publishing',
                is_digital: values.book_type === 'digital' || values.book_type === 'both',
                published_at: values.published_at ? values.published_at.format('YYYY-MM-DD HH:mm:ss') : null,
            };

            Object.entries(payload).forEach(([key, value]: [string, any]) => {
                if (key === 'marketplace_links') {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });

            // Handle file uploads separately if needed, but Ant Design's Upload usually handles this
            // If they are selected via Upload component, we need to extract them
            if (values.cover_file?.file?.originFileObj) {
                formData.append('cover', values.cover_file.file.originFileObj);
            }
            if (values.pdf_file?.file?.originFileObj) {
                formData.append('pdf_full', values.pdf_file.file.originFileObj);
            }

            if (editingBook) {
                // Laravel workaround for multipart patch
                formData.append('_method', 'PATCH');
                await api.post(`/books/${editingBook.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success('Buku berhasil diperbarui');
            } else {
                await api.post('/books', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success('Buku berhasil ditambahkan');
            }
            onSuccess();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Gagal menyimpan data buku');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={editingBook ? 'Edit Buku' : 'Tambah Buku Baru'}
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={800}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ 
                    status: 'draft', 
                    type: 'publishing',
                    book_type: 'physical',
                    is_featured: false,
                    marketplace_links: []
                }}
            >
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Informasi Dasar',
                        children: (
                            <>
                                <Form.Item name="title" label="Judul Buku" rules={[{ required: true, max: 255 }]}>
                                    <Input placeholder="Masukkan judul buku" />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="slug" label="Slug (URL)" extra="Biarkan kosong untuk auto-generate">
                                            <Input placeholder="judul-buku-2026" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="isbn" label="ISBN" rules={[{ pattern: /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/, message: 'Format ISBN tidak valid (10 atau 13 digit)' }]}>
                                            <Input placeholder="978-xxx-xxx" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="author_id" label="Penulis" rules={[{ required: true }]}>
                                            <Select 
                                                showSearch 
                                                placeholder="Pilih Penulis" 
                                                optionFilterProp="label"
                                                options={authors.map(a => ({ value: a.id, label: a.name }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="category_id" label="Kategori" rules={[{ required: true }]}>
                                            <Select 
                                                placeholder="Pilih Kategori"
                                                options={categories.map(c => ({ value: c.id, label: c.name }))}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="description" label="Deskripsi Buku" rules={[{ required: true }]}>
                                    <Input.TextArea rows={4} placeholder="Tuliskan deskripsi atau sinopsis buku..." />
                                </Form.Item>
                            </>
                        )
                    },
                    {
                        key: '2',
                        label: 'Spesifikasi & Harga',
                        children: (
                            <>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item name="price" label="Harga (Rp)" rules={[{ required: true }]}>
                                            <InputNumber min={0} style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="stock" label="Stok Tersedia">
                                            <InputNumber min={0} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name="page_count" label="Jumlah Halaman">
                                            <InputNumber min={0} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="size" label="Ukuran Buku">
                                            <Select options={[
                                                { value: 'A5', label: 'A5 (14.8 x 21 cm)' },
                                                { value: 'B5', label: 'B5 (17.6 x 25 cm)' },
                                                { value: '14x21', label: '14 x 21 cm' },
                                                { value: '15.5x23', label: '15.5 x 23 cm' },
                                                { value: 'Custom', label: 'Custom' },
                                            ]} />
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
                                        <Form.Item name="book_type" label="Tipe Media" rules={[{ required: true }]}>
                                            <Select options={[
                                                { value: 'physical', label: '📦 Fisik Only' },
                                                { value: 'digital', label: '📱 Digital (E-Book)' },
                                                { value: 'both', label: '📚 Keduanya (Hybrid)' }
                                            ]} placeholder="Pilih media buku" />
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
                                    <Form.Item name="is_featured" valuePropName="checked">
                                        <Checkbox>Tampilkan di Unggulan (Featured)</Checkbox>
                                    </Form.Item>
                                </Space>
                            </>
                        )
                    },
                    {
                        key: '3',
                        label: 'Marketplace',
                        children: (
                            <Form.List name="marketplace_links">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'marketplace_name']}
                                                    rules={[{ required: true, message: 'Nama/Label wajib diisi' }]}
                                                >
                                                    <Input placeholder="Contoh: Tokopedia" style={{ width: 150 }} />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'product_url']}
                                                    rules={[{ required: true, message: 'Link wajib diisi' }, { type: 'url', message: 'URL tidak valid' }]}
                                                >
                                                    <Input prefix={<LinkOutlined />} placeholder="https://..." style={{ width: 450 }} />
                                                </Form.Item>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                Tambah Link Marketplace
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        )
                    },
                    {
                        key: '4',
                        label: 'Upload File',
                        children: (
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Title level={5}>Cover Image</Title>
                                    <Form.Item name="cover_file">
                                        <Upload.Dragger
                                            name="cover"
                                            listType="picture"
                                            maxCount={1}
                                            beforeUpload={() => false}
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={(info) => {
                                                if (info.fileList.length > 0) {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => setCoverPreview(e.target?.result as string);
                                                    reader.readAsDataURL(info.fileList[0].originFileObj as any);
                                                }
                                            }}
                                        >
                                            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                                            <p className="ant-upload-text">Klik atau seret gambar ke sini</p>
                                            <p className="ant-upload-hint">JPG, PNG, WebP (Maks. 5MB). Auto-resize thumbnail.</p>
                                        </Upload.Dragger>
                                    </Form.Item>
                                    {coverPreview && (
                                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                                            <img src={coverPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                                        </div>
                                    )}
                                </Col>
                                <Col span={12}>
                                    <Title level={5}>Naskah PDF (Full)</Title>
                                    <Form.Item name="pdf_file">
                                        <Upload.Dragger
                                            name="pdf"
                                            maxCount={1}
                                            beforeUpload={() => false}
                                            accept=".pdf"
                                        >
                                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                            <p className="ant-upload-text">Pilih File PDF</p>
                                            <p className="ant-upload-hint">File draft final atau PDF siap cetak.</p>
                                        </Upload.Dragger>
                                    </Form.Item>
                                    {editingBook?.pdf_full_path && (
                                        <Alert 
                                            message="Naskah sudah terupload" 
                                            description={<a href={`${API_V1_BASE}/../storage/${editingBook.pdf_full_path}`} target="_blank" rel="noreferrer">Lihat File Saat Ini</a>}
                                            type="success" 
                                            showIcon 
                                            icon={<UploadOutlined />}
                                        />
                                    )}
                                </Col>
                            </Row>
                        )
                    }
                ]} />
            </Form>
        </Modal>
    );
};

export default BookFormModal;

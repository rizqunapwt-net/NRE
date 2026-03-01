import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Skeleton } from 'antd';
import { SaveOutlined, RocketOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

const KelolaHero: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get('/public/site-content?section=hero');
            const data = response.data.data;

            // Transform array of {key, value} to form object
            const formValues: Record<string, string> = {};
            data.forEach((item: { key: string; value: string }) => {
                formValues[item.key] = item.value;
            });

            form.setFieldsValue(formValues);
        } catch {
            message.error('Gagal mengambil data konten Hero.');
        } finally {
            setFetching(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const items = Object.entries(values).map(([key, value]) => ({
                section: 'hero',
                key,
                value: value as string,
                type: 'text'
            }));

            await api.post('/admin/website/content/bulk', { items });
            message.success('Konten Hero berhasil diperbarui!');
        } catch {
            message.error('Gagal memperbarui konten Hero.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Card><Skeleton active /></Card>;

    return (
        <div style={{ maxWidth: 800 }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div>
                    <Title level={2}>Kelola Hero Section</Title>
                    <Paragraph>
                        Sesuaikan teks dan pemicu utama (CTA) yang muncul di bagian paling atas halaman utama.
                    </Paragraph>
                </div>

                <Card
                    title={<Space><RocketOutlined /><span>Konfigurasi Hero</span></Space>}
                    extra={<Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>Simpan Perubahan</Button>}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="badge"
                            label="Badge Teks (Kecil di atas)"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Contoh: PENERBIT & PERCETAKAN" />
                        </Form.Item>

                        <Form.Item
                            name="title"
                            label="Judul Utama (Headline)"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Judul yang menarik perhatian" />
                        </Form.Item>

                        <Form.Item
                            name="subtitle"
                            label="Sub-judul (Deskripsi)"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={3} placeholder="Penjelasan singkat mengenai layanan Anda" />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Form.Item
                                name="cta_primary"
                                label="Label Tombol Utama"
                                rules={[{ required: true, message: 'Harus diisi' }]}
                            >
                                <Input placeholder="Contoh: Terbitkan Sekarang" />
                            </Form.Item>

                            <Form.Item
                                name="cta_secondary"
                                label="Label Tombol Kedua"
                                rules={[{ required: true, message: 'Harus diisi' }]}
                            >
                                <Input placeholder="Contoh: Konsultasi Gratis" />
                            </Form.Item>
                        </div>

                        <Form.Item
                            name="wa_number"
                            label="Nomor WhatsApp (Tanpa +)"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                            extra="Gunakan format internasional tanpa tanda +, contoh: 628123456789"
                        >
                            <Input placeholder="628..." />
                        </Form.Item>
                    </Form>
                </Card>
            </Space>
        </div>
    );
};

export default KelolaHero;

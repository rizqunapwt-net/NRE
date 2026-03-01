import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Skeleton } from 'antd';
import { SaveOutlined, NotificationOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

const KelolaBanner: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get('/public/site-content?section=banner');
            const data = response.data.data;

            const formValues: Record<string, string> = {};
            data.forEach((item: { key: string; value: string }) => {
                formValues[item.key] = item.value;
            });

            form.setFieldsValue(formValues);
        } catch {
            message.error('Gagal mengambil data konten Banner.');
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
                section: 'banner',
                key,
                value: value as string,
                type: 'text'
            }));

            await api.post('/admin/website/content/bulk', { items });
            message.success('Konten Banner berhasil diperbarui!');
        } catch {
            message.error('Gagal memperbarui konten Banner.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Card><Skeleton active /></Card>;

    return (
        <div style={{ maxWidth: 800 }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div>
                    <Title level={2}>Kelola Banner CTA</Title>
                    <Paragraph>
                        Kelola teks dan link pada banner ajakan bertindak (Call to Action) di tengah halaman.
                    </Paragraph>
                </div>

                <Card
                    title={<Space><NotificationOutlined /><span>Konfigurasi Banner</span></Space>}
                    extra={<Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>Simpan Perubahan</Button>}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="title"
                            label="Judul Banner"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Judul besar menarik pada banner" />
                        </Form.Item>

                        <Form.Item
                            name="subtitle"
                            label="Sub-judul Banner"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Penjelasan singkat di bawah judul banner" />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Form.Item
                                name="cta_text"
                                label="Teks Nama Tombol"
                                rules={[{ required: true, message: 'Harus diisi' }]}
                            >
                                <Input placeholder="Contoh: Kirim Naskah" />
                            </Form.Item>

                            <Form.Item
                                name="cta_url"
                                label="URL Tujuan Tombol"
                                rules={[{ required: true, message: 'Harus diisi' }]}
                            >
                                <Input placeholder="Contoh: /register atau https://wa.me/..." />
                            </Form.Item>
                        </div>
                    </Form>
                </Card>
            </Space>
        </div>
    );
};

export default KelolaBanner;

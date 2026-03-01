import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Skeleton, Divider } from 'antd';
import { SaveOutlined, LayoutOutlined, MailOutlined, PhoneOutlined, InstagramOutlined, WhatsAppOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

const KelolaFooter: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get('/public/site-content?section=footer');
            const data = response.data.data;

            const formValues: Record<string, string> = {};
            data.forEach((item: { key: string; value: string }) => {
                formValues[item.key] = item.value;
            });

            form.setFieldsValue(formValues);
        } catch {
            message.error('Gagal mengambil data konten Footer.');
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
                section: 'footer',
                key,
                value: value as string,
                type: 'text'
            }));

            await api.post('/admin/website/content/bulk', { items });
            message.success('Konten Footer berhasil diperbarui!');
        } catch {
            message.error('Gagal memperbarui konten Footer.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Card><Skeleton active /></Card>;

    return (
        <div style={{ maxWidth: 900 }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div>
                    <Title level={2}>Kelola Footer</Title>
                    <Paragraph>
                        Kelola informasi kontak, alamat kantor, dan link media sosial yang muncul di bagian bawah website.
                    </Paragraph>
                </div>

                <Card
                    title={<Space><LayoutOutlined /><span>Informasi Footer</span></Space>}
                    extra={<Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>Simpan Perubahan</Button>}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="description"
                            label="Tentang Singkat (About Us)"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={3} placeholder="Penjelasan singkat tentang Rizquna di footer" />
                        </Form.Item>

                        <Divider>Kontak & Alamat</Divider>

                        <Form.Item
                            name="address"
                            label="Alamat Kantor"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Alamat lengkap" />
                        </Form.Item>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ required: true, message: 'Harus diisi' }, { type: 'email', message: 'Email tidak valid' }]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Email resmi" />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Nomor Telepon"
                                rules={[{ required: true, message: 'Harus diisi' }]}
                            >
                                <Input prefix={<PhoneOutlined />} placeholder="No telepon kantor" />
                            </Form.Item>
                        </div>

                        <Divider>Media Sosial</Divider>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <Form.Item name="instagram" label="Instagram URL">
                                <Input prefix={<InstagramOutlined />} placeholder="https://instagram.com/..." />
                            </Form.Item>

                            <Form.Item name="whatsapp" label="WhatsApp URL">
                                <Input prefix={<WhatsAppOutlined />} placeholder="https://wa.me/..." />
                            </Form.Item>

                            <Form.Item name="facebook" label="Facebook URL">
                                <Input placeholder="https://facebook.com/..." />
                            </Form.Item>

                            <Form.Item name="tiktok" label="TikTok URL">
                                <Input placeholder="https://tiktok.com/@..." />
                            </Form.Item>
                        </div>
                    </Form>
                </Card>
            </Space>
        </div>
    );
};

export default KelolaFooter;

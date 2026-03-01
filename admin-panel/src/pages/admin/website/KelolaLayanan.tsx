import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Skeleton, Divider } from 'antd';
import { SaveOutlined, AppstoreOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph, Text } = Typography;

const KelolaLayanan: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get('/public/site-content?section=layanan');
            const data = response.data.data;

            const formValues: Record<string, unknown> = {};
            data.forEach((item: { key: string; value: string }) => {
                if (item.key === 'items') {
                    try {
                        formValues[item.key] = JSON.parse(item.value);
                    } catch {
                        formValues[item.key] = [];
                    }
                } else {
                    formValues[item.key] = item.value;
                }
            });

            form.setFieldsValue(formValues);
        } catch {
            message.error('Gagal mengambil data konten Layanan.');
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
            const items = [
                { section: 'layanan', key: 'title', value: values.title, type: 'text' },
                { section: 'layanan', key: 'subtitle', value: values.subtitle, type: 'text' },
                { section: 'layanan', key: 'items', value: JSON.stringify(values.items), type: 'json' }
            ];

            await api.post('/admin/website/content/bulk', { items });
            message.success('Konten Layanan berhasil diperbarui!');
        } catch {
            message.error('Gagal memperbarui konten Layanan.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Card><Skeleton active /></Card>;

    return (
        <div style={{ maxWidth: 900 }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div>
                    <Title level={2}>Kelola Layanan</Title>
                    <Paragraph>
                        Kelola daftar layanan unggulan yang ditawarkan oleh Penerbit Rizquna.
                    </Paragraph>
                </div>

                <Card
                    title={<Space><AppstoreOutlined /><span>Header & Deskripsi Layanan</span></Space>}
                    extra={<Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>Simpan Semua</Button>}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="title"
                            label="Judul Bagian"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Contoh: Layanan Penerbitan Profesional" />
                        </Form.Item>

                        <Form.Item
                            name="subtitle"
                            label="Sub-judul / Penjelasan Singkat"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input.TextArea rows={2} placeholder="Deskripsi singkat tentang layanan" />
                        </Form.Item>

                        <Divider>Daftar Item Layanan</Divider>

                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Card
                                            key={key}
                                            size="small"
                                            style={{ marginBottom: 16, background: '#fafafa' }}
                                            title={<Text strong>Layanan #{name + 1}</Text>}
                                            extra={
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                            }
                                        >
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'icon']}
                                                label="Icon (Lucide Name)"
                                                rules={[{ required: true, message: 'Harus diisi' }]}
                                            >
                                                <Input placeholder="Contoh: bulb, edit, global, safety" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'title']}
                                                label="Judul Layanan"
                                                rules={[{ required: true, message: 'Harus diisi' }]}
                                            >
                                                <Input placeholder="Nama layanan" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                                label="Deskripsi Layanan"
                                                rules={[{ required: true, message: 'Harus diisi' }]}
                                            >
                                                <Input.TextArea rows={2} placeholder="Penjelasan detail layanan" />
                                            </Form.Item>
                                        </Card>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Tambah Item Layanan
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Form>
                </Card>
            </Space>
        </div>
    );
};

export default KelolaLayanan;

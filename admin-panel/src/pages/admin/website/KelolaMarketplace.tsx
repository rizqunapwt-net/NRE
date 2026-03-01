import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message, Space, Skeleton } from 'antd';
import { SaveOutlined, ShoppingCartOutlined, PlusOutlined, DeleteOutlined, GlobalOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

const KelolaMarketplace: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const response = await api.get('/public/site-content?section=marketplace');
            const data = response.data.data;

            const formValues: Record<string, unknown> = { indonesia: [], internasional: [] };
            data.forEach((item: { key: string; value: string }) => {
                try {
                    formValues[item.key] = JSON.parse(item.value);
                } catch {
                    formValues[item.key] = [];
                }
            });

            // Default empty if no data
            if (Array.isArray(formValues.indonesia) && formValues.indonesia.length === 0 && 
                Array.isArray(formValues.internasional) && formValues.internasional.length === 0) {
                formValues.indonesia = [
                    { name: 'Tokopedia', url: 'https://www.tokopedia.com/penerbitrizquna', color: '#42b549', emoji: '🛍️' },
                    { name: 'Shopee', url: 'https://shopee.co.id/penerbitrizquna', color: '#f26722', emoji: '🧡' }
                ];
            }

            form.setFieldsValue(formValues);
        } catch {
            message.error('Gagal mengambil data konten Marketplace.');
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
                { section: 'marketplace', key: 'indonesia', value: JSON.stringify(values.indonesia), type: 'json' },
                { section: 'marketplace', key: 'internasional', value: JSON.stringify(values.internasional), type: 'json' }
            ];

            await api.post('/admin/website/content/bulk', { items });
            message.success('Konten Marketplace berhasil diperbarui!');
        } catch {
            message.error('Gagal memperbarui konten Marketplace.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <Card><Skeleton active /></Card>;

    return (
        <div style={{ maxWidth: 900 }}>
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                <div>
                    <Title level={2}>Kelola Marketplace</Title>
                    <Paragraph>
                        Kelola link toko resmi Penerbit Rizquna di berbagai platform marketplace nasional dan internasional.
                    </Paragraph>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                >
                    <Card
                        title={<Space><ShoppingCartOutlined /><span>Marketplace Indonesia</span></Space>}
                        extra={<Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading}>Simpan Semua</Button>}
                        style={{ marginBottom: 24 }}
                    >
                        <Form.List name="indonesia">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item {...restField} name={[name, 'emoji']} style={{ width: 60 }}><Input placeholder="Emoji" /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'name']} style={{ width: 200 }} rules={[{ required: true }]}><Input placeholder="Nama Toko" /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'url']} style={{ width: 350 }} rules={[{ required: true }]}><Input placeholder="https://..." /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'color']} style={{ width: 100 }}><Input placeholder="#Hex" /></Form.Item>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Tambah Marketplace Indonesia</Button>
                                </>
                            )}
                        </Form.List>
                    </Card>

                    <Card title={<Space><GlobalOutlined /><span>Marketplace Internasional</span></Space>}>
                        <Form.List name="internasional">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }) => (
                                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                            <Form.Item {...restField} name={[name, 'emoji']} style={{ width: 60 }}><Input placeholder="Emoji" /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'name']} style={{ width: 200 }} rules={[{ required: true }]}><Input placeholder="Nama Platform" /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'url']} style={{ width: 350 }} rules={[{ required: true }]}><Input placeholder="https://..." /></Form.Item>
                                            <Form.Item {...restField} name={[name, 'color']} style={{ width: 100 }}><Input placeholder="#Hex" /></Form.Item>
                                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Tambah Marketplace Internasional</Button>
                                </>
                            )}
                        </Form.List>
                    </Card>
                </Form>
            </Space>
        </div>
    );
};

export default KelolaMarketplace;

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Modal, Form, Input, InputNumber, Switch, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, SortAscendingOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Paragraph } = Typography;

interface FAQ {
    id: number;
    question: string;
    answer: string;
    category: string;
    sort_order: number;
    is_active: boolean;
}

const KelolaFaq: React.FC = () => {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/website/faqs');
            setFaqs(response.data.data);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            message.error('Gagal mengambil data FAQ.');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingFaq(null);
        form.resetFields();
        form.setFieldsValue({ sort_order: faqs.length, is_active: true, category: 'umum' });
        setModalVisible(true);
    };

    const handleEdit = (record: FAQ) => {
        setEditingFaq(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/website/faqs/${id}`);
            message.success('FAQ berhasil dihapus.');
            fetchFaqs();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            message.error('Gagal menghapus FAQ.');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            if (editingFaq) {
                await api.put(`/admin/website/faqs/${editingFaq.id}`, values);
                message.success('FAQ berhasil diperbarui.');
            } else {
                await api.post('/admin/website/faqs', values);
                message.success('FAQ berhasil ditambahkan.');
            }

            setModalVisible(false);
            fetchFaqs();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            message.error('Gagal menyimpan FAQ.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Urutan',
            dataIndex: 'sort_order',
            key: 'sort_order',
            width: 80,
            render: (text: number) => <Tag color="blue"><SortAscendingOutlined /> {text}</Tag>
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            width: 120,
            render: (text: string) => <Tag>{text.toUpperCase()}</Tag>
        },
        {
            title: 'Pertanyaan',
            dataIndex: 'question',
            key: 'question',
            render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>{active ? 'AKTIF' : 'NON-AKTIF'}</Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 120,
            render: (_: any, record: FAQ) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm
                        title="Hapus FAQ"
                        description="Apakah Anda yakin ingin menghapus FAQ ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya, Hapus"
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
                    <Title level={2}>Kelola FAQ</Title>
                    <Paragraph>
                        Kelola daftar tanya-jawab umum yang sering diajukan oleh calon penulis atau mitra.
                    </Paragraph>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleAdd}
                    style={{ borderRadius: 8 }}
                >
                    Tambah FAQ
                </Button>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    columns={columns}
                    dataSource={faqs}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={<Space><QuestionCircleOutlined /><span>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ Baru'}</span></Space>}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                confirmLoading={loading}
                width={650}
                okText="Simpan FAQ"
                cancelText="Batal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    style={{ marginTop: 24 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="category"
                            label="Kategori"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <Input placeholder="Contoh: umum, teknis, pembayaran" />
                        </Form.Item>

                        <Form.Item
                            name="sort_order"
                            label="Urutan Tampil"
                            rules={[{ required: true, message: 'Harus diisi' }]}
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="question"
                        label="Pertanyaan"
                        rules={[{ required: true, message: 'Harus diisi' }]}
                    >
                        <Input.TextArea rows={2} placeholder="Masukkan pertanyaan..." />
                    </Form.Item>

                    <Form.Item
                        name="answer"
                        label="Jawaban"
                        rules={[{ required: true, message: 'Harus diisi' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Masukkan jawaban detail..." />
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Status Aktif"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="AKTIF" unCheckedChildren="NON-AKTIF" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default KelolaFaq;

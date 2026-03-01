import React, { useEffect, useState } from 'react';
import { 
    Card, Table, Typography, Tag, Space, Spin, Button, 
    Empty, Modal, Form, InputNumber, Select, message, Input,
    Row, Col 
} from 'antd';
import { Plus } from 'lucide-react';
import api from '../../../api';

const { Title, Text, Paragraph } = Typography;

interface PrintOrder {
    id: number;
    order_number: string;
    book: { title: string };
    quantity: number;
    status: string;
    ordered_at: string;
    expected_delivery?: string;
}

interface PublishedBook {
    id: number;
    title: string;
}

const OrderCetakPage: React.FC = () => {
    const [orders, setOrders] = useState<PrintOrder[]>([]);
    const [publishedBooks, setPublishedBooks] = useState<PublishedBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, booksRes] = await Promise.all([
                api.get('/user/print-orders'),
                api.get('/user/books?status=published')
            ]);
            
            if (ordersRes.data?.success) setOrders(ordersRes.data.data);
            if (booksRes.data?.success) setPublishedBooks(booksRes.data.data);
        } catch (err) {
            console.error('Failed to fetch print orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateOrder = async (values: any) => {
        setSubmitting(true);
        try {
            const res = await api.post('/user/print-orders', values);
            if (res.data?.success) {
                message.success('Pesanan cetak berhasil dikirim.');
                setIsModalOpen(false);
                form.resetFields();
                fetchData();
            }
        } catch (err) {
            message.error('Gagal membuat pesanan cetak.');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        {
            title: 'No. Order',
            dataIndex: 'order_number',
            key: 'order_number',
            render: (num: string) => <Text strong>#{num}</Text>
        },
        {
            title: 'Buku',
            dataIndex: ['book', 'title'],
            key: 'book_title',
        },
        {
            title: 'Jumlah (Eks)',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (q: number) => <Text strong>{q}</Text>
        },
        {
            title: 'Tanggal Pesan',
            dataIndex: 'ordered_at',
            key: 'ordered_at',
            render: (date: string) => new Date(date).toLocaleDateString('id-ID')
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const map: Record<string, { color: string, label: string }> = {
                    pending: { color: 'orange', label: 'Menunggu' },
                    processing: { color: 'blue', label: 'Diproses' },
                    printing: { color: 'cyan', label: 'Dicetak' },
                    shipping: { color: 'purple', label: 'Dikirim' },
                    completed: { color: 'green', label: 'Selesai' },
                };
                const s = map[status] || { color: 'default', label: status };
                return <Tag color={s.color}>{s.label.toUpperCase()}</Tag>;
            }
        }
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Card 
                style={{ 
                    marginBottom: 24, 
                    background: 'linear-gradient(135deg, #1b3764 0%, #112240 100%)',
                    borderRadius: 16,
                    border: 'none'
                }}
                bodyStyle={{ padding: '32px' }}
            >
                <Row align="middle" justify="space-between">
                    <Col xs={24} md={16}>
                        <Title level={2} style={{ color: '#fff', margin: 0, fontFamily: "'DM Serif Display', serif" }}>
                            Pencetakan Buku Pribadi
                        </Title>
                        <Paragraph style={{ color: '#9ca3af', fontSize: 16, marginTop: 8, marginBottom: 0 }}>
                            Pesan cetak buku Anda sendiri dengan harga khusus penulis untuk stok pribadi atau komunitas.
                        </Paragraph>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Button 
                            type="primary" 
                            size="large" 
                            icon={<Plus size={18} />}
                            onClick={() => setIsModalOpen(true)}
                            style={{ background: '#10b981', borderRadius: 8, fontWeight: 600, border: 'none' }}
                        >
                            Buat Pesanan Cetak
                        </Button>
                    </Col>
                </Row>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: 0 }}>
                    <Table 
                        dataSource={orders} 
                        columns={columns} 
                        rowKey="id"
                        locale={{ emptyText: <Empty description="Belum ada pesanan cetak." /> }}
                    />
                </Card>
            )}

            <Modal
                title="Pesan Cetak Buku"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
                    <Form.Item 
                        name="book_id" 
                        label="Pilih Buku Anda" 
                        rules={[{ required: true, message: 'Wajib memilih buku' }]}
                    >
                        <Select placeholder="Pilih buku yang sudah terbit">
                            {publishedBooks.map(b => (
                                <Select.Option key={b.id} value={b.id}>{b.title}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    
                    <Form.Item 
                        name="quantity" 
                        label="Jumlah Cetak (Ekslempar)" 
                        rules={[{ required: true, message: 'Wajib mengisi jumlah' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Contoh: 50" />
                    </Form.Item>

                    <Form.Item name="notes" label="Catatan Tambahan (Opsional)">
                        <Input.TextArea rows={3} placeholder="Instruksi khusus, alamat pengiriman berbeda, dll." />
                    </Form.Item>

                    <div style={{ textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                Kirim Pesanan
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default OrderCetakPage;

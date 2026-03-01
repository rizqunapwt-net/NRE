import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Space, Spin, Button, Empty } from 'antd';
import { Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';

const { Title, Text, Paragraph } = Typography;

interface PurchaseRecord {
    id: number;
    transaction_id: string;
    book: {
        id: number;
        title: string;
        slug: string;
        price: number;
    };
    amount_paid: number;
    payment_status: string;
    created_at: string;
}

const PurchaseHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPurchases = async () => {
            try {
                const res = await api.get('/user/purchases');
                if (res.data?.success) {
                    setPurchases(res.data.data.data || []);
                }
            } catch (err) {
                console.error('Failed to fetch purchases:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPurchases();
    }, []);

    const columns = [
        {
            title: 'Transaksi',
            dataIndex: 'transaction_id',
            key: 'transaction_id',
            render: (id: string) => <Text strong style={{ color: '#1b3764' }}>#{id}</Text>
        },
        {
            title: 'Buku',
            dataIndex: ['book', 'title'],
            key: 'book_title',
            render: (title: string, record: PurchaseRecord) => (
                <div onClick={() => navigate(`/katalog/${record.book.id}`)} style={{ cursor: 'pointer' }}>
                    <Text strong>{title}</Text>
                </div>
            )
        },
        {
            title: 'Tanggal',
            dataIndex: 'created_at',
            key: 'date',
            render: (date: string) => (
                <Space>
                    <Calendar size={14} color="#9ca3af" />
                    <Text type="secondary">{new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </Space>
            )
        },
        {
            title: 'Total',
            dataIndex: 'amount_paid',
            key: 'amount',
            render: (amount: number) => <Text strong>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)}</Text>
        },
        {
            title: 'Status',
            dataIndex: 'payment_status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'completed' || status === 'paid' ? 'success' : 'warning'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_: any, record: PurchaseRecord) => (
                <Button 
                    type="link" 
                    icon={<Download size={16} />}
                    disabled={record.payment_status !== 'completed' && record.payment_status !== 'paid'}
                    onClick={() => navigate(`/katalog/${record.book.slug}/baca`)}
                >
                    Baca
                </Button>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Memuat riwayat pembelian..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ fontFamily: "'DM Serif Display', serif" }}>Riwayat Pembelian</Title>
                <Paragraph type="secondary">Daftar transaksi dan status pembayaran buku digital Anda.</Paragraph>
            </div>

            <Card bordered={false} style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: 0 }}>
                {purchases.length > 0 ? (
                    <Table 
                        dataSource={purchases} 
                        columns={columns} 
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                    />
                ) : (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                        <Empty description="Belum ada transaksi pembelian." />
                        <Button type="primary" onClick={() => navigate('/katalog')} style={{ marginTop: 16 }}>
                            Beli Buku Pertama
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PurchaseHistoryPage;

import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Typography, message, Button, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, FileDoneOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface LegalDepositRecord {
    id: number;
    book: { id: number; title: string; tracking_code: string } | null;
    tracking_number: string;
    status: string;
    status_label: string;
    submission_date: string;
    received_at?: string;
    institution: string;
    copies_submitted: number;
    submitter_name?: string;
}

const LegalDepositPage: React.FC = () => {
    const [data, setData] = useState<LegalDepositRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/legal-deposits');
            const list = res.data.data || res.data || [];
            setData(Array.isArray(list) ? list : []);
        } catch {
            message.info('Data Serah Simpan belum tersedia');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const columns = [
        {
            title: 'Buku', key: 'book',
            render: (_: unknown, r: LegalDepositRecord) => (
                <div>
                    <Text strong>{r.book?.title || '-'}</Text><br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{r.book?.tracking_code}</Text>
                </div>
            ),
        },
        { title: 'Institusi', dataIndex: 'institution', key: 'institution' },
        { title: 'Jumlah', dataIndex: 'copies_submitted', key: 'copies', render: (v: number) => `${v} Eks` },
        {
            title: 'Tgl Serah', dataIndex: 'submission_date', key: 'date',
            render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '-',
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (v: string, r: LegalDepositRecord) => {
                const colors: Record<string, string> = { pending: 'orange', submitted: 'blue', received: 'green', rejected: 'red' };
                return <Tag color={colors[v] || 'default'}>{r.status_label || v}</Tag>;
            },
        },
        {
            title: 'Tgl Terima', dataIndex: 'received_at', key: 'received',
            render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '-',
        },
    ];

    const stats = {
        total: data.length,
        pending: data.filter(d => d.status === 'pending').length,
        submitted: data.filter(d => d.status === 'submitted').length,
        received: data.filter(d => d.status === 'received').length,
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Serah Simpan (Legal Deposit)</Title>
                <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Card size="small"><Statistic title="Total" value={stats.total} prefix={<FileDoneOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Pending" value={stats.pending} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Terkirim" value={stats.submitted} valueStyle={{ color: '#008B94' }} prefix={<SyncOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Diterima" value={stats.received} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
            </Row>

            <Card>
                <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>
        </div>
    );
};

export default LegalDepositPage;

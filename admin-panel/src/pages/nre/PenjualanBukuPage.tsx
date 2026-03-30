import React, { useState } from 'react';
import { 
    Table, Card, Row, Col, Statistic, Button, Space, Typography, 
    Tag, DatePicker, Select, Modal, Upload, message, Alert, Breadcrumb, Divider, Form
} from 'antd';
import { 
    ShoppingOutlined, ImportOutlined, DownloadOutlined, 
    BarChartOutlined, CloudUploadOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../api';

const { Title, Text } = Typography;

const PenjualanBukuPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [filterPeriod, setFilterPeriod] = useState(dayjs().format('YYYY-MM'));
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);

    // Fetch Stats
    const { data: statsRes, isLoading: statsLoading } = useQuery({
        queryKey: ['sales-stats', filterPeriod],
        queryFn: async () => {
            const res = await api.get('/v1/sales/stats', { params: { period_month: filterPeriod } });
            return res.data.data;
        }
    });

    // Fetch Sales List
    const { data: salesRes, isLoading: salesLoading } = useQuery({
        queryKey: ['sales-list', filterPeriod],
        queryFn: async () => {
            const res = await api.get('/v1/sales', { params: { period_month: filterPeriod } });
            return res.data.data;
        }
    });

    // Fetch Marketplaces for filter & import
    const { data: marketplacesRes } = useQuery({
        queryKey: ['marketplaces'],
        queryFn: async () => {
            const res = await api.get('/marketplaces');
            return res.data.data;
        }
    });

    const marketplaces = marketplacesRes || [];

    const handleImportCancel = () => {
        setImportModalOpen(false);
        setSelectedMarketplace(null);
    };

    const columns = [
        {
            title: 'Waktu Transaksi',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD MMM YYYY HH:mm'),
        },
        {
            title: 'Buku',
            dataIndex: ['book', 'title'],
            key: 'book',
            ellipsis: true,
        },
        {
            title: 'Marketplace',
            dataIndex: ['marketplace', 'name'],
            key: 'marketplace',
            render: (name: string) => <Tag color="blue">{name}</Tag>,
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'qty',
            align: 'center' as const,
        },
        {
            title: 'Harga Bersih',
            dataIndex: 'net_price',
            key: 'price',
            render: (price: number) => `Rp ${Number(price).toLocaleString('id-ID')}`,
        },
        {
            title: 'Total',
            key: 'total',
            render: (_: any, record: any) => `Rp ${(record.quantity * record.net_price).toLocaleString('id-ID')}`,
            sorter: (a: any, b: any) => (a.quantity * a.net_price) - (b.quantity * b.net_price),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'completed' ? 'green' : 'orange'}>
                    {(status || 'UNKNOWN').toUpperCase()}
                </Tag>
            ),
        }
    ];

    return (
        <div className="sales-page fade-in" style={{ padding: '24px' }}>
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>Admin</Breadcrumb.Item>
                <Breadcrumb.Item>Publishing</Breadcrumb.Item>
                <Breadcrumb.Item>Penjualan Buku</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3}>Penjualan & Distribusi</Title>
                    <Text type="secondary">Monitor data penjualan dari berbagai marketplace dan distributor.</Text>
                </div>
                <Space>
                    <DatePicker 
                        picker="month" 
                        value={dayjs(filterPeriod)} 
                        onChange={(d) => setFilterPeriod(d ? d.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
                    />
                    <Button 
                        type="primary" 
                        icon={<ImportOutlined />} 
                        onClick={() => setImportModalOpen(true)}
                    >
                        Import Sales CSV
                    </Button>
                </Space>
            </div>

            {/* Stats Overview */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="hover-shadow">
                        <Statistic 
                            title="Total Transaksi" 
                            value={statsRes?.total_transactions || 0} 
                            prefix={<ShoppingOutlined style={{ color: '#008B94' }} />} 
                            loading={statsLoading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="hover-shadow">
                        <Statistic 
                            title="Buku Terjual" 
                            value={statsRes?.total_sales || 0} 
                            suffix="Eks" 
                            prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
                            loading={statsLoading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className="hover-shadow">
                        <Statistic 
                            title="Total Pendapatan Bersih" 
                            value={statsRes?.total_revenue || 0} 
                            prefix="Rp" 
                            valueStyle={{ color: '#52c41a' }}
                            loading={statsLoading}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: 24 }} bordered={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={5}>Riwayat Penjualan Periode {dayjs(filterPeriod).format('MMMM YYYY')}</Title>
                    <Space>
                        <Button icon={<DownloadOutlined />}>Excel Report</Button>
                    </Space>
                </div>
                <Table 
                    columns={columns} 
                    dataSource={salesRes || []} 
                    rowKey="id" 
                    loading={salesLoading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Import Modal */}
            <Modal
                title="Import Data Penjualan (CSV)"
                open={importModalOpen}
                onCancel={handleImportCancel}
                footer={null}
                width={500}
            >
                <div style={{ padding: '8px 0' }}>
                    <Alert 
                        message="Panduan Import"
                        description={
                            <ul>
                                <li>Pastikan Format Tanggal: YYYY-MM-DD</li>
                                <li>ISBN harus terdaftar di sistem</li>
                                <li>Gunakan Template yang disediakan</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                        style={{ marginBottom: 20 }}
                    />

                    <Form layout="vertical">
                        <Form.Item label="Pilih Marketplace" required>
                            <Select 
                                placeholder="Pilih sumber data marketplace"
                                options={marketplaces.map((m: any) => ({ value: m.code, label: m.name }))}
                                onChange={setSelectedMarketplace}
                            />
                        </Form.Item>

                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                            <Upload.Dragger
                                name="file"
                                action={`${api.defaults.baseURL}/v1/sales/import`}
                                data={{ 
                                    period_month: filterPeriod,
                                    marketplace_code: selectedMarketplace
                                }}
                                headers={{ Authorization: `Bearer ${localStorage.getItem('token')}` }}
                                disabled={!selectedMarketplace}
                                onChange={(info) => {
                                    if (info.file.status === 'done') {
                                        message.success(`${info.file.name} file uploaded successfully`);
                                        queryClient.invalidateQueries({ queryKey: ['sales-list'] });
                                        queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
                                        handleImportCancel();
                                    } else if (info.file.status === 'error') {
                                        message.error(`${info.file.name} file upload failed.`);
                                    }
                                }}
                            >
                                <p className="ant-upload-drag-icon">
                                    <CloudUploadOutlined style={{ color: '#008B94' }}  />
                                </p>
                                <p className="ant-upload-text">Klik atau seret file ke area ini</p>
                                <p className="ant-upload-hint">Format yang didukung: .csv</p>
                            </Upload.Dragger>
                        </div>

                        <Divider />
                        <div style={{ textAlign: 'right' }}>
                            <Button icon={<DownloadOutlined />} type="link">Unduh Template CSV</Button>
                        </div>
                    </Form>
                </div>
            </Modal>
        </div>
    );
};

export default PenjualanBukuPage;

import React, { useState, useEffect } from 'react';
import {
    Table, Card, Typography, Tag, Button, message, Row, Col, Statistic, Badge,
} from 'antd';
import { ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MachinesPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState<any[]>([]);

    useEffect(() => { loadMachines(); }, []);

    const loadMachines = async () => {
        setLoading(true);
        try {
            const res = await api.get('/percetakan/machines');
            setMachines(res.data.data || []);
        } catch {
            message.error('Gagal memuat data mesin');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (s: string) => {
        const map: Record<string, string> = {
            active: 'green', idle: 'blue', maintenance: 'orange', broken: 'red',
        };
        return map[s] || 'default';
    };

    const activeCount = machines.filter(m => m.status === 'active').length;
    const maintenanceCount = machines.filter(m => m.status === 'maintenance').length;

    const columns = [
        { title: 'Nama Mesin', dataIndex: 'name', key: 'name', width: 200 },
        { title: 'Tipe', dataIndex: 'type', key: 'type', width: 150 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 120,
            render: (s: string) => <Tag color={statusColor(s)}>{(s || '').toUpperCase()}</Tag>,
        },
        {
            title: 'Kapasitas', dataIndex: 'capacity', key: 'capacity', width: 150,
            render: (v: string) => v || '-',
        },
        {
            title: 'Lokasi', dataIndex: 'location', key: 'location', width: 150,
            render: (v: string) => v || '-',
        },
        {
            title: 'Maintenance Terakhir', dataIndex: 'last_maintenance', key: 'last_maintenance', width: 160,
            render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '-',
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3}><ToolOutlined /> Manajemen Mesin</Title>
                    <Text type="secondary">Daftar mesin percetakan dan status operasional</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={loadMachines} size="large">Refresh</Button>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card><Statistic title="Total Mesin" value={machines.length} /></Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Aktif" value={activeCount} valueStyle={{ color: '#52c41a' }}
                            suffix={<Badge status="success" />} />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card>
                        <Statistic title="Maintenance" value={maintenanceCount}
                            valueStyle={{ color: '#fa8c16' }} suffix={<Badge status="warning" />} />
                    </Card>
                </Col>
            </Row>

            <Card>
                <Table
                    columns={columns} dataSource={machines} rowKey="id"
                    loading={loading} size="middle"
                    pagination={{ pageSize: 20, showTotal: (t) => `${t} mesin` }}
                />
            </Card>
        </div>
    );
};

export default MachinesPage;

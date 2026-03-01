import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Typography, Progress } from 'antd';
import {
  PrinterOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PercetakanDashboard.css';

const { Title, Text } = Typography;

const PercetakanDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = {
    totalOrders: 48,
    inProduction: 15,
    completed: 28,
    pending: 5,
    monthlyRevenue: 85500000,
    customerSatisfaction: 94,
  };

  const recentOrders = [
    { id: 1, number: 'PO-2024-001', customer: 'PT ABC', item: 'Buku Ajar Fisika', qty: 500, status: 'printing', progress: 75 },
    { id: 2, number: 'PO-2024-002', customer: 'CV XYZ', item: 'Modul Matematika', qty: 300, status: 'binding', progress: 50 },
    { id: 3, number: 'PO-2024-003', customer: 'UD 123', item: 'LKS IPA', qty: 1000, status: 'cutting', progress: 25 },
  ];

  const getStatusColor = (status: string) => {
    const colors: any = {
      printing: 'blue',
      binding: 'purple',
      cutting: 'orange',
      completed: 'green',
      pending: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      printing: 'Mencetak',
      binding: 'Menjilid',
      cutting: 'Memotong',
      completed: 'Selesai',
      pending: 'Pending',
    };
    return labels[status] || status;
  };

  return (
    <div className="percetakan-dashboard">
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-title">Dashboard Percetakan</Title>
          <Text className="dashboard-subtitle">Kelola order cetak dan produksi</Text>
        </div>
        <div className="header-actions">
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/percetakan/orders/new')}
          >
            Order Baru
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-icon">
              <PrinterOutlined size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Total Order</span>}
                value={stats.totalOrders}
                valueStyle={{ color: '#008B94' }}
                suffix="order"
              />
              <div className="stat-detail">
                <Text className="detail-label">Bulan Ini:</Text>
                <Text className="detail-value">12 order</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <div className="stat-icon">
              <FileTextOutlined size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Dalam Produksi</span>}
                value={stats.inProduction}
                valueStyle={{ color: '#F59E0B' }}
                suffix="order"
              />
              <div className="stat-detail">
                <Text className="detail-label">Selesai:</Text>
                <Text className="detail-value">{stats.completed}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <div className="stat-icon">
              <Package size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Pendapatan</span>}
                value={stats.monthlyRevenue}
                valueStyle={{ color: '#10B981' }}
                prefix="Rp "
              />
              <div className="stat-detail">
                <Text className="detail-label">Tren:</Text>
                <Text className="detail-value trend-up">↑ 18%</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-icon">
              <TeamOutlined size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Kepuasan</span>}
                value={stats.customerSatisfaction}
                valueStyle={{ color: '#8B5CF6' }}
                suffix="%"
              />
              <div className="stat-detail">
                <Text className="detail-label">Rating:</Text>
                <Text className="detail-value">4.7/5.0</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Aksi Cepat" className="quick-actions-card">
            <div className="quick-actions">
              <Button
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/percetakan/orders/new')}
              >
                Order Baru
              </Button>
              <Button
                size="large"
                icon={<EyeOutlined />}
                onClick={() => navigate('/percetakan/orders')}
              >
                Daftar Order
              </Button>
              <Button
                size="large"
                icon={<BarChartOutlined />}
                onClick={() => navigate('/percetakan/production')}
              >
                Monitoring Produksi
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/percetakan/calculator')}
              >
                Kalkulator Harga
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/percetakan/machines')}
              >
                Mesin & Maintenance
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Production Orders */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Order Dalam Produksi" className="table-card">
            <Table
              dataSource={recentOrders}
              columns={[
                {
                  title: 'No Order',
                  dataIndex: 'number',
                  key: 'number',
                },
                {
                  title: 'Customer',
                  dataIndex: 'customer',
                  key: 'customer',
                },
                {
                  title: 'Item',
                  dataIndex: 'item',
                  key: 'item',
                },
                {
                  title: 'Qty',
                  dataIndex: 'qty',
                  key: 'qty',
                  render: (qty: number) => `${qty} eks`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={getStatusColor(status)}>
                      {getStatusLabel(status)}
                    </Tag>
                  ),
                },
                {
                  title: 'Progress',
                  key: 'progress',
                  render: (_: any, record: any) => (
                    <Progress
                      percent={record.progress}
                      strokeColor={getStatusColor(record.status)}
                      size="small"
                    />
                  ),
                },
                {
                  title: 'Aksi',
                  key: 'action',
                  render: () => (
                    <Button type="link" size="small">
                      Detail
                    </Button>
                  ),
                },
              ]}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      {/* Production Stages */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="Tahap Pencetakan" className="stage-card">
            <div className="stage-info">
              <PrinterOutlined className="stage-icon" />
              <div className="stage-content">
                <Text className="stage-count">5 order</Text>
                <Text className="stage-label">Sedang mencetak</Text>
              </div>
            </div>
            <Progress percent={60} strokeColor="#008B94" />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Tahap Penjilidan" className="stage-card">
            <div className="stage-info">
              <FileTextOutlined className="stage-icon" />
              <div className="stage-content">
                <Text className="stage-count">7 order</Text>
                <Text className="stage-label">Sedang menjilid</Text>
              </div>
            </div>
            <Progress percent={45} strokeColor="#8B5CF6" />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Tahap Pemotongan" className="stage-card">
            <div className="stage-info">
              <BarChartOutlined className="stage-icon" />
              <div className="stage-content">
                <Text className="stage-count">3 order</Text>
                <Text className="stage-label">Sedang memotong</Text>
              </div>
            </div>
            <Progress percent={30} strokeColor="#F59E0B" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PercetakanDashboard;

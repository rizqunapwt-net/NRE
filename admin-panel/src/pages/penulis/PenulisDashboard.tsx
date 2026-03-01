import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Typography, Avatar } from 'antd';
import {
  BookOpen,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PenulisDashboard.css';

const { Title, Text } = Typography;

const PenulisDashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = {
    totalBooks: 12,
    publishedBooks: 8,
    inProduction: 3,
    pendingContracts: 1,
    totalRoyalties: 15750000,
    monthlySales: 145,
  };

  const recentBooks = [
    { id: 1, title: 'Belajar Laravel', status: 'published', year: 2024, sales: 120 },
    { id: 2, title: 'Pemrograman Python', status: 'in_production', year: 2024, sales: 0 },
    { id: 3, title: 'Digital Marketing', status: 'review', year: 2024, sales: 0 },
  ];

  const getStatusColor = (status: string) => {
    const colors: any = {
      published: 'green',
      in_production: 'blue',
      review: 'orange',
      draft: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: any = {
      published: 'Terbit',
      in_production: 'Produksi',
      review: 'Review',
      draft: 'Draft',
    };
    return labels[status] || status;
  };

  return (
    <div className="penulis-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <Avatar size={64} icon={<Text>JD</Text>} className="author-avatar" />
          <div>
            <Title level={2} className="dashboard-title">Selamat Datang, John Doe!</Title>
            <Text className="dashboard-subtitle">Kelola naskah dan pantau performa buku Anda</Text>
          </div>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<Plus size={16} />}
          className="btn-submit-manuscript"
          onClick={() => navigate('/penulis/kirim-naskah')}
        >
          Kirim Naskah Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-icon">
              <BookOpen size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Total Naskah</span>}
                value={stats.totalBooks}
                valueStyle={{ color: '#008B94' }}
              />
              <div className="stat-detail">
                <Text className="detail-label">Terbit:</Text>
                <Text className="detail-value">{stats.publishedBooks}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <div className="stat-icon">
              <FileText size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Dalam Proses</span>}
                value={stats.inProduction}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="stat-detail">
                <Text className="detail-label">Kontrak:</Text>
                <Text className="detail-value">{stats.pendingContracts}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <div className="stat-icon">
              <DollarSign size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Royalti Pending</span>}
                value={stats.totalRoyalties}
                valueStyle={{ color: '#10B981' }}
                prefix="Rp "
              />
              <div className="stat-detail">
                <Text className="detail-label">Bulan Ini:</Text>
                <Text className="detail-value">Rp 2.5jt</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-icon">
              <TrendingUp size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Penjualan</span>}
                value={stats.monthlySales}
                valueStyle={{ color: '#8B5CF6' }}
                suffix="buku"
              />
              <div className="stat-detail">
                <Text className="detail-label">Tren:</Text>
                <Text className="detail-value trend-up">↑ 12%</Text>
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
                icon={<Eye size={16} />}
                onClick={() => navigate('/penulis/naskah')}
              >
                Lihat Naskah
              </Button>
              <Button
                size="large"
                icon={<Pencil size={16} />}
                onClick={() => navigate('/penulis/ebook')}
              >
                Kelola E-Book
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/penulis/royalti')}
              >
                Laporan Royalti
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/penulis/chat')}
              >
                Chat Admin
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Books */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Naskah Terbaru" className="table-card">
            <Table
              dataSource={recentBooks}
              columns={[
                {
                  title: 'Judul Naskah',
                  dataIndex: 'title',
                  key: 'title',
                  render: (text: string) => <Text strong>{text}</Text>,
                },
                {
                  title: 'Tahun',
                  dataIndex: 'year',
                  key: 'year',
                  width: 100,
                },
                {
                  title: 'Penjualan',
                  dataIndex: 'sales',
                  key: 'sales',
                  width: 120,
                  render: (sales: number) => sales > 0 ? `${sales} buku` : '-',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  width: 150,
                  render: (status: string) => (
                    <Tag color={getStatusColor(status)}>
                      {getStatusLabel(status)}
                    </Tag>
                  ),
                },
                {
                  title: 'Aksi',
                  key: 'action',
                  width: 100,
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

        <Col xs={24} lg={8}>
          <Card title="Progress Naskah Aktif" className="progress-card">
            <div className="progress-item">
              <div className="progress-header">
                <Text strong>Belajar Laravel</Text>
                <Tag color="blue">Review</Tag>
              </div>
              <Progress percent={75} status="active" strokeColor="#008B94" />
              <Text className="progress-note" type="secondary">
                Menunggu review editor
              </Text>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <Text strong>Pemrograman Python</Text>
                <Tag color="green">Layout</Tag>
              </div>
              <Progress percent={45} status="active" strokeColor="#10B981" />
              <Text className="progress-note" type="secondary">
                Proses layout
              </Text>
            </div>

            <div className="progress-item">
              <div className="progress-header">
                <Text strong>Digital Marketing</Text>
                <Tag color="orange">Editing</Tag>
              </div>
              <Progress percent={30} status="active" strokeColor="#F59E0B" />
              <Text className="progress-note" type="secondary">
                Editing konten
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PenulisDashboard;

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin } from 'antd';
import {
  BookOpen,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import api from '../api';
import { DashboardStatsSkeleton, TableSkeleton } from '../components/SkeletonLoaders';
import './DashboardPage.css';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [activeAuthors, setActiveAuthors] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Small delay for skeleton visibility
      // setLoading(true); 
      const [statsRes, chartRes, recentBooksRes, activeAuthorsRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/dashboard/books'),
        api.get('/admin/books?per_page=5'),
        api.get('/admin/authors?per_page=5'),
      ]);
      
      setStats(statsRes.data.data);
      setChartData(chartRes.data.data || []);
      setRecentBooks(recentBooksRes.data.data || []);
      setActiveAuthors(activeAuthorsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="dashboard-page" style={{ padding: '24px' }}>
        <DashboardStatsSkeleton />
        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <TableSkeleton rows={8} />
          </Col>
          <Col xs={24} lg={8}>
            <TableSkeleton rows={8} />
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <Title level={2} className="dashboard-title">Dashboard</Title>
        <Text className="dashboard-subtitle">Overview sistem penerbitan Anda</Text>
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
                title={<span className="stat-label">Total Buku</span>}
                value={stats?.total_books || 0}
                valueStyle={{ color: '#008B94' }}
              />
              <div className="stat-trend">
                <ArrowUpRight size={16} />
                <span className="trend-text">+12% dari bulan lalu</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-icon">
              <Users size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Total Penulis</span>}
                value={stats?.total_authors || 0}
                valueStyle={{ color: '#8B5CF6' }}
              />
              <div className="stat-trend">
                <ArrowUpRight size={16} />
                <span className="trend-text">+8% dari bulan lalu</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-amber">
            <div className="stat-icon">
              <ShoppingCart size={28} />
            </div>
            <div className="stat-content">
              <Statistic
                title={<span className="stat-label">Penjualan</span>}
                value={stats?.total_sales || 0}
                valueStyle={{ color: '#F59E0B' }}
                prefix="Rp "
              />
              <div className="stat-trend">
                <ArrowDownRight size={16} />
                <span className="trend-text">-3% dari bulan lalu</span>
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
                title={<span className="stat-label">Royalti</span>}
                value={stats?.total_royalties || 0}
                valueStyle={{ color: '#10B981' }}
                prefix="Rp "
              />
              <div className="stat-trend">
                <ArrowUpRight size={16} />
                <span className="trend-text">+15% dari bulan lalu</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Tren Penjualan" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008B94" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#008B94" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#008B94"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Kategori Terpopuler" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Edukasi', value: 45 },
                { name: 'Fiksi', value: 32 },
                { name: 'Sains', value: 28 },
                { name: 'Bisnis', value: 22 },
                { name: 'Lainnya', value: 15 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Naskah Terbaru" className="table-card">
            <Table
              dataSource={recentBooks}
              rowKey="id"
              columns={[
                { title: 'Judul', dataIndex: 'title', key: 'title', ellipsis: true },
                { title: 'Penulis', dataIndex: 'author', key: 'author', render: (a) => a?.nama || a?.name || '-' },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors: any = {
                      review: 'blue',
                      editing: 'orange',
                      published: 'green',
                      draft: 'default'
                    };
                    return <Tag color={colors[status] || 'blue'}>{(status || 'review').toUpperCase()}</Tag>;
                  },
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Penulis Aktif" className="table-card">
            <Table
              dataSource={activeAuthors}
              rowKey="id"
              columns={[
                { title: 'Nama', dataIndex: 'name', key: 'name', render: (val, record) => record.nama || val },
                { title: 'Buku', dataIndex: 'books_count', key: 'books_count' },
                { 
                  title: 'Royalti', 
                  dataIndex: 'total_royalties_amount', 
                  key: 'revenue',
                  render: (amount) => `Rp ${(amount || 0).toLocaleString('id-ID')}`
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

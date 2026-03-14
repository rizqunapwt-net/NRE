import React, { useState } from 'react';
import {
  Table,
  Button,
  Card,
  DatePicker,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  Tooltip,
  message,
  Breadcrumb,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  CalculatorOutlined,
  FileCsvOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RoyaltyCalculation {
  id: number;
  period_month: string;
  author: {
    id: number;
    name: string;
  };
  total_amount: string;
  status: 'draft' | 'finalized' | 'paid';
  calculated_at: string;
  finalized_at: string;
}

const RoyaltyListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState({
    author: '',
    status: '',
    period: null as any,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['royalties', filters],
    queryFn: async () => {
      const params: any = {
        author: filters.author,
        status: filters.status,
      };
      if (filters.period) {
        params.period_month = filters.period.format('YYYY-MM');
      }
      const res = await api.get('/royalties', { params });
      return res.data;
    },
  });

  const calculations = response?.data || [];
  const pagination = response?.meta || {};

  const calculateMutation = useMutation({
    mutationFn: async (periodMonth: string) => {
      await api.post('/royalties/calculate', { period_month: periodMonth });
    },
    onSuccess: () => {
      message.success('Kalkulasi royalti berhasil dijalankan');
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      await Promise.all(ids.map(id => api.put(`/royalties/${id}/finalize`)));
    },
    onSuccess: () => {
      message.success('Berhasil memfinalisasi royalti terpilih');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (ids: React.Key[]) => {
      // In a real app, you might have a bulk mark-as-paid endpoint
      // For now we'll do individual calls or use the existing mark-paid endpoint
      // However, the backend might need a specific structure for payment proof.
      // Let's assume we mark them as paid individually for now.
      await Promise.all(ids.map(id => api.put(`/payments/${id}/mark-paid`)));
    },
    onSuccess: () => {
      message.success('Berhasil menandai royalti terpilih sebagai dibayar');
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Penulis', 'Periode', 'Total Amount', 'Status', 'Tanggal Kalkulasi'];
    const csvContent = [
      headers.join(','),
      ...calculations.map((c: RoyaltyCalculation) => [
        c.id,
        `"${c.author.name}"`,
        c.period_month,
        c.total_amount,
        c.status,
        c.calculated_at,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `royalties_${dayjs().format('YYYYMMDD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'Penulis',
      dataIndex: ['author', 'name'],
      key: 'author',
      sorter: (a: any, b: any) => a.author.name.localeCompare(b.author.name),
    },
    {
      title: 'Periode',
      dataIndex: 'period_month',
      key: 'period',
      render: (text: string) => dayjs(text + '-01').format('MMMM YYYY'),
    },
    {
      title: 'Total Royalti',
      dataIndex: 'total_amount',
      key: 'amount',
      render: (amount: string) => `Rp ${Number(amount).toLocaleString('id-ID')}`,
      sorter: (a: any, b: any) => Number(a.total_amount) - Number(b.total_amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          draft: 'blue',
          finalized: 'green',
          paid: 'gold',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Finalized', value: 'finalized' },
        { text: 'Paid', value: 'paid' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: RoyaltyCalculation) => (
        <Space size="small">
          <Tooltip title="Lihat Detail">
            <Button 
              type="text"
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/admin/royalties/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Edit / Update">
            <Button 
              type="text"
              icon={<EditOutlined />} 
              onClick={() => navigate(`/admin/royalties/${record.id}/edit`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="royalty-list-page">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item>Manajemen Royalti</Breadcrumb.Item>
      </Breadcrumb>

      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3}>Manajemen Royalti</Title>
            <Text type="secondary">Kelola perhitungan, finalisasi, dan pembayaran royalti penulis.</Text>
          </div>
          <Space>
            <Button 
              icon={<FileCsvOutlined />} 
              onClick={handleExportCSV}
              disabled={calculations.length === 0}
            >
              Export CSV
            </Button>
            <DatePicker 
              picker="month" 
              placeholder="Pilih Bulan"
              onChange={(date) => {
                if (date) {
                  calculateMutation.mutate(date.format('YYYY-MM'));
                }
              }}
            />
            <Button 
              type="primary" 
              icon={<CalculatorOutlined />}
              onClick={() => {
                const now = dayjs().format('YYYY-MM');
                calculateMutation.mutate(now);
              }}
              loading={calculateMutation.isPending}
            >
              Hitung Royalti Bulan Ini
            </Button>
          </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input 
            placeholder="Cari Penulis..." 
            prefix={<SearchOutlined />} 
            style={{ width: 250 }}
            onChange={(e) => setFilters({ ...filters, author: e.target.value })}
          />
          <Select
            placeholder="Pilih Status"
            style={{ width: 150 }}
            allowClear
            onChange={(val) => setFilters({ ...filters, status: val })}
            options={[
              { label: 'Draft', value: 'draft' },
              { label: 'Finalized', value: 'finalized' },
              { label: 'Paid', value: 'paid' },
            ]}
          />
          <DatePicker 
            picker="month" 
            placeholder="Filter Periode"
            onChange={(date) => setFilters({ ...filters, period: date })}
          />
        </div>

        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text strong>{selectedRowKeys.length} item terpilih:</Text>
              <Button 
                size="small" 
                icon={<CheckCircleOutlined />} 
                onClick={() => finalizeMutation.mutate(selectedRowKeys)}
                loading={finalizeMutation.isPending}
              >
                Finalisasi Massal
              </Button>
              <Button 
                size="small" 
                icon={<DollarOutlined />} 
                onClick={() => markAsPaidMutation.mutate(selectedRowKeys)}
                loading={markAsPaidMutation.isPending}
              >
                Tandai Dibayar
              </Button>
            </Space>
          </div>
        )}

        <Table 
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns} 
          dataSource={calculations} 
          rowKey="id" 
          loading={isLoading}
          pagination={{
            pageSize: pagination.per_page || 15,
            total: pagination.total || 0,
            showSizeChanger: true,
          }}
        />
      </Card>
    </div>
  );
};

export default RoyaltyListPage;

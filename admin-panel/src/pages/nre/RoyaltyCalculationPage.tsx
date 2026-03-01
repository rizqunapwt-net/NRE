import React, { useState } from 'react';
import {
  Table,
  Button,
  Card,
  DatePicker,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Descriptions,
  Divider,
} from 'antd';
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;

interface RoyaltyItem {
  id: number;
  book: {
    title: string;
  };
  quantity: number;
  net_price: string;
  royalty_percentage: string;
  amount: string;
}

interface RoyaltyCalculation {
  id: number;
  period_month: string;
  author: {
    name: string;
  };
  total_amount: string;
  status: string;
  items?: RoyaltyItem[];
}

const RoyaltyCalculationPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<RoyaltyCalculation | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch royalty calculations for the selected month
  // Note: Backend might need a list endpoint, but for now we'll assume we can calculate or get current ones
  const { data: calculations, isLoading } = useQuery({
    queryKey: ['royalties', selectedMonth.format('YYYY-MM')],
    queryFn: async () => {
      // For now, we'll try to fetch all or filtered by month
      const response = await api.get('/royalties');
      return response.data.data as RoyaltyCalculation[];
    },
    // Mocking for now if endpoint doesn't exist yet for listing
    initialData: [],
  });

  const calculateMutation = useMutation({
    mutationFn: async (periodMonth: string) => {
      const response = await api.post('/royalties/calculate', { period_month: periodMonth });
      return response.data.data;
    },
    onSuccess: () => {
      message.success('Kalkulasi royalti berhasil dijalankan');
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Gagal menjalankan kalkulasi');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/royalties/${id}/finalize`);
      return response.data.data;
    },
    onSuccess: () => {
      message.success('Royalti berhasil difinalisasi');
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/royalties/${id}/invoice`);
      return response.data.data;
    },
    onSuccess: () => {
      message.success('Invoice berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['royalties'] });
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate(selectedMonth.format('YYYY-MM'));
  };

  const showDetails = (record: RoyaltyCalculation) => {
    setSelectedCalculation(record);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      title: 'Penulis',
      dataIndex: ['author', 'name'],
      key: 'author',
    },
    {
      title: 'Periode',
      dataIndex: 'period_month',
      key: 'period',
    },
    {
      title: 'Total Royalti',
      dataIndex: 'total_amount',
      key: 'amount',
      render: (amount: string) => `Rp ${Number(amount).toLocaleString('id-ID')}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'finalized') color = 'green';
        if (status === 'paid') color = 'gold';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: RoyaltyCalculation) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => showDetails(record)}
          >
            Detail
          </Button>
          {record.status === 'draft' && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => finalizeMutation.mutate(record.id)}
              loading={finalizeMutation.isPending}
            >
              Finalisasi
            </Button>
          )}
          {record.status === 'finalized' && (
            <Button 
              type="primary" 
              icon={<FilePdfOutlined />}
              onClick={() => invoiceMutation.mutate(record.id)}
              loading={invoiceMutation.isPending}
            >
              Buat Invoice
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns = [
    {
      title: 'Judul Buku',
      dataIndex: ['book', 'title'],
      key: 'bookTitle',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'qty',
    },
    {
      title: 'Harga Net',
      dataIndex: 'net_price',
      key: 'price',
      render: (price: string) => `Rp ${Number(price).toLocaleString('id-ID')}`,
    },
    {
      title: '% Royalti',
      dataIndex: 'royalty_percentage',
      key: 'percentage',
      render: (p: string) => `${p}%`,
    },
    {
      title: 'Subtotal',
      dataIndex: 'amount',
      key: 'subtotal',
      render: (amount: string) => `Rp ${Number(amount).toLocaleString('id-ID')}`,
    },
  ];

  return (
    <div style={{ padding: '0 20px' }}>
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3}>Kalkulasi Royalti</Title>
            <Text type="secondary">Kelola perhitungan royalti bulanan untuk penulis.</Text>
          </div>
          <Space>
            <DatePicker 
              picker="month" 
              value={selectedMonth} 
              onChange={(date) => date && setSelectedMonth(date)}
              format="MMMM YYYY"
            />
            <Button 
              type="primary" 
              icon={<CalculatorOutlined />} 
              onClick={handleCalculate}
              loading={calculateMutation.isPending}
            >
              Jalankan Kalkulasi
            </Button>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={calculations} 
          rowKey="id" 
          loading={isLoading}
        />
      </Card>

      <Modal
        title="Detail Perhitungan Royalti"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Tutup
          </Button>
        ]}
      >
        {selectedCalculation && (
          <>
            <Descriptions title="Informasi Umum" bordered column={2}>
              <Descriptions.Item label="Penulis">{selectedCalculation.author.name}</Descriptions.Item>
              <Descriptions.Item label="Periode">{selectedCalculation.period_month}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedCalculation.status === 'finalized' ? 'green' : 'blue'}>
                  {selectedCalculation.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong>Rp {Number(selectedCalculation.total_amount).toLocaleString('id-ID')}</Text>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider type="horizontal">Item Penjualan</Divider>
            
            <Table 
              columns={itemColumns} 
              dataSource={selectedCalculation.items || []} 
              rowKey="id" 
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default RoyaltyCalculationPage;

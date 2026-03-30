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
  Upload,
} from 'antd';
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  EyeOutlined,
  DollarOutlined,
  UploadOutlined,
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
  payment?: {
    id: number;
    invoice_number: string;
    invoice_path: string;
    status: string;
  };
}

const RoyaltyCalculationPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<RoyaltyCalculation | null>(null);
  
  const queryClient = useQueryClient();

  const { data: calculations, isLoading } = useQuery({
    queryKey: ['royalties', selectedMonth.format('YYYY-MM')],
    queryFn: async () => {
      const response = await api.get('/royalties', { params: { period_month: selectedMonth.format('YYYY-MM') } });
      return response.data.data.data as RoyaltyCalculation[];
    },
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

  const payMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      // Assuming a payment endpoint
      const response = await api.post(`/royalties/${id}/pay`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.data;
    },
    onSuccess: () => {
      message.success('Pembayaran berhasil dikonfirmasi');
      setIsPayModalOpen(false);
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

  const handleDownloadInvoice = (path: string) => {
    window.open(`${api.defaults.baseURL}/../storage/${path}`, '_blank');
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
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: RoyaltyCalculation) => (
        <Space size="small">
          <Button 
            size="small"
            icon={<EyeOutlined />} 
            onClick={() => showDetails(record)}
          >
            Detail
          </Button>
          {record.status === 'draft' && (
            <Button 
              size="small"
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => finalizeMutation.mutate(record.id)}
              loading={finalizeMutation.isPending}
            >
              Final
            </Button>
          )}
          {record.status === 'finalized' && !record.payment && (
            <Button 
              size="small"
              type="primary" 
              icon={<FilePdfOutlined />}
              onClick={() => invoiceMutation.mutate(record.id)}
              loading={invoiceMutation.isPending}
            >
              Invoice
            </Button>
          )}
          {record.payment && (
             <Button 
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => handleDownloadInvoice(record.payment!.invoice_path)}
             >
                Lihat
             </Button>
          )}
          {record.status === 'finalized' && record.payment && (
            <Button 
              size="small"
              type="primary"
              style={{ backgroundColor: '#faad14', borderColor: '#faad14' }}
              icon={<DollarOutlined />}
              onClick={() => {
                setSelectedCalculation(record);
                setIsPayModalOpen(true);
              }}
            >
              Bayar
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
      align: 'right' as const,
    },
    {
      title: 'Harga Net',
      dataIndex: 'net_price',
      key: 'price',
      align: 'right' as const,
      render: (price: string) => `Rp ${Number(price).toLocaleString('id-ID')}`,
    },
    {
      title: '%',
      dataIndex: 'royalty_percentage',
      key: 'percentage',
      align: 'right' as const,
      render: (p: string) => `${p}%`,
    },
    {
      title: 'Subtotal',
      dataIndex: 'amount',
      key: 'subtotal',
      align: 'right' as const,
      render: (amount: string) => <Text strong>Rp {Number(amount).toLocaleString('id-ID')}</Text>,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card bordered={false} className="shadow-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Royalty Management</Title>
            <Text type="secondary">Calculate and manage author royalties for each period.</Text>
          </div>
          <Space>
            <DatePicker 
              picker="month" 
              value={selectedMonth} 
              onChange={(date) => date && setSelectedMonth(date)}
              format="MMMM YYYY"
              allowClear={false}
            />
            <Button 
              type="primary" 
              icon={<CalculatorOutlined />} 
              onClick={handleCalculate}
              loading={calculateMutation.isPending}
              size="large"
            >
              Generate Royalties
            </Button>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={calculations} 
          rowKey="id" 
          loading={isLoading}
          pagination={{ pageSize: 15 }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={<Title level={4}>Royalty Details</Title>}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
        ]}
      >
        {selectedCalculation && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Author">{selectedCalculation.author.name}</Descriptions.Item>
              <Descriptions.Item label="Period">{selectedCalculation.period_month}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedCalculation.status === 'finalized' ? 'green' : 'blue'}>
                  {selectedCalculation.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Payable">
                <Text strong style={{ fontSize: '1.2em', color: '#1DBC8A' }}>
                  Rp {Number(selectedCalculation.total_amount).toLocaleString('id-ID')}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            
            <Table 
              columns={itemColumns} 
              dataSource={selectedCalculation.items || []} 
              rowKey="id" 
              pagination={false}
              size="small"
              summary={pageData => {
                let total = 0;
                pageData.forEach(({ amount }) => { total += Number(amount); });
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right"><Text strong>Grand Total</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right"><Text strong>Rp {total.toLocaleString('id-ID')}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Space>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Confirm Payment"
        open={isPayModalOpen}
        onCancel={() => setIsPayModalOpen(false)}
        footer={null}
      >
        <p>Confirm that you have paid <strong>Rp {Number(selectedCalculation?.total_amount).toLocaleString('id-ID')}</strong> to <strong>{selectedCalculation?.author.name}</strong>.</p>
        <Divider />
        <Upload
          accept="image/*,application/pdf"
          beforeUpload={(file) => {
            const formData = new FormData();
            formData.append('payment_proof', file);
            payMutation.mutate({ id: selectedCalculation!.id, formData });
            return false;
          }}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} type="primary" block size="large">
            Upload Proof and Confirm
          </Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default RoyaltyCalculationPage;

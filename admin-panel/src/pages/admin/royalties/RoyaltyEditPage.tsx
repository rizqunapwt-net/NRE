import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Table,
  Typography,
  message,
  Breadcrumb,
  Row,
  Col,
  Upload,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

const RoyaltyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [items, setItems] = useState<RoyaltyItem[]>([]);

  const { data: royalty, isLoading } = useQuery({
    queryKey: ['royalty', id],
    queryFn: async () => {
      const response = await api.get(`/royalties/${id}`);
      return response.data.data;
    },
  });

  useEffect(() => {
    if (royalty) {
      setItems(royalty.items || []);
      form.setFieldsValue({
        notes: royalty.notes,
      });
    }
  }, [royalty, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      await api.put(`/royalties/${id}`, {
        items: items.map(item => ({
          id: item.id,
          royalty_percentage: item.royalty_percentage,
        })),
        notes: values.notes,
      });
    },
    onSuccess: () => {
      message.success('Royalti berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['royalty', id] });
      navigate(`/admin/royalties/${id}`);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      if (values.proof && values.proof[0]) {
        formData.append('payment_proof', values.proof[0].originFileObj);
      }
      formData.append('payment_reference', values.reference || '');
      
      // Payment mark-paid endpoint might be different, let's assume this structure
      await api.put(`/payments/${royalty.payment.id}/mark-paid`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      message.success('Royalti berhasil ditandai sebagai dibayar');
      queryClient.invalidateQueries({ queryKey: ['royalty', id] });
      navigate(`/admin/royalties/${id}`);
    },
  });

  const handlePercentageChange = (id: number, value: number | null) => {
    if (value === null) return;
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newAmount = (item.quantity * Number(item.net_price) * value) / 100;
        return { ...item, royalty_percentage: value.toString(), amount: newAmount.toString() };
      }
      return item;
    }));
  };

  const columns = [
    {
      title: 'Buku',
      dataIndex: ['book', 'title'],
      key: 'book',
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
      render: (p: string) => `Rp ${Number(p).toLocaleString('id-ID')}`,
    },
    {
      title: '% Royalti',
      dataIndex: 'royalty_percentage',
      key: 'percentage',
      render: (p: string, record: RoyaltyItem) => (
        <InputNumber
          min={0}
          max={100}
          value={Number(p)}
          formatter={value => `${value}%`}
          parser={value => Number(value!.replace('%', ''))}
          onChange={(val) => handlePercentageChange(record.id, val)}
          disabled={royalty?.status !== 'draft'}
        />
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'amount',
      key: 'amount',
      render: (a: string) => `Rp ${Number(a).toLocaleString('id-ID')}`,
      align: 'right' as const,
    },
  ];

  if (isLoading) return <Card loading />;

  return (
    <div className="royalty-edit-page">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/admin/royalties')} style={{ cursor: 'pointer' }}>Manajemen Royalti</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate(`/admin/royalties/${id}`)} style={{ cursor: 'pointer' }}>Detail Royalti</Breadcrumb.Item>
        <Breadcrumb.Item>Edit Royalti</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/admin/royalties/${id}`)}>Batal</Button>
        <Title level={4} style={{ margin: '0 0 0 16px' }}>Edit Royalti #{id} - {royalty.author.name}</Title>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Penyesuaian Royalti" bordered={false}>
            <Table 
              columns={columns} 
              dataSource={items} 
              rowKey="id" 
              pagination={false}
              summary={(pageData) => {
                let total = 0;
                pageData.forEach(item => total += Number(item.amount));
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}><Text strong>Total Akhir</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right"><Text strong type="danger">Rp {total.toLocaleString('id-ID')}</Text></Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
            
            <Divider />
            
            <Form form={form} layout="vertical" onFinish={updateMutation.mutate}>
              <Form.Item name="notes" label="Catatan / Alasan Perubahan">
                <TextArea rows={4} placeholder="Berikan alasan jika ada perubahan persentase royalti..." />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  htmlType="submit"
                  loading={updateMutation.isPending}
                  disabled={royalty?.status !== 'draft'}
                >
                  Simpan Perubahan
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          {royalty.status === 'finalized' && royalty.payment && (
            <Card title="Konfirmasi Pembayaran" bordered={false}>
              <Form layout="vertical" onFinish={markAsPaidMutation.mutate}>
                <Form.Item name="reference" label="Referensi Pembayaran (No. Resi/Ref)">
                  <Input placeholder="Contoh: TRX-12345678" />
                </Form.Item>
                
                <Form.Item 
                  name="proof" 
                  label="Bukti Bayar (Screenshot/Struk)"
                  valuePropName="fileList"
                  getValueFromEvent={(e: any) => Array.isArray(e) ? e : e?.fileList}
                >
                  <Upload beforeUpload={() => false} maxCount={1} listType="picture">
                    <Button icon={<UploadOutlined />} block>Pilih File</Button>
                  </Upload>
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    icon={<DollarOutlined />} 
                    htmlType="submit" 
                    block
                    loading={markAsPaidMutation.isPending}
                  >
                    Konfirmasi Pembayaran
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          {royalty.status === 'draft' && (
            <Card bordered={false}>
              <Text type="secondary">
                Perhitungan royalti masih dalam status <b>Draft</b>. Anda dapat mengubah persentase royalti sebelum difinalisasi.
              </Text>
            </Card>
          )}

          {royalty.status === 'paid' && (
            <Card bordered={false}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Title level={5} type="success">Royalti Sudah Dibayar</Title>
                <Text type="secondary">Data tidak dapat diubah lagi.</Text>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default RoyaltyEditPage;

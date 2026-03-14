import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Divider,
  Timeline,
  Upload,
  message,
  Breadcrumb,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  PrinterOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../../api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { Title, Text, Paragraph } = Typography;

const RoyaltyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: royalty, isLoading } = useQuery({
    queryKey: ['royalty', id],
    queryFn: async () => {
      const response = await api.get(`/royalties/${id}`);
      return response.data.data;
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/royalties/${id}/finalize`);
    },
    onSuccess: () => {
      message.success('Royalti berhasil difinalisasi');
      queryClient.invalidateQueries({ queryKey: ['royalty', id] });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/royalties/${id}/invoice`);
    },
    onSuccess: () => {
      message.success('Invoice berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['royalty', id] });
    },
  });

  if (isLoading) return <Card loading />;
  if (!royalty) return <Empty description="Data royalti tidak ditemukan" />;

  const itemColumns = [
    {
      title: 'Buku',
      dataIndex: ['book', 'title'],
      key: 'book',
    },
    {
      title: 'Terjual',
      dataIndex: 'quantity',
      key: 'qty',
      render: (qty: number) => `${qty} eks`,
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
      title: 'Jumlah Royalti',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => `Rp ${Number(amount).toLocaleString('id-ID')}`,
      align: 'right' as const,
    },
  ];

  const getTimelineItems = () => {
    const items = [];
    
    if (royalty.calculated_at) {
      items.push({
        color: 'blue',
        children: (
          <>
            <Text strong>Dikalkulasi</Text>
            <br />
            <Text type="secondary">{dayjs(royalty.calculated_at).format('DD MMM YYYY HH:mm')}</Text>
          </>
        ),
      });
    }

    if (royalty.finalized_at) {
      items.push({
        color: 'green',
        children: (
          <>
            <Text strong>Difinalisasi</Text>
            <br />
            <Text type="secondary">{dayjs(royalty.finalized_at).format('DD MMM YYYY HH:mm')}</Text>
          </>
        ),
      });
    }

    if (royalty.payment?.paid_at) {
      items.push({
        color: 'gold',
        children: (
          <>
            <Text strong>Dibayar</Text>
            <br />
            <Text type="secondary">{dayjs(royalty.payment.paid_at).format('DD MMM YYYY HH:mm')}</Text>
          </>
        ),
      });
    }

    return items;
  };

  return (
    <div className="royalty-detail-page">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/admin/royalties')} style={{ cursor: 'pointer' }}>Manajemen Royalti</Breadcrumb.Item>
        <Breadcrumb.Item>Detail Royalti</Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/royalties')}>Kembali</Button>
          <Title level={4} style={{ margin: 0 }}>ID #{royalty.id} - {royalty.author.name}</Title>
          <Tag color={royalty.status === 'paid' ? 'gold' : royalty.status === 'finalized' ? 'green' : 'blue'}>
            {royalty.status.toUpperCase()}
          </Tag>
        </Space>
        <Space>
          <Button icon={<PrinterOutlined />}>Cetak Laporan</Button>
          {royalty.status === 'draft' && (
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => finalizeMutation.mutate()}
              loading={finalizeMutation.isPending}
            >
              Finalisasi
            </Button>
          )}
          {royalty.status === 'finalized' && !royalty.payment && (
            <Button 
              type="primary" 
              icon={<DollarOutlined />}
              onClick={() => createInvoiceMutation.mutate()}
              loading={createInvoiceMutation.isPending}
            >
              Buat Invoice Pembayaran
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Rincian Penjualan" bordered={false}>
            <Table 
              columns={itemColumns} 
              dataSource={royalty.items} 
              rowKey="id" 
              pagination={false}
              summary={(pageData) => {
                let totalAmount = 0;
                pageData.forEach((record) => {
                  totalAmount += Number((record as any).amount);
                });
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>Total Royalti</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong type="danger">
                        Rp {totalAmount.toLocaleString('id-ID')}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
            <div style={{ marginTop: 24 }}>
              <Title level={5}>Formula Perhitungan</Title>
              <Paragraph type="secondary">
                Royalti = Σ (Harga Net Buku x Jumlah Terjual x % Royalti per Buku)
              </Paragraph>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card title="Informasi Penulis" bordered={false}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nama">{royalty.author.name}</Descriptions.Item>
                <Descriptions.Item label="Nama Pena">{royalty.author.pen_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Email">{royalty.author.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{royalty.author.phone || '-'}</Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '12px 0' }} />
              <Descriptions title="Rekening Bank" column={1} size="small">
                <Descriptions.Item label="Bank">{royalty.author.bank_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="Nomor">{royalty.author.bank_account || '-'}</Descriptions.Item>
                <Descriptions.Item label="Atas Nama">{royalty.author.bank_account_name || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Status & Timeline" bordered={false}>
              <Timeline items={getTimelineItems()} />
            </Card>

            {royalty.payment && (
              <Card title="Informasi Pembayaran" bordered={false}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="No. Invoice">{royalty.payment.invoice_number}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={royalty.payment.status === 'paid' ? 'green' : 'orange'}>
                      {royalty.payment.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Tagihan">
                    Rp {Number(royalty.payment.amount).toLocaleString('id-ID')}
                  </Descriptions.Item>
                  {royalty.payment.paid_at && (
                    <Descriptions.Item label="Tanggal Bayar">
                      {dayjs(royalty.payment.paid_at).format('DD MMM YYYY')}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                
                <Divider style={{ margin: '12px 0' }} />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button block icon={<DownloadOutlined />}>Download Invoice (PDF)</Button>
                  {royalty.payment.status !== 'paid' ? (
                    <Button block type="primary" onClick={() => navigate(`/admin/royalties/${id}/edit`)}>
                      Upload Bukti Bayar
                    </Button>
                  ) : (
                    <Button block icon={<EyeOutlined />}>Lihat Bukti Bayar</Button>
                  )}
                </Space>
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default RoyaltyDetailPage;

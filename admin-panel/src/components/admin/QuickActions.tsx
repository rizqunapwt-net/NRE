import React from 'react';
import { Card, Button, Row, Col, Tooltip } from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  UploadOutlined,
  FileTextOutlined,
  DollarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './QuickActions.css';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Tambah Buku',
      icon: <PlusOutlined />,
      color: '#008B94',
      onClick: () => navigate('/admin/books/new'),
      description: 'Tambah buku baru',
    },
    {
      title: 'Tambah Penulis',
      icon: <UserAddOutlined />,
      color: '#8B5CF6',
      onClick: () => navigate('/admin/authors/new'),
      description: 'Daftar penulis baru',
    },
    {
      title: 'Upload Naskah',
      icon: <UploadOutlined />,
      color: '#10B981',
      onClick: () => navigate('/admin/manuscripts/upload'),
      description: 'Upload naskah masuk',
    },
    {
      title: 'Kelola Royalti',
      icon: <DollarOutlined />,
      color: '#F59E0B',
      onClick: () => navigate('/admin/royalties'),
      description: 'Pembayaran royalti',
    },
    {
      title: 'Content Editor',
      icon: <FileTextOutlined />,
      color: '#EC4899',
      onClick: () => navigate('/admin/website/faq'),
      description: 'Edit FAQ & Testimoni',
    },
    {
      title: 'Pengaturan',
      icon: <SettingOutlined />,
      color: '#6B7280',
      onClick: () => navigate('/admin/settings'),
      description: 'Konfigurasi sistem',
    },
  ];

  return (
    <Card title="⚡ Aksi Cepat" className="quick-actions-card">
      <Row gutter={[16, 16]}>
        {actions.map((action, index) => (
          <Col xs={12} sm={8} lg={4} key={index}>
            <Tooltip title={action.description} placement="top">
              <Button
                className="quick-action-btn"
                icon={action.icon}
                onClick={action.onClick}
                style={{ borderColor: action.color, color: action.color }}
                block
              >
                {action.title}
              </Button>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default QuickActions;

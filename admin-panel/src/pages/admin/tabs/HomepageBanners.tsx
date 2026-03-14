import React, { useEffect, useState } from 'react';
import {
  Card, Button, Space, Modal, Form, Input, Upload, Image, DatePicker, Switch, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined, CalendarOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import api from '../../../services/api';

const { TextArea } = Input;

const schema = yup.object({
  title: yup.string().required('Title is required').max(255),
  image: yup.string().url().required('Image URL is required').max(500),
  description: yup.string().max(500),
  link: yup.string().url().max(500),
  cta_text: yup.string().max(50),
  schedule_from: yup.date(),
  schedule_to: yup.date(),
  sort_order: yup.number(),
  is_active: yup.boolean(),
}).required();

type FormData = yup.InferType<typeof schema>;

interface Banner {
  id: number;
  title: string;
  image: string;
  description?: string;
  link?: string;
  cta_text: string;
  schedule_from?: string;
  schedule_to?: string;
  is_active: boolean;
  sort_order: number;
}

const HomepageBanners: React.FC = () => {
  const [form] = Form.useForm();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/banners');
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (error: any) {
      message.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBanner(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    form.setFieldsValue({
      ...banner,
      schedule_from: banner.schedule_from ? dayjs(banner.schedule_from) : null,
      schedule_to: banner.schedule_to ? dayjs(banner.schedule_to) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/admin/settings/banners/${id}`);
      if (response.data.success) {
        message.success('Banner deleted successfully');
        loadBanners();
      }
    } catch (error: any) {
      message.error('Failed to delete banner');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        schedule_from: data.schedule_from ? dayjs(data.schedule_from).format('YYYY-MM-DD') : null,
        schedule_to: data.schedule_to ? dayjs(data.schedule_to).format('YYYY-MM-DD') : null,
      };

      if (editingBanner) {
        const response = await api.put(`/admin/settings/banners/${editingBanner.id}`, payload);
        if (response.data.success) {
          message.success('Banner updated successfully');
          setModalVisible(false);
          loadBanners();
        }
      } else {
        const response = await api.post('/admin/settings/banners', payload);
        if (response.data.success) {
          message.success('Banner created successfully');
          setModalVisible(false);
          loadBanners();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Banner
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {banners.map((banner) => (
          <Card
            key={banner.id}
            className="banner-card"
            cover={
              banner.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title}
                  className="banner-image-preview"
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                />
              ) : (
                <div className="banner-placeholder">
                  <PictureOutlined style={{ fontSize: 48 }} />
                </div>
              )
            }
            title={banner.title}
            extra={
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(banner)} />
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(banner.id)} />
              </Space>
            }
          >
            <p style={{ color: '#666', marginBottom: 8 }}>{banner.description}</p>
            {banner.link && (
              <p style={{ fontSize: 13, color: '#1890ff' }}>
                Link: {banner.link}
              </p>
            )}
            <Space split={<span>|</span>} style={{ marginTop: 12, fontSize: 13 }}>
              <span>CTA: {banner.cta_text}</span>
              {banner.schedule_from && (
                <span><CalendarOutlined /> From: {dayjs(banner.schedule_from).format('MMM D, YYYY')}</span>
              )}
              {banner.is_active ? (
                <span style={{ color: '#52c41a' }}>● Active</span>
              ) : (
                <span style={{ color: '#999' }}>○ Inactive</span>
              )}
            </Space>
          </Card>
        ))}
      </div>

      <Modal
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="settings-modal"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleHookSubmit(onSubmit)}
        >
          <Form.Item
            label="Banner Title"
            name="title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="e.g., Summer Sale 2024" {...register('title')} />
          </Form.Item>

          <Form.Item
            label="Banner Image URL"
            name="image"
            rules={[{ required: true, message: 'Please enter image URL' }]}
          >
            <Input placeholder="https://example.com/banner.jpg" {...register('image')} />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <TextArea rows={3} placeholder="Banner description..." {...register('description')} />
          </Form.Item>

          <Form.Item
            label="Link/URL"
            name="link"
          >
            <Input placeholder="https://example.com/landing-page" {...register('link')} />
          </Form.Item>

          <Form.Item
            label="CTA Button Text"
            name="cta_text"
          >
            <Input placeholder="e.g., Learn More, Shop Now" maxLength={50} {...register('cta_text')} />
          </Form.Item>

          <Form.Item
            label="Schedule Visibility"
          >
            <Space.Compact style={{ width: '100%' }}>
              <DatePicker
                placeholder="From"
                style={{ width: '50%' }}
                {...register('schedule_from')}
              />
              <DatePicker
                placeholder="To"
                style={{ width: '50%' }}
                {...register('schedule_to')}
              />
            </Space.Compact>
          </Form.Item>

          <Form.Item
            label="Sort Order"
            name="sort_order"
          >
            <InputNumber min={0} style={{ width: '100%' }} {...register('sort_order', { valueAsNumber: true })} />
          </Form.Item>

          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
          >
            <Switch {...register('is_active')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingBanner ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default HomepageBanners;

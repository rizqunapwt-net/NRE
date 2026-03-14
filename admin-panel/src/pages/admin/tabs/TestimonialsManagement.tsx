import React, { useEffect, useState } from 'react';
import {
  Card, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Rate, Upload, Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined, UploadOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../../services/api';

const { TextArea } = Input;

const schema = yup.object({
  name: yup.string().required('Name is required').max(255),
  role: yup.string().required('Role is required').max(255),
  institution: yup.string().max(255),
  content: yup.string().required('Content is required'),
  avatar_url: yup.string().url().max(500),
  rating: yup.number().min(1).max(5),
  is_featured: yup.boolean(),
  is_active: yup.boolean(),
  sort_order: yup.number(),
}).required();

type FormData = yup.InferType<typeof schema>;

interface Testimonial {
  id: number;
  name: string;
  role: string;
  institution?: string;
  content: string;
  avatar_url?: string;
  rating: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const TestimonialsManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/testimonials?all=true');
      if (response.data.success) {
        setTestimonials(response.data.data);
      }
    } catch (error: any) {
      message.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTestimonial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    form.setFieldsValue(testimonial);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/admin/settings/testimonials/${id}`);
      if (response.data.success) {
        message.success('Testimonial deleted successfully');
        loadTestimonials();
      }
    } catch (error: any) {
      message.error('Failed to delete testimonial');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingTestimonial) {
        const response = await api.put(`/admin/settings/testimonials/${editingTestimonial.id}`, data);
        if (response.data.success) {
          message.success('Testimonial updated successfully');
          setModalVisible(false);
          loadTestimonials();
        }
      } else {
        const response = await api.post('/admin/settings/testimonials', data);
        if (response.data.success) {
          message.success('Testimonial created successfully');
          setModalVisible(false);
          loadTestimonials();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save testimonial');
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Testimonial
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {testimonials.map((testimonial) => (
          <Card
            key={testimonial.id}
            className="testimonial-card"
            title={
              <div className="testimonial-header">
                {testimonial.avatar_url ? (
                  <Image
                    src={testimonial.avatar_url}
                    alt={testimonial.name}
                    className="testimonial-avatar"
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                ) : (
                  <div className="testimonial-avatar" style={{ background: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {testimonial.name.charAt(0)}
                  </div>
                )}
                <div className="testimonial-info">
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-role">{testimonial.role}{testimonial.institution && ` at ${testimonial.institution}`}</p>
                </div>
                <div className="testimonial-rating">
                  <Rate disabled defaultValue={testimonial.rating} character={<StarOutlined />} />
                </div>
              </div>
            }
            extra={
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(testimonial)} />
                <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(testimonial.id)} />
              </Space>
            }
          >
            <div className="testimonial-content">
              {testimonial.content.length > 150
                ? `${testimonial.content.substring(0, 150)}...`
                : testimonial.content}
            </div>
            <div className="testimonial-actions">
              <Space>
                {testimonial.is_featured && <span style={{ color: '#faad14' }}>★ Featured</span>}
                {testimonial.is_active ? (
                  <span style={{ color: '#52c41a' }}>● Active</span>
                ) : (
                  <span style={{ color: '#999' }}>○ Inactive</span>
                )}
              </Space>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        title={editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
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
            label="Author Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="e.g., John Doe" {...register('name')} />
          </Form.Item>

          <Form.Item
            label="Role/Position"
            name="role"
            rules={[{ required: true, message: 'Please enter role' }]}
          >
            <Input placeholder="e.g., Professor, Author, etc." {...register('role')} />
          </Form.Item>

          <Form.Item
            label="Institution"
            name="institution"
          >
            <Input placeholder="e.g., University Name" {...register('institution')} />
          </Form.Item>

          <Form.Item
            label="Testimonial Content"
            name="content"
            rules={[{ required: true, message: 'Please enter testimonial' }]}
          >
            <TextArea rows={5} placeholder="Enter testimonial text..." {...register('content')} />
          </Form.Item>

          <Form.Item
            label="Avatar URL"
            name="avatar_url"
          >
            <Input placeholder="https://example.com/avatar.jpg" {...register('avatar_url')} />
          </Form.Item>

          <Form.Item
            label="Rating"
            name="rating"
          >
            <Rate character={<StarOutlined />} {...register('rating', { valueAsNumber: true })} />
          </Form.Item>

          <Form.Item
            label="Featured (Show on homepage)"
            name="is_featured"
            valuePropName="checked"
          >
            <Switch {...register('is_featured')} />
          </Form.Item>

          <Form.Item
            label="Active"
            name="is_active"
            valuePropName="checked"
          >
            <Switch {...register('is_active')} />
          </Form.Item>

          <Form.Item
            label="Sort Order"
            name="sort_order"
          >
            <InputNumber min={0} style={{ width: '100%' }} {...register('sort_order', { valueAsNumber: true })} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingTestimonial ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TestimonialsManagement;

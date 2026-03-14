import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Select, Switch, message, Tag, Popconfirm, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../../api';

const { TextArea } = Input;
const { Option } = Select;

const schema = yup.object({
  question: yup.string().required('Question is required').max(500),
  answer: yup.string().required('Answer is required'),
  category: yup.string().oneOf(['general', 'payment', 'publishing', 'technical']).required('Category is required'),
  sort_order: yup.number(),
  is_active: yup.boolean(),
}).required();

type FormData = yup.InferType<typeof schema>;

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const FAQManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/faqs?all=true');
      if (response.data.success) {
        setFaqs(response.data.data);
      }
    } catch (error: any) {
      message.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFaq(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    form.setFieldsValue(faq);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await api.delete(`/admin/settings/faqs/${id}`);
      if (response.data.success) {
        message.success('FAQ deleted successfully');
        loadFaqs();
      }
    } catch (error: any) {
      message.error('Failed to delete FAQ');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingFaq) {
        const response = await api.put(`/admin/settings/faqs/${editingFaq.id}`, data);
        if (response.data.success) {
          message.success('FAQ updated successfully');
          setModalVisible(false);
          loadFaqs();
        }
      } else {
        const response = await api.post('/admin/settings/faqs', data);
        if (response.data.success) {
          message.success('FAQ created successfully');
          setModalVisible(false);
          loadFaqs();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save FAQ');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'blue',
      payment: 'green',
      publishing: 'orange',
      technical: 'purple',
    };
    return colors[category] || 'default';
  };

  const columns = [
    {
      title: 'Question',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)} className="faq-category-badge">
          {category}
        </Tag>
      ),
    },
    {
      title: 'Order',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (isActive: boolean) => isActive ? '✓' : '✗',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: FAQ) => (
        <Space className="settings-table-actions">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete FAQ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add FAQ
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={faqs}
        rowKey="id"
        loading={loading}
        className="settings-table"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
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
            label="Question"
            name="question"
            rules={[{ required: true, message: 'Please enter question' }]}
          >
            <Input
              placeholder="Enter FAQ question..."
              prefix={<QuestionCircleOutlined />}
              {...register('question')}
            />
          </Form.Item>

          <Form.Item
            label="Answer"
            name="answer"
            rules={[{ required: true, message: 'Please enter answer' }]}
          >
            <TextArea
              rows={6}
              placeholder="Enter FAQ answer..."
              {...register('answer')}
            />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category" {...register('category')}>
              <Option value="general">General</Option>
              <Option value="payment">Payment</Option>
              <Option value="publishing">Publishing</Option>
              <Option value="technical">Technical</Option>
            </Select>
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
                {editingFaq ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FAQManagement;

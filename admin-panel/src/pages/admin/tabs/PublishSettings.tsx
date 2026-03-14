import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Button, message, Space, Row, Col, Select, Divider } from 'antd';
import { BookOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../../services/api';

const { Option } = Select;

const schema = yup.object({
  default_royalty_percentage: yup.number().min(0).max(100),
  minimum_withdrawal_balance: yup.number().min(0),
  payment_methods: yup.array().of(yup.string()),
  publishing_timeline_manuscript_review: yup.number().min(1),
  publishing_timeline_editing: yup.number().min(1),
  publishing_timeline_design: yup.number().min(1),
  publishing_timeline_proofreading: yup.number().min(1),
  publishing_timeline_printing: yup.number().min(1),
}).required();

type FormData = yup.InferType<typeof schema>;

const PublishSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings/publish');
      if (response.data.success) {
        form.setFieldsValue(response.data.data);
        reset(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await api.put('/admin/settings/publish', data);
      if (response.data.success) {
        message.success('Publish settings updated successfully!');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleHookSubmit(onSubmit)}
      className="settings-form"
    >
      <div className="form-section">
        <h3 className="form-section-title">
          <DollarOutlined /> Royalty & Payment Settings
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Default Royalty Percentage (%)"
              name="default_royalty_percentage"
              rules={[{ required: true, message: 'Please enter royalty percentage' }]}
            >
              <InputNumber
                min={0}
                max={100}
                formatter={(value) => `${value}%`}
                parser={(value) => Number(value?.replace('%', ''))}
                style={{ width: '100%' }}
                {...register('default_royalty_percentage')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Minimum Withdrawal Balance"
              name="minimum_withdrawal_balance"
              rules={[{ required: true, message: 'Please enter minimum balance' }]}
            >
              <InputNumber
                min={0}
                formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                parser={(value) => Number(value?.replace(/Rp\s?|(\.*)/g, ''))}
                style={{ width: '100%' }}
                {...register('minimum_withdrawal_balance')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Payment Methods"
              name="payment_methods"
            >
              <Select
                mode="multiple"
                placeholder="Select payment methods"
                {...register('payment_methods')}
              >
                <Option value="bank_transfer">Bank Transfer</Option>
                <Option value="e_wallet">E-Wallet (GoPay, OVO, Dana)</Option>
                <Option value="paypal">PayPal</Option>
                <Option value="check">Check</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <ClockCircleOutlined /> Publishing Timeline (Days)
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Manuscript Review"
              name="publishing_timeline_manuscript_review"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                formatter={(value) => `${value} days`}
                parser={(value) => Number(value?.replace(' days', ''))}
                style={{ width: '100%' }}
                {...register('publishing_timeline_manuscript_review')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Editing Process"
              name="publishing_timeline_editing"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                formatter={(value) => `${value} days`}
                parser={(value) => Number(value?.replace(' days', ''))}
                style={{ width: '100%' }}
                {...register('publishing_timeline_editing')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Design & Layout"
              name="publishing_timeline_design"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                formatter={(value) => `${value} days`}
                parser={(value) => Number(value?.replace(' days', ''))}
                style={{ width: '100%' }}
                {...register('publishing_timeline_design')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Proofreading"
              name="publishing_timeline_proofreading"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                formatter={(value) => `${value} days`}
                parser={(value) => Number(value?.replace(' days', ''))}
                style={{ width: '100%' }}
                {...register('publishing_timeline_proofreading')}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Printing"
              name="publishing_timeline_printing"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                min={1}
                formatter={(value) => `${value} days`}
                parser={(value) => Number(value?.replace(' days', ''))}
                style={{ width: '100%' }}
                {...register('publishing_timeline_printing')}
              />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="form-actions">
        <Space>
          <Button onClick={() => loadSettings()}>Reset</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Save Changes
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default PublishSettings;

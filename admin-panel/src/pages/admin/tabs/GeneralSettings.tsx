import React, { useEffect } from 'react';
import { Form, Input, Button, message, Space, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, LinkOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../../api';

const schema = yup.object({
  company_name: yup.string().max(255),
  company_logo: yup.string().url().max(500),
  company_description: yup.string(),
  contact_email: yup.string().email(),
  contact_phone: yup.string().max(50),
  contact_address: yup.string(),
  social_facebook: yup.string().url().max(500),
  social_instagram: yup.string().url().max(500),
  social_linkedin: yup.string().url().max(500),
  social_twitter: yup.string().url().max(500),
}).required();

type FormData = yup.InferType<typeof schema>;

const GeneralSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/admin/settings/general');
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
      const response = await api.put('/admin/settings/general', data);
      if (response.data.success) {
        message.success('General settings updated successfully!');
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
          <UserOutlined /> Company Information
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Company Name"
              name="company_name"
              rules={[{ required: true, message: 'Please enter company name' }]}
            >
              <Input placeholder="e.g., Rizquna Publishing" {...register('company_name')} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Company Logo URL"
              name="company_logo"
            >
              <Input placeholder="https://example.com/logo.png" {...register('company_logo')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Company Description"
          name="company_description"
        >
          <Input.TextArea
            rows={4}
            placeholder="Brief description about your company..."
            {...register('company_description')}
          />
        </Form.Item>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <MailOutlined /> Contact Information
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Email"
              name="contact_email"
              rules={[{ type: 'email', message: 'Please enter valid email' }]}
            >
              <Input placeholder="contact@company.com" prefix={<MailOutlined />} {...register('contact_email')} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Phone"
              name="contact_phone"
            >
              <Input placeholder="+62 812 3456 7890" prefix={<PhoneOutlined />} {...register('contact_phone')} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label="Address"
              name="contact_address"
            >
              <Input placeholder="Company address" prefix={<EnvironmentOutlined />} {...register('contact_address')} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">
          <LinkOutlined /> Social Media Links
        </h3>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Facebook"
              name="social_facebook"
            >
              <Input placeholder="https://facebook.com/yourpage" {...register('social_facebook')} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Instagram"
              name="social_instagram"
            >
              <Input placeholder="https://instagram.com/yourpage" {...register('social_instagram')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="LinkedIn"
              name="social_linkedin"
            >
              <Input placeholder="https://linkedin.com/company/yourpage" {...register('social_linkedin')} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Twitter / X"
              name="social_twitter"
            >
              <Input placeholder="https://twitter.com/yourpage" {...register('social_twitter')} />
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

export default GeneralSettings;

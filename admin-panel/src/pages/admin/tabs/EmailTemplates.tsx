import React, { useEffect, useState } from 'react';
import {
  List, Button, Modal, Form, Input, Space, message, Tag, Typography, Divider,
} from 'antd';
import { MailOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../../../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

const schema = yup.object({
  subject: yup.string().required('Subject is required').max(500),
  body: yup.string().required('Body is required'),
  test_email: yup.string().email(),
}).required();

type FormData = yup.InferType<typeof schema>;

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
}

interface TemplateContent {
  id: string;
  subject: string;
  body: string;
  variables: string[];
}

const EmailTemplates: React.FC = () => {
  const [form] = Form.useForm();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState<TemplateContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/settings/email-templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      message.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setLoading(true);
    try {
      const response = await api.get(`/admin/settings/email-templates/${template.id}`);
      if (response.data.success) {
        setTemplateContent(response.data.data);
        form.setFieldsValue({
          subject: response.data.data.subject,
          body: response.data.data.body,
        });
        setModalVisible(true);
      }
    } catch (error: any) {
      message.error('Failed to load template content');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    form.resetFields();
    setTestModalVisible(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedTemplate) return;

    try {
      const response = await api.put(`/admin/settings/email-templates/${selectedTemplate.id}`, {
        subject: data.subject,
        body: data.body,
      });
      if (response.data.success) {
        message.success('Email template updated successfully');
        setModalVisible(false);
        loadTemplates();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to update template');
    }
  };

  const handleSendTest = async (data: FormData) => {
    if (!selectedTemplate) return;

    try {
      const response = await api.post(`/admin/settings/email-templates/${selectedTemplate.id}/test`, {
        email: data.test_email,
      });
      if (response.data.success) {
        message.success(`Test email sent to ${data.test_email}`);
        setTestModalVisible(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to send test email');
    }
  };

  return (
    <>
      <Title level={5}>Email Templates</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Customize email templates sent to users for various events
      </Text>

      <List
        dataSource={templates}
        loading={loading}
        renderItem={(template) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(template)}
              >
                Edit
              </Button>,
              <Button
                key="test"
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleTest(template)}
              >
                Test
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MailOutlined style={{ fontSize: 24, color: '#1890ff' }} /></div>}
              title={template.name}
              description={template.description}
            />
          </List.Item>
        )}
      />

      {/* Edit Template Modal */}
      <Modal
        title={
          <Space>
            <MailOutlined />
            Edit Email Template: {selectedTemplate?.name}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        className="settings-modal"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleHookSubmit(onSubmit)}
        >
          <Form.Item
            label="Email Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input
              placeholder="Email subject line..."
              {...register('subject')}
            />
          </Form.Item>

          <Form.Item
            label="Email Body"
            name="body"
            rules={[{ required: true, message: 'Please enter email body' }]}
          >
            <TextArea
              rows={12}
              placeholder="Email content..."
              style={{ fontFamily: 'monospace' }}
              {...register('body')}
            />
          </Form.Item>

          {templateContent && (
            <div className="email-template-editor">
              <Divider orientation="left">Available Variables</Divider>
              <div className="template-variables">
                <div className="template-variables-title">
                  You can use these variables in subject and body:
                </div>
                <Space wrap>
                  {templateContent.variables.map((variable) => (
                    <Tag key={variable} color="blue" className="variable-tag">
                      {variable}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Update Template
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Test Email Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Send Test Email: {selectedTemplate?.name}
          </Space>
        }
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleHookSubmit(handleSendTest)}
        >
          <Form.Item
            label="Test Email Address"
            name="test_email"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input
              placeholder="your@email.com"
              {...register('test_email')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setTestModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Send Test Email
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EmailTemplates;

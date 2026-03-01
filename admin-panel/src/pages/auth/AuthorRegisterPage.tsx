import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BookOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import api from '../../api';
import './AuthPages.css';

const AuthorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [form] = Form.useForm();

  const steps = [
    { title: 'Akun', icon: <UserOutlined /> },
    { title: 'Profil', icon: <BookOutlined /> },
    { title: 'Bank', icon: <BankOutlined /> },
    { title: 'Selesai', icon: <CheckCircleOutlined /> },
  ];

  const nextStep = () => {
    form.validateFields().then((values) => {
      setFormData({ ...formData, ...values });
      setCurrentStep(currentStep + 1);
    }).catch(() => {});
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const finalData = { ...formData, ...values };
      
      await api.post('/authors/register', {
        name: finalData.name,
        username: finalData.username,
        email: finalData.email,
        password: finalData.password,
        password_confirmation: finalData.password_confirmation,
        phone: finalData.phone,
        bio: finalData.bio,
        bank_name: finalData.bank_name,
        bank_account: finalData.bank_account,
        bank_account_name: finalData.bank_account_name,
      });

      message.success({
        content: '🎉 Pendaftaran berhasil! Silakan login.',
        duration: 5,
        icon: <CheckCircleOutlined style={{ color: '#10B981' }} />,
      });

      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: finalData.email } });
      }, 2000);
    } catch (error: any) {
      message.error({
        content: error.response?.data?.message || 'Pendaftaran gagal',
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-v2">
      <div className="auth-form-side-v2">
        <div className="auth-container-v2">
          <div className="auth-logo-v2">
            <h1 className="auth-brand-name">Rizquna ERP</h1>
            <p className="auth-brand-tagline">Author Registration</p>
          </div>

          {/* Progress Steps */}
          <div className="steps-container-v2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`step-v2 ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-icon-v2">
                  {index < currentStep ? <CheckCircleOutlined /> : step.icon}
                </div>
                <div className="step-title-v2">{step.title}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="progress-bar-v2">
            <div
              className="progress-fill-v2"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="step-content-v2"
            >
              <h3 className="step-title-content-v2">Informasi Akun</h3>
              <Form form={form} layout="vertical" size="large" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Nama Lengkap"
                      rules={[
                        { required: true, message: 'Nama wajib diisi' },
                        { min: 3, message: 'Minimal 3 karakter' }
                      ]}
                    >
                      <Input prefix={<UserOutlined className="icon-gray" />} placeholder="Nama lengkap" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      label="Username"
                      rules={[
                        { required: true, message: 'Username wajib diisi' },
                        { min: 3, message: 'Minimal 3 karakter' }
                      ]}
                    >
                      <Input prefix={<UserOutlined className="icon-gray" />} placeholder="username" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Email wajib diisi' },
                    { type: 'email', message: 'Format email tidak valid' }
                  ]}
                >
                  <Input prefix={<MailOutlined className="icon-gray" />} placeholder="email@contoh.com" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="password"
                      label="Password"
                      rules={[
                        { required: true, message: 'Password wajib diisi' },
                        { min: 8, message: 'Minimal 8 karakter' }
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined className="icon-gray" />} placeholder="••••••••" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="password_confirmation"
                      label="Konfirmasi Password"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Konfirmasi password wajib diisi' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                            return Promise.reject(new Error('Password tidak cocok'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined className="icon-gray" />} placeholder="••••••••" />
                    </Form.Item>
                  </Col>
                </Row>

                <Button type="primary" block size="large" onClick={nextStep} className="auth-btn-primary-v2">
                  Lanjut →
                </Button>
              </Form>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="step-content-v2"
            >
              <h3 className="step-title-content-v2">Profil Penulis</h3>
              <Form form={form} layout="vertical" size="large" onFinish={onFinish}>
                <Form.Item
                  name="phone"
                  label="Nomor Telepon"
                  rules={[
                    { required: true, message: 'Nomor telepon wajib diisi' },
                    { pattern: /^[0-9+\-\s()]+$/, message: 'Format tidak valid' }
                  ]}
                >
                  <Input prefix={<PhoneOutlined className="icon-gray" />} placeholder="08123456789" />
                </Form.Item>

                <Form.Item
                  name="bio"
                  label="Biografi Singkat"
                  rules={[{ min: 10, message: 'Minimal 10 karakter' }]}
                >
                  <Input.TextArea rows={4} placeholder="Ceritakan tentang diri Anda..." showCount maxLength={500} />
                </Form.Item>

                <div className="step-actions-v2">
                  <Button size="large" onClick={prevStep} className="auth-btn-outline-v2">
                    ← Kembali
                  </Button>
                  <Button type="primary" size="large" onClick={nextStep} className="auth-btn-primary-v2">
                    Lanjut →
                  </Button>
                </div>
              </Form>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="step-content-v2"
            >
              <h3 className="step-title-content-v2">Informasi Bank</h3>
              <Alert
                message="Informasi ini digunakan untuk pembayaran royalti"
                type="info"
                showIcon
                className="auth-alert-v2"
              />
              <Form form={form} layout="vertical" size="large" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="bank_name"
                      label="Nama Bank"
                      rules={[{ required: true, message: 'Nama bank wajib diisi' }]}
                    >
                      <Input prefix={<BankOutlined className="icon-gray" />} placeholder="BCA, Mandiri, dll" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="bank_account"
                      label="Nomor Rekening"
                      rules={[
                        { required: true, message: 'Nomor rekening wajib diisi' },
                        { pattern: /^[0-9]+$/, message: 'Hanya angka' }
                      ]}
                    >
                      <Input prefix={<BankOutlined className="icon-gray" />} placeholder="1234567890" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="bank_account_name"
                  label="Nama Pemilik Rekening"
                  rules={[{ required: true, message: 'Nama pemilik rekening wajib diisi' }]}
                >
                  <Input prefix={<UserOutlined className="icon-gray" />} placeholder="Nama sesuai rekening" />
                </Form.Item>

                <div className="step-actions-v2">
                  <Button size="large" onClick={prevStep} className="auth-btn-outline-v2">
                    ← Kembali
                  </Button>
                  <Button type="primary" htmlType="submit" size="large" loading={loading} className="auth-btn-primary-v2">
                    {loading ? 'Mendaftar...' : 'Daftar Sekarang'} ✓
                  </Button>
                </div>
              </Form>
            </motion.div>
          )}
        </div>
      </div>

      <div className="auth-brand-side-v2">
        <div className="auth-brand-content-v2">
          <div className="auth-brand-badge-v2">✨ Menjadi Penulis</div>
          <h2 className="auth-brand-title-v2">
            Publikasikan Karya Anda<br />Untuk Jutaan Pembaca
          </h2>
          <p className="auth-brand-description-v2">
            Bergabunglah dengan ekosistem penerbitan modern.
            Kami bantu Anda dari naskah hingga distribusi.
          </p>
          
          <div className="auth-features-v2">
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">📚</div>
              <div>
                <h4 className="auth-feature-title-v2">Publikasi Profesional</h4>
                <p className="auth-feature-desc-v2">Standar penerbitan internasional</p>
              </div>
            </div>
            
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">💵</div>
              <div>
                <h4 className="auth-feature-title-v2">Royalti Hingga 10%</h4>
                <p className="auth-feature-desc-v2">Penghasilan pasif dari karya Anda</p>
              </div>
            </div>
            
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">📈</div>
              <div>
                <h4 className="auth-feature-title-v2">Dashboard Analytics</h4>
                <p className="auth-feature-desc-v2">Track penjualan real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorRegisterPage;

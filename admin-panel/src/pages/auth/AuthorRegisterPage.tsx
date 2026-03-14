import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Row, Col, message, Typography, ConfigProvider, Steps } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, BookOutlined, BankOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import { designTokens } from '../../theme/designTokens';

const { Title, Text, Paragraph } = Typography;

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

  const brandingSection = (
    <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-teal-900 relative overflow-hidden items-center justify-center p-12">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#008B94,transparent)]" />
        <svg className="absolute w-full h-full" width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-md text-white">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
          <span className="text-3xl font-bold">R</span>
        </div>
        <Title level={1} className="!text-white !font-serif !text-4xl !mb-6 leading-tight">
          Menjadi Penulis Profesional.
        </Title>
        <Paragraph className="text-teal-100 text-base mb-10 leading-relaxed">
          Wujudkan karya impian Anda. Kami menyediakan platform terintegrasi untuk membantu penulis mengelola naskah hingga distribusi.
        </Paragraph>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="text-xl mt-1">📚</div>
            <div>
              <Title level={5} className="!text-white !m-0">Publikasi Terstruktur</Title>
              <Text className="text-teal-200 text-xs">Kelola ISBN & Legal Deposit otomatis</Text>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="text-xl mt-1">💹</div>
            <div>
              <Title level={5} className="!text-white !m-0">Bagi Hasil Adil</Title>
              <Text className="text-teal-200 text-xs">Royalti transparan & laporan real-time</Text>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500 rounded-full blur-[100px] opacity-20" />
    </div>
  );

  return (
    <ConfigProvider theme={{ 
      token: { 
        colorPrimary: designTokens.colors.primary[500], 
        borderRadius: 12,
        fontFamily: designTokens.typography.fontFamily.primary 
      } 
    }}>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
        {brandingSection}

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <Link to="/login" className="text-slate-400 hover:text-teal-600 flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeftOutlined /> Kembali ke Login
              </Link>
            </div>

            <div className="mb-10">
              <Title level={2} className="!m-0 !font-serif">Pendaftaran Penulis</Title>
              <Text className="text-slate-400">Lengkapi data untuk bergabung sebagai penulis Rizquna.</Text>
            </div>

            <Steps 
              current={currentStep} 
              items={steps} 
              className="mb-10"
              responsive={false}
            />

            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Title level={4} className="mb-6">Informasi Akun Utama</Title>
                  <Form form={form} layout="vertical" size="large" requiredMark={false}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="name"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</Text>}
                          rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                          <Input prefix={<UserOutlined className="text-slate-300" />} placeholder="Nama lengkap" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="username"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Username</Text>}
                          rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                          <Input prefix={<UserOutlined className="text-slate-300" />} placeholder="username" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="email"
                      label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Alamat Email</Text>}
                      rules={[{ required: true, message: 'Wajib diisi' }, { type: 'email' }]}
                    >
                      <Input prefix={<MailOutlined className="text-slate-300" />} placeholder="email@contoh.com" />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="password"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</Text>}
                          rules={[{ required: true, message: 'Wajib diisi' }, { min: 8 }]}
                        >
                          <Input.Password prefix={<LockOutlined className="text-slate-300" />} placeholder="••••••••" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="password_confirmation"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Konfirmasi</Text>}
                          dependencies={['password']}
                          rules={[
                            { required: true, message: 'Wajib diisi' },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject(new Error('Password tidak cocok'));
                              },
                            }),
                          ]}
                        >
                          <Input.Password prefix={<LockOutlined className="text-slate-300" />} placeholder="••••••••" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Button type="primary" block size="large" onClick={nextStep} className="h-12 mt-4 bg-teal-700 hover:bg-teal-800 border-none font-bold">
                      Langkah Selanjutnya →
                    </Button>
                  </Form>
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Title level={4} className="mb-6">Profil & Kontak</Title>
                  <Form form={form} layout="vertical" size="large" requiredMark={false}>
                    <Form.Item
                      name="phone"
                      label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Telepon/WA</Text>}
                      rules={[{ required: true, message: 'Wajib diisi' }]}
                    >
                      <Input prefix={<PhoneOutlined className="text-slate-300" />} placeholder="08123456789" />
                    </Form.Item>

                    <Form.Item
                      name="bio"
                      label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Biografi Singkat</Text>}
                      rules={[{ min: 10, message: 'Minimal 10 karakter' }]}
                    >
                      <Input.TextArea rows={4} placeholder="Ceritakan sedikit tentang latar belakang menulis Anda..." showCount maxLength={500} className="rounded-xl" />
                    </Form.Item>

                    <div className="flex gap-4 mt-6">
                      <Button size="large" onClick={prevStep} className="flex-1 h-12 rounded-xl">
                        ← Kembali
                      </Button>
                      <Button type="primary" size="large" onClick={nextStep} className="flex-[2] h-12 bg-teal-700 hover:bg-teal-800 border-none font-bold rounded-xl">
                        Lanjut ke Informasi Bank →
                      </Button>
                    </div>
                  </Form>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Title level={4} className="mb-2">Informasi Pembayaran</Title>
                  <Paragraph className="text-slate-400 mb-8">Data ini diperlukan untuk pengiriman royalti hasil penjualan karya Anda.</Paragraph>
                  
                  <Form form={form} layout="vertical" size="large" onFinish={onFinish} requiredMark={false}>
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="bank_name"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Bank</Text>}
                          rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                          <Input prefix={<BankOutlined className="text-slate-300" />} placeholder="BCA, Mandiri, dll" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="bank_account"
                          label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Rekening</Text>}
                          rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                          <Input prefix={<BankOutlined className="text-slate-300" />} placeholder="1234567890" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="bank_account_name"
                      label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Pemilik Rekening</Text>}
                      rules={[{ required: true, message: 'Wajib diisi' }]}
                    >
                      <Input prefix={<UserOutlined className="text-slate-300" />} placeholder="Nama sesuai di buku tabungan" />
                    </Form.Item>

                    <div className="flex gap-4 mt-8">
                      <Button size="large" onClick={prevStep} className="flex-1 h-12 rounded-xl">
                        ← Kembali
                      </Button>
                      <Button type="primary" htmlType="submit" size="large" loading={loading} className="flex-[2] h-12 bg-teal-700 hover:bg-teal-800 border-none font-bold rounded-xl shadow-lg shadow-teal-700/20">
                        {loading ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran ✓'}
                      </Button>
                    </div>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AuthorRegisterPage;

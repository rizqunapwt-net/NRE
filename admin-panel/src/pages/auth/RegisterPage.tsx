import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Typography, ConfigProvider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined, ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import api from '../../api';
import { designTokens } from '../../theme/designTokens';

const { Title, Text, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        phone: values.phone,
      });

      setSuccess(true);
      // Success state is handled in the UI
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registrasi gagal, coba lagi.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const brandingSection = (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-teal-900 relative overflow-hidden items-center justify-center p-12">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#008B94,transparent)]" />
        <svg className="absolute w-full h-full" width="100%" height="100%">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-lg text-white">
        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
          <span className="text-3xl font-bold">R</span>
        </div>
        <Title level={1} className="!text-white !font-serif !text-5xl !mb-6 leading-tight">
          Bergabunglah dengan<br />Ekosistem Digital Kami.
        </Title>
        <Paragraph className="text-teal-100 text-lg mb-10 leading-relaxed">
          Mulai langkah pertama Anda dalam dunia penerbitan modern bersama Rizquna ERP. Dari naskah hingga distribusi, semua dalam satu platform.
        </Paragraph>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="text-2xl">📖</div>
            <div>
              <Title level={5} className="!text-white !m-0">Publikasi Mudah</Title>
              <Text className="text-teal-200 text-xs">Proses transparan & profesional</Text>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <div className="text-2xl">💰</div>
            <div>
              <Title level={5} className="!text-white !m-0">Royalti Transparan</Title>
              <Text className="text-teal-200 text-xs">Pantau penghasilan secara real-time</Text>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500 rounded-full blur-[120px] opacity-20" />
    </div>
  );

  if (success) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: designTokens.colors.primary[500], borderRadius: 12 } }}>
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
          {brandingSection}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
            <div className="w-full max-w-md text-center">
              <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircleFilled className="text-5xl text-teal-500" />
              </div>
              <Title level={2} className="!font-serif !mb-4">Registrasi Berhasil!</Title>
              <Paragraph className="text-slate-500 text-lg mb-8">
                Akun Anda telah berhasil dibuat. Silakan login untuk mulai menjelajahi platform kami.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                block
                className="h-12 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 border-none shadow-lg shadow-teal-700/20"
                onClick={() => navigate('/login')}
              >
                Masuk ke Akun
              </Button>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ token: { colorPrimary: designTokens.colors.primary[500], borderRadius: 12 } }}>
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
        {brandingSection}

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link to="/login" className="text-slate-400 hover:text-teal-600 flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeftOutlined /> Kembali ke Login
              </Link>
            </div>

            <div className="mb-8">
              <Title level={2} className="!m-0 !font-serif">Buat Akun Baru</Title>
              <Text className="text-slate-400">Daftar sekarang untuk mulai menerbitkan karya Anda.</Text>
            </div>

            {error && (
              <Alert
                type="error"
                message="Registrasi Gagal"
                description={error}
                showIcon
                closable
                onClose={() => setError(null)}
                className="mb-6 rounded-xl"
              />
            )}

            <Form
              name="register"
              onFinish={handleRegister}
              layout="vertical"
              size="large"
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Lengkap</Text>}
                rules={[{ required: true, message: 'Nama lengkap wajib diisi' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-300" />}
                  placeholder="Nama sesuai identitas"
                  className="rounded-xl h-12 border-slate-200"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Alamat Email</Text>}
                rules={[
                  { required: true, message: 'Email wajib diisi' },
                  { type: 'email', message: 'Format email tidak valid' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-300" />}
                  placeholder="anda@email.com"
                  className="rounded-xl h-12 border-slate-200"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Nomor Telepon</Text>}
                rules={[{ required: true, message: 'Nomor telepon wajib diisi' }]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-300" />}
                  placeholder="08123456789"
                  className="rounded-xl h-12 border-slate-200"
                />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="password"
                  label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Kata Sandi</Text>}
                  rules={[{ required: true, message: 'Wajib diisi' }, { min: 8, message: 'Min 8 karakter' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-slate-300" />}
                    placeholder="••••••••"
                    className="rounded-xl h-12 border-slate-200"
                  />
                </Form.Item>

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
                  <Input.Password
                    prefix={<LockOutlined className="text-slate-300" />}
                    placeholder="••••••••"
                    className="rounded-xl h-12 border-slate-200"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="agree"
                valuePropName="checked"
                rules={[
                  { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Anda harus menyetujui S&K')) }
                ]}
              >
                <Checkbox className="text-slate-500 text-sm">
                  Saya setuju dengan <Link to="/terms" className="text-teal-600 font-semibold">Syarat & Ketentuan</Link>
                </Checkbox>
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="h-12 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 border-none shadow-lg shadow-teal-700/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </Button>
            </Form>

            <div className="mt-8 text-center">
              <Text className="text-slate-400">Sudah memiliki akun?</Text>
              <Link to="/login" className="ml-2 text-teal-600 font-bold hover:underline">Masuk di sini</Link>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RegisterPage;

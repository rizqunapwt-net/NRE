import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Divider, Alert, Checkbox, Typography, ConfigProvider } from 'antd';
import { LockOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { designTokens } from '../../theme/designTokens';

const { Title, Text, Paragraph } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/dashboard';
  const registeredEmail = location.state?.registeredEmail;

  const handleLogin = async (values: any) => {
    setLoading(true);
    setError(null);
    
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google/redirect';
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: designTokens.colors.primary[500],
          borderRadius: 12,
        }
      }}
    >
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans">
        {/* Left Side: Visual/Branding (Hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-teal-900 relative overflow-hidden items-center justify-center p-12">
          {/* Background Pattern/Overlay */}
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
              Ekosistem Digital <br />Penerbitan Masa Depan.
            </Title>
            <Paragraph className="text-teal-100 text-lg mb-10 leading-relaxed">
              Kelola naskah, pantau proses editorial, dan distribusikan karya terbaik Anda dalam satu platform terintegrasi.
            </Paragraph>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <Title level={4} className="!text-white !m-0">Real-time</Title>
                <Text className="text-teal-200 text-xs">Tracking naskah & ISBN</Text>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <Title level={4} className="!text-white !m-0">Otomatis</Title>
                <Text className="text-teal-200 text-xs">Laporan royalti & penjualan</Text>
              </div>
            </div>
          </div>
          
          {/* Decorative Circle */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500 rounded-full blur-[120px] opacity-20" />
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
          <div className="w-full max-w-md">
            {/* Back to Home */}
            <div className="mb-12">
              <Link to="/" className="text-slate-400 hover:text-teal-600 flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeftOutlined /> Kembali ke Beranda
              </Link>
            </div>

            <div className="mb-10">
              <Title level={2} className="!m-0 !font-serif">Masuk ke Akun</Title>
              <Text className="text-slate-400">Selamat datang kembali! Silakan masukkan detail Anda.</Text>
            </div>

            {/* Notifications */}
            {registeredEmail && (
              <Alert
                type="success"
                message="Registrasi Berhasil"
                description={`Silakan login menggunakan email: ${registeredEmail}`}
                showIcon
                className="mb-6 rounded-xl"
              />
            )}

            {error && (
              <Alert
                type="error"
                message="Login Gagal"
                description={error}
                showIcon
                closable
                onClose={() => setError(null)}
                className="mb-6 rounded-xl"
              />
            )}

            <Form
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              initialValues={{ remember: true }}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label={<Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Alamat Email</Text>}
                rules={[
                  { required: true, message: 'Email tidak boleh kosong' },
                  { type: 'email', message: 'Format email tidak valid' }
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-300" />}
                  placeholder="anda@email.com"
                  className="rounded-xl h-12 border-slate-200 focus:border-teal-500"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <div className="flex justify-between items-center w-full">
                    <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">Kata Sandi</Text>
                    <Link to="/lupa-password" title="Lupa Password?" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                      Lupa?
                    </Link>
                  </div>
                }
                rules={[{ required: true, message: 'Kata sandi tidak boleh kosong' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-300" />}
                  placeholder="••••••••"
                  className="rounded-xl h-12 border-slate-200 focus:border-teal-500"
                />
              </Form.Item>

              <div className="flex items-center justify-between mb-8">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox className="text-slate-500 text-sm">Ingat saya untuk 30 hari</Checkbox>
                </Form.Item>
              </div>

              <Form.Item className="mb-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="h-12 rounded-xl font-bold bg-teal-700 hover:bg-teal-800 border-none shadow-lg shadow-teal-700/20 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Menghubungkan...' : 'Masuk Sekarang'}
                </Button>
              </Form.Item>
            </Form>

            <Divider className="!my-8">
              <Text className="text-slate-300 text-xs font-bold uppercase tracking-widest">Atau masuk dengan</Text>
            </Divider>

            <Button
              block
              size="large"
              onClick={handleGoogleLogin}
              className="h-12 rounded-xl border-slate-200 hover:border-teal-500 hover:text-teal-600 font-medium flex items-center justify-center gap-3 transition-all"
              icon={
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              }
            >
              Google Account
            </Button>

            <div className="mt-10 text-center">
              <Text className="text-slate-400">Belum memiliki akun?</Text>
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mt-2">
                <Link to="/register" className="text-teal-600 font-bold hover:underline">Daftar Akun Umum</Link>
                <span className="hidden sm:inline text-slate-200">|</span>
                <Link to="/author-register" className="text-teal-600 font-bold hover:underline">Daftar sebagai Penulis</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default LoginPage;

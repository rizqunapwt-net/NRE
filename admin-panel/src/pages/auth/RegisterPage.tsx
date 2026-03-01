import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Divider, Alert, Checkbox } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../../api';
import './AuthPages.css';

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
      setTimeout(() => {
        navigate('/login', { state: { registeredEmail: values.email } });
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Registrasi gagal, coba lagi.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page-v2">
        <div className="auth-form-side-v2">
          <div className="auth-container-v2" style={{ textAlign: 'center' }}>
            <div className="success-icon-v2">✅</div>
            <h2 className="auth-title-v2">Registrasi Berhasil!</h2>
            <p className="auth-subtitle-v2">
              Akun Anda telah dibuat. Silakan login untuk melanjutkan.
            </p>
            <Button
              type="primary"
              size="large"
              block
              className="auth-btn-primary-v2"
              onClick={() => navigate('/login')}
            >
              Ke Halaman Login
            </Button>
          </div>
        </div>
        <div className="auth-brand-side-v2">
          <div className="auth-brand-content-v2">
            <h2 className="auth-brand-title-v2">Selamat Bergabung!</h2>
            <p className="auth-brand-description-v2">
              Mulai perjalanan Anda dalam dunia penerbitan bersama Rizquna ERP.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-v2">
      <div className="auth-form-side-v2">
        <div className="auth-container-v2">
          <div className="auth-logo-v2">
            <h1 className="auth-brand-name">Rizquna ERP</h1>
            <p className="auth-brand-tagline">Publishing Management System</p>
          </div>

          <div className="auth-welcome-v2">
            <h2 className="auth-title-v2">Buat Akun Baru</h2>
            <p className="auth-subtitle-v2">
              Mulai langkah pertama Anda dalam penerbitan
            </p>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              closable
              onClose={() => setError(null)}
              className="auth-alert-v2"
            />
          )}

          <Form
            name="register"
            onFinish={handleRegister}
            layout="vertical"
            size="large"
            className="auth-form-v2"
          >
            <Form.Item
              name="name"
              label="Nama Lengkap"
              rules={[
                { required: true, message: 'Nama lengkap wajib diisi' },
                { min: 3, message: 'Nama minimal 3 karakter' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="icon-gray" />}
                placeholder="Nama lengkap"
                className="auth-input-v2"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email wajib diisi' },
                { type: 'email', message: 'Format email tidak valid' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="icon-gray" />}
                placeholder="nama@email.com"
                className="auth-input-v2"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Nomor Telepon"
              rules={[
                { required: true, message: 'Nomor telepon wajib diisi' },
                { pattern: /^[0-9+\-\s()]+$/, message: 'Format nomor tidak valid' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="icon-gray" />}
                placeholder="08123456789"
                className="auth-input-v2"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Password wajib diisi' },
                { min: 8, message: 'Minimal 8 karakter' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="icon-gray" />}
                placeholder="Minimal 8 karakter"
                className="auth-input-v2"
              />
            </Form.Item>

            <Form.Item
              name="password_confirmation"
              label="Konfirmasi Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Konfirmasi password wajib diisi' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Password tidak cocok'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="icon-gray" />}
                placeholder="Ulangi password"
                className="auth-input-v2"
              />
            </Form.Item>

            <Form.Item
              name="agree"
              valuePropName="checked"
              rules={[
                { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('Anda harus menyetujui syarat & ketentuan')) }
              ]}
            >
              <Checkbox>
                Saya setuju dengan{' '}
                <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer">
                  Ketentuan & Privasi
                </a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                className="auth-btn-primary-v2"
              >
                {loading ? 'Mendaftar...' : 'Buat Akun'}
              </Button>
            </Form.Item>
          </Form>

          <Divider className="auth-divider-v2">Sudah punya akun?</Divider>

          <div className="auth-footer-v2">
            <Link to="/login" className="auth-link-bold-v2">
              Login di sini
            </Link>
          </div>
        </div>
      </div>

      <div className="auth-brand-side-v2">
        <div className="auth-brand-content-v2">
          <div className="auth-brand-badge-v2">✨ Mulai Perjalanan Anda</div>
          <h2 className="auth-brand-title-v2">
            Bergabunglah dengan<br />Ribuan Penulis Lain
          </h2>
          <p className="auth-brand-description-v2">
            Dapatkan akses ke ekosistem penerbitan terlengkap di Indonesia.
            Dari naskah mentah hingga menjadi karya yang menginspirasi.
          </p>
          
          <div className="auth-features-v2">
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">📖</div>
              <div>
                <h4 className="auth-feature-title-v2">Publikasi Mudah</h4>
                <p className="auth-feature-desc-v2">Proses penerbitan yang simpel dan transparan</p>
              </div>
            </div>
            
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">💰</div>
              <div>
                <h4 className="auth-feature-title-v2">Royalti Adil</h4>
                <p className="auth-feature-desc-v2">Sistem royalti yang transparan dan kompetitif</p>
              </div>
            </div>
            
            <div className="auth-feature-v2">
              <div className="auth-feature-icon-v2">📊</div>
              <div>
                <h4 className="auth-feature-title-v2">Tracking Real-time</h4>
                <p className="auth-feature-desc-v2">Monitor penjualan dan performa buku Anda</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

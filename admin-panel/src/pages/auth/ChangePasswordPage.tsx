import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Progress, Alert, message, Space } from 'antd';
import { LockOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}
type ApiError = {
    response?: {
        data?: {
            error?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    };
};

const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 20, label: 'Sangat Lemah', color: '#ff4d4f' };
    if (score === 2) return { score: 40, label: 'Lemah', color: '#faad14' };
    if (score === 3) return { score: 60, label: 'Cukup', color: '#008B94' };
    if (score === 4) return { score: 80, label: 'Kuat', color: '#52c41a' };
    return { score: 100, label: 'Sangat Kuat', color: '#237804' };
};

const ChangePasswordPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
    const { refreshUser, mustChangePassword } = useAuth();
    const navigate = useNavigate();
    const isForced = mustChangePassword();

    const handleSubmit = async (values: { current_password: string; new_password: string; new_password_confirmation: string }) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/change-password', values);
            const data = response.data;

            if (data.success) {
                message.success('Password berhasil diubah!');
                await refreshUser();

                // Navigate to appropriate dashboard
                const redirectUrl = data.data?.redirect_url || '/dashboard';
                setTimeout(() => {
                    navigate(redirectUrl.startsWith('http') ? new URL(redirectUrl).pathname : redirectUrl);
                }, 1000);
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            const errors = apiError.response?.data?.error?.errors;
            if (errors) {
                Object.entries(errors).forEach(([field, messages]) => {
                    form.setFields([{ name: field, errors: Array.isArray(messages) ? messages : [messages] }]);
                });
            } else {
                message.error(apiError.response?.data?.error?.message || 'Gagal mengubah password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: isForced ? 'center' : 'flex-start',
            minHeight: isForced ? '100vh' : 'auto',
            padding: isForced ? '20px' : '24px',
            background: isForced ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
        }}>
            <Card
                style={{
                    maxWidth: 480,
                    width: '100%',
                    borderRadius: 16,
                    boxShadow: isForced ? '0 20px 60px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <LockOutlined style={{ fontSize: 28, color: '#fff' }} />
                        </div>
                        <Title level={3} style={{ margin: 0 }}>
                            {isForced ? 'Ganti Password' : 'Ubah Password'}
                        </Title>
                        <Text type="secondary">
                            {isForced
                                ? 'Ini adalah login pertama Anda. Silakan ganti password sementara Anda.'
                                : 'Masukkan password lama dan password baru Anda.'}
                        </Text>
                    </div>

                    {isForced && (
                        <Alert
                            type="warning"
                            showIcon
                            icon={<ExclamationCircleOutlined />}
                            message="Password Sementara"
                            description="Anda sedang menggunakan password sementara yang diberikan oleh admin. Demi keamanan, Anda wajib mengganti password sebelum melanjutkan."
                        />
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        requiredMark={false}
                        size="large"
                    >
                        <Form.Item
                            name="current_password"
                            label="Password Saat Ini"
                            rules={[{ required: true, message: 'Masukkan password saat ini' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder={isForced ? 'Password sementara dari admin' : 'Password lama'}
                            />
                        </Form.Item>

                        <Form.Item
                            name="new_password"
                            label="Password Baru"
                            rules={[
                                { required: true, message: 'Masukkan password baru' },
                                { min: 8, message: 'Minimal 8 karakter' },
                                { pattern: /[A-Z]/, message: 'Harus mengandung minimal 1 huruf kapital' },
                                { pattern: /[0-9]/, message: 'Harus mengandung minimal 1 angka' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Minimal 8 karakter, 1 huruf kapital, 1 angka"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPasswordStrength(val ? getPasswordStrength(val) : null);
                                }}
                            />
                        </Form.Item>

                        {passwordStrength && (
                            <div style={{ marginBottom: 16, marginTop: -8 }}>
                                <Progress
                                    percent={passwordStrength.score}
                                    strokeColor={passwordStrength.color}
                                    showInfo={false}
                                    size="small"
                                />
                                <Text style={{ color: passwordStrength.color, fontSize: 12 }}>
                                    Kekuatan: {passwordStrength.label}
                                </Text>
                            </div>
                        )}

                        <Form.Item
                            name="new_password_confirmation"
                            label="Konfirmasi Password Baru"
                            dependencies={['new_password']}
                            rules={[
                                { required: true, message: 'Konfirmasi password baru' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Password konfirmasi tidak cocok'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<CheckCircleOutlined />}
                                placeholder="Ulangi password baru"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{
                                    height: 48,
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none',
                                }}
                            >
                                {loading ? 'Memproses...' : 'Ganti Password'}
                            </Button>
                        </Form.Item>

                        {!isForced && (
                            <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                                Tips: Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang kuat.
                            </Paragraph>
                        )}
                    </Form>
                </Space>
            </Card>
        </div>
    );
};

export default ChangePasswordPage;

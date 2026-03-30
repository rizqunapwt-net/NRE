import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Descriptions, Tag, Divider, Row, Col, Space, Button, Modal, Form, Input, message, Statistic, List, Skeleton } from 'antd';
import { UserOutlined, KeyOutlined, SolutionOutlined, LockOutlined, BookOutlined, FileTextOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { designTokens } from '../../theme/designTokens';
import api from '../../api';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [pwOpen, setPwOpen] = useState(false);
    const [pwForm] = Form.useForm();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/user/stats');
                setStats(response.data?.data);
            } catch (error) {
                console.error('Failed to fetch user stats:', error);
                // Fallback stats for demo
                setStats({
                    books_owned: 0,
                    manuscripts_sent: 0,
                    active_contracts: 0,
                    total_royalties: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const primaryColor = designTokens.colors.primary[500];

    return (
        <div className="profile-container" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
            <div className="profile-header" style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0, fontFamily: designTokens.typography.fontFamily.heading }}>Profil Pengguna</Title>
                <Text type="secondary">Kelola informasi pribadi dan pengaturan keamanan akun Anda</Text>
            </div>

            <Row gutter={[24, 24]}>
                {/* Left Column - User Info Card */}
                <Col xs={24} md={8}>
                    <Card 
                        className="shadow-sm border-gray-100 rounded-2xl"
                        style={{ textAlign: 'center', height: '100%', borderRadius: 16 }}
                    >
                        <Avatar 
                            size={120} 
                            icon={<UserOutlined />} 
                            style={{ 
                                backgroundColor: designTokens.colors.primary[50], 
                                color: primaryColor,
                                border: `4px solid ${designTokens.colors.primary[100]}`,
                                marginBottom: 20
                            }} 
                        />
                        <Title level={4} style={{ marginBottom: 4 }}>{user?.name || 'User'}</Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{user?.email || '-'}</Text>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                            <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 600 }}>
                                {((user?.role as string) || 'User').toUpperCase()}
                            </Tag>
                            <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 4, fontWeight: 600 }}>
                                AKTIF
                            </Tag>
                        </div>
                        
                        <Divider style={{ margin: '16px 0' }} />
                        
                        <div style={{ textAlign: 'left' }}>
                            <Text strong style={{ fontSize: 13, color: designTokens.colors.gray[500], textTransform: 'uppercase' }}>Tenant / Institusi</Text>
                            <div style={{ marginTop: 4, fontWeight: 600 }}>{user?.tenant?.name || 'Penerbit Rizquna Elfath'}</div>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Stats & Details */}
                <Col xs={24} md={16}>
                    {/* Stats Section */}
                    <Card className="shadow-sm border-gray-100 rounded-2xl mb-6" style={{ borderRadius: 16 }}>
                        <Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: primaryColor }}><BookOutlined /></span> Statistik Akun
                        </Title>
                        {loading ? (
                            <Row gutter={16}>
                                {[1, 2, 3].map(i => <Col span={8} key={i}><Skeleton active paragraph={{ rows: 1 }} /></Col>)}
                            </Row>
                        ) : (
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Statistic 
                                        title="Buku Dimiliki" 
                                        value={stats?.books_owned || 0} 
                                        prefix={<BookOutlined style={{ color: primaryColor, opacity: 0.7 }} />} 
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Naskah Dikirim" 
                                        value={stats?.manuscripts_sent || 0} 
                                        prefix={<FileTextOutlined style={{ color: designTokens.colors.info.main, opacity: 0.7 }} />} 
                                    />
                                </Col>
                                <Col span={8}>
                                    <Statistic 
                                        title="Royalti" 
                                        value={stats?.total_royalties || 0} 
                                        prefix={<WalletOutlined style={{ color: designTokens.colors.success.main, opacity: 0.7 }} />}
                                        formatter={(val) => `Rp ${Number(val).toLocaleString('id-ID')}`}
                                    />
                                </Col>
                            </Row>
                        )}
                    </Card>

                    {/* Personal Info */}
                    <Card className="shadow-sm border-gray-100 rounded-2xl mb-6" style={{ borderRadius: 16 }}>
                        <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <SolutionOutlined style={{ color: primaryColor }} /> Informasi Pribadi
                        </Title>
                        <Descriptions 
                            column={1} 
                            bordered 
                            size="small" 
                            labelStyle={{ background: designTokens.colors.gray[25], fontWeight: 600, width: '30%' }}
                        >
                            <Descriptions.Item label="Nama Lengkap">{user?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Email Utama">{user?.email || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Peran">{user?.role || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Security */}
                    <Card className="shadow-sm border-gray-100 rounded-2xl" style={{ borderRadius: 16 }}>
                        <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <KeyOutlined style={{ color: designTokens.colors.warning.main }} /> Keamanan & Akun
                        </Title>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '16px', 
                            background: designTokens.colors.gray[50], 
                            borderRadius: 12,
                            border: `1px solid ${designTokens.colors.gray[100]}`
                        }}>
                            <div>
                                <Text strong style={{ display: 'block' }}>Kata Sandi</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Gunakan kata sandi yang kuat untuk melindungi akun Anda</Text>
                            </div>
                            <Button 
                                type="primary" 
                                ghost 
                                icon={<LockOutlined />} 
                                onClick={() => setPwOpen(true)}
                                style={{ borderRadius: 8, borderColor: primaryColor, color: primaryColor }}
                            >
                                Ganti Password
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Modal 
                title={<Title level={4} style={{ margin: 0 }}>Ganti Password</Title>} 
                open={pwOpen} 
                onCancel={() => { setPwOpen(false); pwForm.resetFields(); }}
                onOk={async () => {
                    try {
                        const v = await pwForm.validateFields();
                        await api.post('/auth/change-password', v);
                        message.success('Password berhasil diubah');
                        setPwOpen(false); 
                        pwForm.resetFields();
                    } catch (error: any) {
                        if (error.response?.data?.message) {
                            message.error(error.response.data.message);
                        } else {
                            message.error('Gagal mengubah password. Pastikan password lama benar.');
                        }
                    }
                }}
                okText="Simpan Perubahan" 
                cancelText="Batal"
                okButtonProps={{ style: { borderRadius: 6, background: primaryColor } }}
                cancelButtonProps={{ style: { borderRadius: 6 } }}
            >
                <Form form={pwForm} layout="vertical" style={{ marginTop: 24 }}>
                    <Form.Item 
                        name="current_password" 
                        label="Password Saat Ini" 
                        rules={[{ required: true, message: 'Wajib diisi' }]}
                    >
                        <Input.Password placeholder="Masukkan password saat ini" style={{ borderRadius: 8, padding: '10px 12px' }} />
                    </Form.Item>
                    <Form.Item 
                        name="new_password" 
                        label="Password Baru" 
                        rules={[{ required: true, min: 8, message: 'Minimal 8 karakter' }]}
                    >
                        <Input.Password placeholder="Masukkan password baru" style={{ borderRadius: 8, padding: '10px 12px' }} />
                    </Form.Item>
                    <Form.Item 
                        name="new_password_confirmation" 
                        label="Konfirmasi Password Baru"
                        dependencies={['new_password']}
                        rules={[
                            { required: true, message: 'Wajib diisi' },
                            ({ getFieldValue }) => ({ 
                                validator(_, value) { 
                                    if (!value || getFieldValue('new_password') === value) return Promise.resolve(); 
                                    return Promise.reject(new Error('Konfirmasi password tidak cocok')); 
                                } 
                            })
                        ]}
                    >
                        <Input.Password placeholder="Ulangi password baru" style={{ borderRadius: 8, padding: '10px 12px' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;


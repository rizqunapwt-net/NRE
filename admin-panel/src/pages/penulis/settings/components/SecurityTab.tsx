import React, { useState, useEffect } from 'react';
import api from '../../../../api';
import { 
    Form, Input, Button, Row, Col, List, 
    message, Divider, Typography, Tag, Space, Modal 
} from 'antd';
import { Lock, Monitor, Smartphone, LogOut } from 'lucide-react';

const { Title, Text } = Typography;

interface Session {
    id: number;
    name: string;
    last_used_at: string | null;
    created_at: string;
    is_current: boolean;
}

const SecurityTab: React.FC = () => {
    const [form] = Form.useForm();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
            const res = await api.get('/v1/user/sessions');
            if (res.data?.success) setSessions(res.data.data ?? []);
        } catch (err) {
            console.error('Failed to fetch sessions');
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await api.post('/v1/auth/change-password', {
                current_password: values.current_password,
                new_password: values.new_password,
                new_password_confirmation: values.confirm_password
            });
            message.success('Password berhasil diperbarui');
            form.resetFields();
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Gagal mengubah password');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoutSession = (sessionId: number) => {
        Modal.confirm({
            title: 'Logout Sesi',
            content: 'Apakah Anda yakin ingin menghentikan sesi di perangkat ini?',
            okText: 'Ya, Logout',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await api.delete(`/v1/user/sessions/${sessionId}`);
                    message.success('Sesi berhasil dihentikan');
                    fetchSessions();
                } catch {
                    message.error('Gagal menghentikan sesi');
                }
            }
        });
    };

    return (
        <div className="fade-in">
            <div style={{ marginBottom: 32 }}>
                <Title level={4}><Lock size={20} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Keamanan Akun</Title>
                <Text type="secondary">Pastikan akun Anda tetap aman dengan password yang kuat dan unik.</Text>
            </div>

            <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600 }}>
                <Form.Item name="current_password" label="Password Saat Ini" rules={[{ required: true }]}>
                    <Input.Password placeholder="••••••••" />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item 
                            name="new_password" 
                            label="Password Baru" 
                            rules={[
                                { required: true },
                                { min: 8, message: 'Minimal 8 karakter' }
                            ]}
                        >
                            <Input.Password placeholder="••••••••" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item 
                            name="confirm_password" 
                            label="Konfirmasi Password" 
                            dependencies={['new_password']}
                            rules={[
                                { required: true },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Konfirmasi password tidak cocok'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="••••••••" />
                        </Form.Item>
                    </Col>
                </Row>

                <Button type="primary" htmlType="submit" loading={loading} style={{ fontWeight: 600 }}>
                    Update Password
                </Button>
            </Form>

            <Divider />

            <div style={{ marginBottom: 24 }}>
                <Title level={4}><Monitor size={20} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Sesi Aktif</Title>
                <Text type="secondary">Daftar perangkat yang saat ini terhubung ke akun Anda.</Text>
            </div>

            <List
                loading={sessionsLoading}
                itemLayout="horizontal"
                dataSource={sessions}
                renderItem={(session) => (
                    <List.Item
                        actions={[
                            !session.is_current && (
                                <Button 
                                    type="text" 
                                    danger 
                                    icon={<LogOut size={14} />} 
                                    onClick={() => handleLogoutSession(session.id)}
                                >
                                    Logout
                                </Button>
                            )
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' 
                                }}>
                                    {session.name.toLowerCase().includes('phone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                                </div>
                            }
                            title={
                                <Space>
                                    <Text strong>{session.name}</Text>
                                    {session.is_current && <Tag color="blue" style={{ borderRadius: 10, fontSize: 10 }}>SESI INI</Tag>}
                                </Space>
                            }
                            description={
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {session.is_current ? 'Aktif sekarang' : `Terakhir aktif: ${new Date(session.last_used_at!).toLocaleString('id-ID')}`}
                                    </Text>
                                </Space>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    );
};

export default SecurityTab;

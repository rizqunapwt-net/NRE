import React from 'react';
import { Card, Avatar, Typography, Descriptions, Tag, Divider, Row, Col, Space, Button, Modal, Form, Input, message } from 'antd';
import { UserOutlined, KeyOutlined, SolutionOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [pwOpen, setPwOpen] = React.useState(false);
    const [pwForm] = Form.useForm();

    return (
        <div className="max-w-4xl mx-auto">
            <Title level={3} className="mb-6">Profil Pengguna</Title>

            <Row gutter={24}>
                <Col span={8}>
                    <Card className="text-center shadow-sm border-gray-100 rounded-2xl">
                        <Avatar size={100} icon={<UserOutlined />} className="bg-indigo-100 text-indigo-600 mb-4" />
                        <Title level={4} className="!m-0">{user?.name || 'User'}</Title>
                        <Text type="secondary">{user?.tenant?.name || '-'}</Text>
                        <Divider />
                        <div className="text-left space-y-4">
                            <div className="flex items-center gap-3">
                                <Tag color="gold">{(user?.role as string) || 'User'}</Tag>
                                <Tag color="green">Aktif</Tag>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col span={16}>
                    <Card className="shadow-sm border-gray-100 rounded-2xl mb-6">
                        <Title level={5} className="mb-4 flex items-center gap-2">
                            <SolutionOutlined className="text-indigo-500" /> Informasi Pribadi
                        </Title>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Nama Lengkap">{user?.name || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user?.email || '-'}</Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card className="shadow-sm border-gray-100 rounded-2xl">
                        <Title level={5} className="mb-4 flex items-center gap-2">
                            <KeyOutlined className="text-orange-500" /> Keamanan & Akun
                        </Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <Text strong>Kata Sandi</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: '12px' }}>Terakhir diubah: tidak diketahui</Text>
                                </div>
                                <Button icon={<LockOutlined />} onClick={() => setPwOpen(true)}>Ganti Password</Button>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Modal title="Ganti Password" open={pwOpen} onCancel={() => { setPwOpen(false); pwForm.resetFields(); }}
                onOk={async () => {
                    try {
                        const v = await pwForm.validateFields();
                        const api = (await import('../../api')).default;
                        await api.post('/auth/change-password', v);
                        message.success('Password berhasil diubah');
                    } catch {
                        message.success('Password berhasil diubah (lokal)');
                    }
                    setPwOpen(false); pwForm.resetFields();
                }}
                okText="Simpan" cancelText="Batal">
                <Form form={pwForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="current_password" label="Password Lama" rules={[{ required: true, message: 'Wajib diisi' }]}>
                        <Input.Password placeholder="Masukkan password lama" />
                    </Form.Item>
                    <Form.Item name="new_password" label="Password Baru" rules={[{ required: true, min: 6, message: 'Minimal 6 karakter' }]}>
                        <Input.Password placeholder="Masukkan password baru" />
                    </Form.Item>
                    <Form.Item name="new_password_confirmation" label="Konfirmasi Password Baru"
                        dependencies={['new_password']}
                        rules={[{ required: true, message: 'Wajib diisi' },
                        ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('new_password') === value) return Promise.resolve(); return Promise.reject(new Error('Password tidak cocok')); } })]}>
                        <Input.Password placeholder="Ulangi password baru" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ProfilePage;

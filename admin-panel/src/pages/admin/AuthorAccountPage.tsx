import React, { useState, useEffect } from 'react';
import {
    Card, Table, Button, Modal, Input, Typography, Tag, Space,
    Alert, message, Descriptions, Divider, Result, Badge,
} from 'antd';
import {
    UserAddOutlined, CopyOutlined, WhatsAppOutlined, KeyOutlined, SearchOutlined,
} from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;

interface Author {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    created_at: string;
    user_id: number | null;
}

interface CreatedCredentials {
    email: string;
    temporary_password: string;
    login_url: string;
}

const AuthorAccountPage: React.FC = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
    const [creating, setCreating] = useState(false);
    const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
    const [customEmail, setCustomEmail] = useState('');
    const [searchText, setSearchText] = useState('');

    const fetchAuthors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/authors/without-account');
            const data = response.data.success ? response.data.data : response.data;
            setAuthors(data.authors || []);
        } catch {
            message.error('Gagal memuat data penulis.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthors();
    }, []);

    const handleCreateAccount = async () => {
        if (!selectedAuthor) return;

        setCreating(true);
        try {
            const payload: any = {};
            if (customEmail) payload.email = customEmail;

            const response = await api.post(`/admin/authors/${selectedAuthor.id}/create-account`, payload);
            const data = response.data.success ? response.data.data : response.data;

            setCredentials(data.credentials);
            message.success('Akun penulis berhasil dibuat!');
            fetchAuthors(); // Refresh list
        } catch (error: any) {
            const errorMsg = error.response?.data?.error?.message || 'Gagal membuat akun.';
            message.error(errorMsg);
        } finally {
            setCreating(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        message.success(`${label} berhasil disalin!`);
    };

    const generateWhatsAppMessage = (creds: CreatedCredentials, authorName: string) => {
        const msg = `Assalamualaikum ${authorName},\n\nAkun Portal Penulis di New Rizquna Elfath telah dibuat untuk Anda:\n\n📧 Email: ${creds.email}\n🔑 Password: ${creds.temporary_password}\n🔗 Login: ${creds.login_url}\n\n⚠️ Anda akan diminta mengganti password saat login pertama kali.\n\nTerima kasih.`;
        return msg;
    };

    const openWhatsApp = (phone: string, authorName: string) => {
        if (!credentials) return;
        const msg = generateWhatsAppMessage(credentials, authorName);
        const encodedMsg = encodeURIComponent(msg);
        const cleanPhone = phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    };

    const filteredAuthors = authors.filter(a =>
        a.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (a.email || '').toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Nama Penulis',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email: string | null) => email || <Text type="secondary">-</Text>,
        },
        {
            title: 'Telepon',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone: string | null) => phone || <Text type="secondary">-</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_: any, record: Author) => (
                <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    onClick={() => {
                        setSelectedAuthor(record);
                        setCustomEmail(record.email || '');
                        setCredentials(null);
                        setCreateModalOpen(true);
                    }}
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                    }}
                >
                    Buatkan Akun
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 0 }}>
            <Card
                style={{ borderRadius: 12 }}
                title={
                    <Space>
                        <KeyOutlined style={{ color: '#667eea' }} />
                        <Title level={4} style={{ margin: 0 }}>Kelola Akun Penulis</Title>
                    </Space>
                }
                extra={
                    <Badge count={authors.length} style={{ backgroundColor: '#667eea' }}>
                        <Tag>Belum punya akun</Tag>
                    </Badge>
                }
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Cari penulis..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ maxWidth: 400 }}
                        allowClear
                    />

                    <Table
                        columns={columns}
                        dataSource={filteredAuthors}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: 'Semua penulis sudah memiliki akun! 🎉' }}
                    />
                </Space>
            </Card>

            {/* Create Account Modal */}
            <Modal
                title={
                    credentials
                        ? '✅ Akun Berhasil Dibuat'
                        : `Buat Akun untuk: ${selectedAuthor?.name}`
                }
                open={createModalOpen}
                onCancel={() => {
                    setCreateModalOpen(false);
                    setCredentials(null);
                    setSelectedAuthor(null);
                }}
                footer={null}
                width={520}
            >
                {credentials ? (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Result
                            status="success"
                            title="Akun Berhasil Dibuat!"
                            subTitle="Kirimkan kredensial di bawah ini ke penulis via WhatsApp."
                        />

                        <Card
                            size="small"
                            style={{
                                background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
                                border: '1px solid #91caff',
                                borderRadius: 12,
                            }}
                        >
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="📧 Email">
                                    <Space>
                                        <Text strong copyable>{credentials.email}</Text>
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="🔑 Password">
                                    <Space>
                                        <Text strong code style={{ fontSize: 16, color: '#ff4d4f' }}>
                                            {credentials.temporary_password}
                                        </Text>
                                        <Button
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToClipboard(credentials.temporary_password, 'Password')}
                                        />
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="🔗 Login URL">
                                    <Text copyable={{ text: credentials.login_url }}>
                                        {credentials.login_url}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Alert
                            type="warning"
                            message="Penulis akan diminta ganti password saat login pertama kali."
                            showIcon
                        />

                        <Space style={{ width: '100%', justifyContent: 'center' }}>
                            {selectedAuthor?.phone && (
                                <Button
                                    type="primary"
                                    icon={<WhatsAppOutlined />}
                                    onClick={() => openWhatsApp(selectedAuthor!.phone!, selectedAuthor!.name)}
                                    style={{ background: '#25D366', border: 'none' }}
                                    size="large"
                                >
                                    Kirim via WhatsApp
                                </Button>
                            )}
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => {
                                    const msg = generateWhatsAppMessage(credentials, selectedAuthor?.name || '');
                                    copyToClipboard(msg, 'Pesan');
                                }}
                                size="large"
                            >
                                Salin Pesan
                            </Button>
                        </Space>
                    </Space>
                ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Nama">{selectedAuthor?.name}</Descriptions.Item>
                            <Descriptions.Item label="Email Terdaftar">
                                {selectedAuthor?.email || <Text type="secondary">Belum ada</Text>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Telepon">
                                {selectedAuthor?.phone || <Text type="secondary">Belum ada</Text>}
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider />

                        <div>
                            <Text>Email untuk login (opsional, jika berbeda dari email terdaftar):</Text>
                            <Input
                                value={customEmail}
                                onChange={e => setCustomEmail(e.target.value)}
                                placeholder="contoh@email.com"
                                style={{ marginTop: 8 }}
                            />
                        </div>

                        <Alert
                            type="info"
                            message="Password sementara akan di-generate otomatis (format: NamaPertama + 4 digit + simbol)."
                            showIcon
                        />

                        <Button
                            type="primary"
                            icon={<UserAddOutlined />}
                            loading={creating}
                            block
                            size="large"
                            onClick={handleCreateAccount}
                            style={{
                                height: 48,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Buat Akun & Generate Password
                        </Button>
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default AuthorAccountPage;

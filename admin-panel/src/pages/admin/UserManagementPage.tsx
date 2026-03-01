import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Button, Space, Typography, Card, Breadcrumb, Tag, Input,
    message, Modal, Form, Select, Switch, Popconfirm, Row, Col, Statistic, Tooltip, Badge, Avatar
} from 'antd';
import {
    PlusOutlined, SearchOutlined, UserOutlined, EditOutlined,
    DeleteOutlined, CheckCircleOutlined, StopOutlined, ReloadOutlined,
    LockOutlined, MailOutlined, TeamOutlined, SafetyCertificateOutlined,
    CrownOutlined, KeyOutlined
} from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    phone: string | null;
    is_active: boolean;
    is_verified_author: boolean;
    roles: string[];
    role: string;
    last_login_at: string | null;
    created_at: string;
}

interface Role {
    name: string;
    users_count: number;
}

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, per_page: pagination.pageSize };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;

            const res = await api.get('/admin/users', { params });
            setUsers(res.data?.data || []);
            const meta = res.data?.meta;
            if (meta) {
                setPagination(prev => ({
                    ...prev,
                    current: meta.current_page,
                    total: meta.total,
                }));
            }
        } catch {
            message.error('Gagal mengambil data user');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, pagination.pageSize]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/admin/users/roles');
            setRoles(res.data?.data || []);
        } catch {
            // Fallback roles
            setRoles([{ name: 'Admin', users_count: 0 }, { name: 'User', users_count: 0 }]);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, roleFilter]);

    const handleToggleActive = async (user: User) => {
        try {
            await api.patch(`/admin/users/${user.id}/toggle-active`);
            message.success(user.is_active ? `${user.name} dinonaktifkan` : `${user.name} diaktifkan`);
            fetchUsers(pagination.current);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            message.error(e.response?.data?.message || 'Gagal mengubah status');
        }
    };

    const handleDelete = async (user: User) => {
        try {
            await api.delete(`/admin/users/${user.id}`);
            message.success(`${user.name} berhasil dihapus`);
            fetchUsers(pagination.current);
            fetchRoles();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            message.error(e.response?.data?.message || 'Gagal menghapus user');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ role: 'User', is_active: true });
        setModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            name: user.name,
            email: user.email,
            username: user.username,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            is_verified_author: user.is_verified_author,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        setSubmitting(true);
        try {
            if (editingUser) {
                // Don't send empty password on update
                if (!values.password) delete values.password;
                await api.put(`/admin/users/${editingUser.id}`, values);
                message.success('User berhasil diperbarui');
            } else {
                await api.post('/admin/users', values);
                message.success('User berhasil dibuat');
            }
            setModalOpen(false);
            form.resetFields();
            fetchUsers(pagination.current);
            fetchRoles();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            if (e.response?.data?.errors) {
                const errors = e.response.data.errors;
                const firstError = Object.values(errors)[0]?.[0];
                message.error(firstError || 'Validasi gagal');
            } else {
                message.error(e.response?.data?.message || 'Gagal menyimpan user');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const totalUsers = pagination.total;
    const activeUsers = users.filter(u => u.is_active).length;
    const adminCount = roles.find(r => r.name === 'Admin')?.users_count || 0;

    const columns = [
        {
            title: 'User',
            key: 'user',
            width: 280,
            render: (_: unknown, record: User) => (
                <Space>
                    <Avatar
                        style={{
                            background: record.role === 'Admin'
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        }}
                        icon={<UserOutlined />}
                    />
                    <div>
                        <div style={{ fontWeight: 600 }}>
                            {record.name}
                            {record.role === 'Admin' && (
                                <CrownOutlined style={{ marginLeft: 6, color: '#faad14', fontSize: 12 }} />
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            width: 140,
            render: (v: string) => <Text code style={{ fontSize: 12 }}>@{v}</Text>,
        },
        {
            title: 'Role',
            key: 'role',
            width: 100,
            render: (_: unknown, record: User) => {
                const color = record.role === 'Admin' ? 'purple' : 'blue';
                const icon = record.role === 'Admin' ? <SafetyCertificateOutlined /> : <UserOutlined />;
                return <Tag color={color} icon={icon}>{record.role}</Tag>;
            },
        },
        {
            title: 'Status',
            key: 'status',
            width: 100,
            render: (_: unknown, record: User) => (
                <Badge
                    status={record.is_active ? 'success' : 'error'}
                    text={
                        <Text style={{ fontSize: 13 }}>
                            {record.is_active ? 'Aktif' : 'Nonaktif'}
                        </Text>
                    }
                />
            ),
        },
        {
            title: 'Telepon',
            dataIndex: 'phone',
            key: 'phone',
            width: 140,
            render: (v: string | null) => v || <Text type="secondary">-</Text>,
        },
        {
            title: 'Login Terakhir',
            key: 'last_login',
            width: 140,
            render: (_: unknown, record: User) => {
                if (!record.last_login_at) return <Text type="secondary" style={{ fontSize: 12 }}>Belum pernah</Text>;
                const d = new Date(record.last_login_at);
                return <Text style={{ fontSize: 12 }}>{d.toLocaleDateString('id-ID')} {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>;
            },
        },
        {
            title: 'Dibuat',
            key: 'created_at',
            width: 110,
            render: (_: unknown, record: User) => (
                <Text style={{ fontSize: 12 }}>
                    {new Date(record.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 140,
            align: 'center' as const,
            render: (_: unknown, record: User) => (
                <Space size={4}>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)} />
                    </Tooltip>
                    <Tooltip title={record.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                        <Popconfirm
                            title={record.is_active ? 'Nonaktifkan user ini?' : 'Aktifkan user ini?'}
                            onConfirm={() => handleToggleActive(record)}
                            okText="Ya"
                            cancelText="Batal"
                        >
                            <Button
                                type="text"
                                icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                                size="small"
                                style={{ color: record.is_active ? '#ff4d4f' : '#52c41a' }}
                            />
                        </Popconfirm>
                    </Tooltip>
                    <Tooltip title="Hapus">
                        <Popconfirm
                            title="Hapus user ini?"
                            description="User akan dihapus permanen beserta seluruh tokennya."
                            onConfirm={() => handleDelete(record)}
                            okText="Hapus"
                            cancelText="Batal"
                            okButtonProps={{ danger: true }}
                        >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Breadcrumb style={{ marginBottom: 16 }} items={[
                { title: 'Beranda' },
                { title: 'Pengaturan' },
                { title: 'Manajemen User' },
            ]} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        <TeamOutlined style={{ marginRight: 8 }} />
                        Manajemen User
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Kelola akun pengguna, role, dan izin akses</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(pagination.current)}>Refresh</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        Tambah User
                    </Button>
                </Space>
            </div>

            {/* Summary Cards */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8} md={6}>
                    <Card bordered={false} style={{ borderRadius: 10 }} styles={{ body: { padding: 16 } }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 11 }}>Total User</Text>}
                            value={totalUsers}
                            prefix={<TeamOutlined style={{ color: '#4096ff' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={6}>
                    <Card bordered={false} style={{ borderRadius: 10 }} styles={{ body: { padding: 16 } }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 11 }}>User Aktif</Text>}
                            value={activeUsers}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={6}>
                    <Card bordered={false} style={{ borderRadius: 10 }} styles={{ body: { padding: 16 } }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 11 }}>Admin</Text>}
                            value={adminCount}
                            prefix={<SafetyCertificateOutlined style={{ color: '#722ed1' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={6}>
                    <Card bordered={false} style={{ borderRadius: 10 }} styles={{ body: { padding: 16 } }}>
                        <Statistic
                            title={<Text type="secondary" style={{ fontSize: 11 }}>Role Tersedia</Text>}
                            value={roles.length}
                            prefix={<KeyOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Table Card */}
            <Card
                bordered={false}
                style={{ borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                styles={{ body: { padding: 0 } }}
            >
                {/* Filters */}
                <div style={{ padding: '16px 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Cari nama, email, username..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        placeholder="Filter role"
                        value={roleFilter}
                        onChange={(v) => setRoleFilter(v)}
                        style={{ width: 150 }}
                        allowClear
                        options={[
                            { value: undefined, label: 'Semua Role' },
                            ...roles.map(r => ({ value: r.name, label: `${r.name} (${r.users_count})` })),
                        ]}
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} user`,
                        onChange: (page) => fetchUsers(page),
                    }}
                    size="small"
                    scroll={{ x: 1100 }}
                />
            </Card>

            {/* Create / Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingUser ? <EditOutlined /> : <PlusOutlined />}
                        {editingUser ? `Edit User — ${editingUser.name}` : 'Tambah User Baru'}
                    </Space>
                }
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); }}
                footer={null}
                width={520}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item name="name" label="Nama Lengkap" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
                        <Input prefix={<UserOutlined />} placeholder="Nama lengkap" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Email wajib diisi' },
                                    { type: 'email', message: 'Format email tidak valid' },
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="user@example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="username" label="Username">
                                <Input prefix={<UserOutlined />} placeholder="Auto-generate jika kosong" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="phone" label="Telepon">
                        <Input placeholder="08xxxxxxxxxx" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                        rules={editingUser ? [] : [
                            { required: true, message: 'Password wajib diisi' },
                            { min: 8, message: 'Minimal 8 karakter' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Minimal 8 karakter" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Select
                                    options={roles.map(r => ({
                                        value: r.name,
                                        label: (
                                            <Space>
                                                {r.name === 'Admin' ? <CrownOutlined style={{ color: '#722ed1' }} /> : <UserOutlined />}
                                                {r.name}
                                            </Space>
                                        ),
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_active" label="Status Aktif" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" defaultChecked />
                            </Form.Item>
                        </Col>
                    </Row>

                    {editingUser && (
                        <Form.Item name="is_verified_author" label="Penulis Terverifikasi" valuePropName="checked">
                            <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
                        </Form.Item>
                    )}

                    <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Batal</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {editingUser ? 'Simpan Perubahan' : 'Buat User'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagementPage;

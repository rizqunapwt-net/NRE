import React, { useState, useEffect } from 'react';
import api from '../../../../api';
import { 
    Form, Input, Button, Row, Col, Avatar, Upload, 
    message, Divider, Typography, Badge 
} from 'antd';
import { User, Camera, Phone, MapPin, CreditCard, Landmark } from 'lucide-react';

const { Title, Text } = Typography;

type UserProfile = {
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    photo_path?: string;
    pen_name?: string;
    nik?: string;
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    bank_name?: string;
    bank_account?: string;
    bank_account_name?: string;
    npwp?: string;
};

interface ProfileTabProps {
    user: any;
}

const ProfileTab: React.FC<ProfileTabProps> = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [authorData, setAuthorData] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/user/profile');
                if (res.data?.success) {
                    setAuthorData(res.data.data);
                    form.setFieldsValue(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch author profile:', err);
            }
        };
        fetchProfile();
    }, [form]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await api.patch('/user/profile', values);
            if (res.data?.success) {
                message.success('Profil berhasil diperbarui');
            }
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (info: any) => {
        if (info.file.status === 'uploading') return;
        
        const formData = new FormData();
        formData.append('photo', info.file.originFileObj);

        try {
            const res = await api.post('/user/profile/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data?.success) {
                message.success('Foto profil berhasil diperbarui');
                setAuthorData(prev => prev ? { ...prev, photo_path: res.data.data.path } : null);
            }
        } catch (err) {
            message.error('Gagal mengupload foto');
        }
    };

    return (
        <div className="fade-in">
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={authorData || {}}
            >
                {/* 1. Header & Photo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                    <Badge count={<Button shape="circle" icon={<Camera size={14} />} size="small" style={{ background: '#3b82f6', color: '#fff', border: 'none' }} />} offset={[-10, 90]}>
                        <Avatar 
                            size={100} 
                            src={authorData?.photo_path ? `${import.meta.env.VITE_API_URL}/storage/${authorData.photo_path}` : null}
                            icon={<User size={50} />}
                            style={{ background: '#f1f5f9', color: '#94a3b8', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        />
                    </Badge>
                    <div>
                        <Title level={4} style={{ margin: 0 }}>Informasi Profil</Title>
                        <Text type="secondary">Foto ini akan muncul di halaman penulis dan buku Anda.</Text>
                        <div style={{ marginTop: 12 }}>
                            <Upload showUploadList={false} customRequest={handlePhotoUpload}>
                                <Button size="small">Ganti Foto</Button>
                            </Upload>
                        </div>
                    </div>
                </div>

                <Divider plain><Text strong><User size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Data Pribadi</Text></Divider>
                
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item name="name" label="Nama Lengkap (Sesuai KTP)" rules={[{ required: true }]}>
                            <Input prefix={<User size={16} color="#9ca3af" />} placeholder="Nama Lengkap" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="pen_name" label="Nama Pena (Opsional)">
                            <Input placeholder="Nama yang muncul di sampul buku" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="nik" label="NIK (Nomor Induk Kependudukan)">
                            <Input placeholder="16 digit nomor KTP" maxLength={16} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="phone" label="Nomor Telepon / WhatsApp">
                            <Input prefix={<Phone size={16} color="#9ca3af" />} placeholder="0812..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="bio" label="Biografi Singkat">
                    <Input.TextArea rows={4} placeholder="Ceritakan sedikit tentang Anda..." maxLength={500} showCount />
                </Form.Item>

                <Divider plain><Text strong><MapPin size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Alamat & Domisili</Text></Divider>
                
                <Form.Item name="address" label="Alamat Lengkap">
                    <Input.TextArea rows={2} placeholder="Jalan, No Rumah, RT/RW..." />
                </Form.Item>
                
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item name="city" label="Kota/Kabupaten">
                            <Input placeholder="Contoh: Cirebon" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="province" label="Provinsi">
                            <Input placeholder="Contoh: Jawa Barat" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="postal_code" label="Kode Pos">
                            <Input placeholder="12345" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider plain><Text strong><CreditCard size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} /> Informasi Bank (Untuk Royalti)</Text></Divider>
                
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item name="bank_name" label="Nama Bank">
                            <Input prefix={<Landmark size={16} color="#9ca3af" />} placeholder="BCA, Mandiri, BRI, dll" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="bank_account" label="Nomor Rekening">
                            <Input placeholder="Nomor rekening" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item name="bank_account_name" label="Nama Pemilik Rekening">
                            <Input placeholder="Sesuai buku tabungan" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item name="npwp" label="NPWP (Opsional)">
                            <Input placeholder="Nomor Pokok Wajib Pajak" />
                        </Form.Item>
                    </Col>
                </Row>

                <div style={{ marginTop: 32, textAlign: 'right' }}>
                    <Button type="primary" size="large" htmlType="submit" loading={loading} style={{ padding: '0 48px', height: 48, fontWeight: 600 }}>
                        Simpan Perubahan
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default ProfileTab;

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const GoogleCallbackPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { loginWithToken, getIntendedUrl, clearIntendedUrl } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const userRaw = searchParams.get('user');
        const errorMsg = searchParams.get('error');

        if (errorMsg) {
            setError(decodeURIComponent(errorMsg));
            return;
        }

        if (!token || !userRaw) {
            setError('Data autentikasi tidak valid.');
            return;
        }

        try {
            const user = JSON.parse(decodeURIComponent(userRaw));
            loginWithToken(token, user);
            const intended = getIntendedUrl();
            clearIntendedUrl();
            
            // Redirect berdasarkan role
            const redirectPath = intended || (user.role === 'ADMIN' || user.role === 'Admin' ? '/dashboard' : '/penulis');
            navigate(redirectPath, { replace: true });
        } catch {
            setError('Gagal memproses data login dari Google.');
        }
    }, [searchParams, loginWithToken, getIntendedUrl, clearIntendedUrl, navigate]);

    if (error) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: 24 
            }}>
                <Result
                    status="error"
                    title="Login Google Gagal"
                    subTitle={error}
                    extra={[
                        <Button type="primary" key="login" onClick={() => navigate('/login')}>
                            Kembali ke Login
                        </Button>
                    ]}
                />
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column',
            gap: 16
        }}>
            <Spin size="large" />
            <p style={{ color: '#666' }}>Memproses login Google...</p>
        </div>
    );
};

export default GoogleCallbackPage;

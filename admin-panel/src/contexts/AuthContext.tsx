import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

interface AuthorProfile {
    id: number;
    name: string;
    photo_path: string | null;
    is_profile_complete: boolean;
}

export interface UserProfile {
    id: number;
    email: string;
    name: string;
    username: string;
    role: string;
    is_verified_author: boolean;
    permissions: string[];
    must_change_password: boolean;
    google_id?: string | null;
    avatar_url?: string | null;
    email_verified_at?: string | null;
    author: AuthorProfile | null;
    tenant: {
        id: number;
        name: string;
        subdomain: string;
    };
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    hasPermission: (permission: string) => boolean;
    isAdmin: () => boolean;
    isPenulis: () => boolean;
    mustChangePassword: () => boolean;
    logout: () => void;
    refreshUser: () => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithToken: (token: string, user: Partial<UserProfile> & { roles?: string[] }) => void;
    setIntendedUrl: (url: string) => void;
    getIntendedUrl: () => string | null;
    clearIntendedUrl: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Spatie role names to frontend permission strings
const ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN: [
        'publishing_read', 'publishing_write',
        'author_manage', 'percetakan_read', 'percetakan_write',
        'settings_read', 'settings_write',
    ],
    USER: [
        'publishing_read', 'author_portal',
    ],
};

export const getRedirectByRole = (role: string): string => {
    if (role === 'ADMIN' || role === 'Admin') return '/dashboard';
    return '/penulis';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            const responseData = response.data.success ? response.data.data : response.data;
            const userData = responseData.user || responseData;
            const spatieRole = (userData.roles?.[0] || userData.role || '').toUpperCase();
            const permissions = ROLE_PERMISSIONS[spatieRole] || [];

            setUser({
                id: userData.id,
                email: userData.email || '',
                name: userData.name || userData.username || '',
                username: userData.username || '',
                role: spatieRole,
                is_verified_author: Boolean(userData.is_verified_author),
                permissions,
                must_change_password: userData.must_change_password || false,
                google_id: userData.google_id || null,
                avatar_url: userData.avatar_url || null,
                email_verified_at: userData.email_verified_at || null,
                author: userData.author || null,
                tenant: userData.tenant || {
                    id: 1,
                    name: 'PT New Rizquna Elfath',
                    subdomain: 'nre',
                },
            });
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check URL for token parameter (passed from OAuth or main login)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if (urlToken) {
            localStorage.setItem('token', urlToken);
            window.history.replaceState({}, '', window.location.pathname);
        }
        fetchProfile();
    }, [fetchProfile]);

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        return user.permissions.includes(permission);
    };

    const isAdmin = () => user?.role === 'ADMIN';
    const isPenulis = () => Boolean(user?.is_verified_author);
    const mustChangePassword = () => user?.must_change_password ?? false;

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const data = response.data.success ? response.data.data : response.data;
        const token = data.token;
        const userData = data.user || data;
        loginWithToken(token, userData);
    };

    const loginWithToken = (token: string, userData: Partial<UserProfile> & { roles?: string[] }) => {
        localStorage.setItem('token', token);
        const spatieRole = (userData.roles?.[0] || userData.role || '').toUpperCase();
        const permissions = ROLE_PERMISSIONS[spatieRole] || [];
        setUser({
            id: userData.id ?? 0,
            email: userData.email || '',
            name: userData.name || '',
            username: userData.username || '',
            role: spatieRole,
            is_verified_author: Boolean(userData.is_verified_author),
            permissions,
            must_change_password: userData.must_change_password ?? false,
            google_id: userData.google_id || null,
            avatar_url: userData.avatar_url || null,
            email_verified_at: userData.email_verified_at || null,
            author: userData.author || null,
            tenant: { id: 1, name: 'PT New Rizquna Elfath', subdomain: 'nre' },
        });
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Token may already be expired
        }
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const setIntendedUrl = (url: string) => sessionStorage.setItem('intended_url', url);
    const getIntendedUrl = () => sessionStorage.getItem('intended_url');
    const clearIntendedUrl = () => sessionStorage.removeItem('intended_url');

    return (
        <AuthContext.Provider value={{
            user, loading, hasPermission, isAdmin, isPenulis, mustChangePassword,
            login, logout, refreshUser: fetchProfile, loginWithToken,
            setIntendedUrl, getIntendedUrl, clearIntendedUrl,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

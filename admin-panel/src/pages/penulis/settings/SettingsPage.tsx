import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ProfileTab from './components/ProfileTab';
import SecurityTab from './components/SecurityTab';
import NotificationsTab from './components/NotificationsTab';
import PaymentTab from './components/PaymentTab';
import PrivacyTab from './components/PrivacyTab';
import { API_BASE } from '../../../api/base';
import './SettingsPage.css';
import '../PenulisGlobal.css';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: 'Profil Penulis', icon: '👤' },
        { id: 'security', label: 'Keamanan', icon: '🔒' },
        { id: 'notifications', label: 'Notifikasi', icon: '📧' },
        { id: 'payment', label: 'Pembayaran', icon: '💳' },
        { id: 'privacy', label: 'Privasi', icon: '📊' },
    ];

    const handleLogout = async () => {
        if (!confirm('Apakah Anda yakin ingin keluar?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_BASE}/v1/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { /* ignore */ }
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="pp-container">
            <header className="settings-header">
                <h2 className="pp-title">Pengaturan Akun</h2>
                <p className="pp-subtitle">Kelola informasi publik, keamanan, dan preferensi akun Anda.</p>
            </header>

            <div className="settings-page">
                {/* Sidebar Navigation */}
                <aside className="settings-sidebar">
                    <nav className="settings-menu">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`settings-menu-item ${activeTab === tab.id ? 'settings-menu-item--active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="settings-menu-item__icon">{tab.icon}</span>
                                <span className="settings-menu-item__label">{tab.label}</span>
                            </button>
                        ))}
                        <div className="settings-menu-divider" />
                        <button className="settings-menu-item settings-menu-item--logout" onClick={handleLogout}>
                            <span className="settings-menu-item__icon">🚪</span>
                            <span className="settings-menu-item__label">Keluar</span>
                        </button>
                    </nav>
                </aside>

                {/* Content Area */}
                <main className="settings-content">
                    <div className="settings-tab-card">
                        {activeTab === 'profile' && <ProfileTab user={user} />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'notifications' && <NotificationsTab />}
                        {activeTab === 'payment' && <PaymentTab />}
                        {activeTab === 'privacy' && <PrivacyTab />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;

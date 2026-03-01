import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../api/base';
import './PenulisLayout.css';

/* ── Sub-pages ── */
const PenulisDashboard = React.lazy(() => import('./PenulisDashboard'));
const NaskahSayaPage = React.lazy(() => import('./NaskahSayaPage'));
const KirimNaskahPage = React.lazy(() => import('./KirimNaskahPage'));
const EbookLibraryPage = React.lazy(() => import('./ebook/EbookLibraryPage'));
const MyCollectionPage = React.lazy(() => import('./ebook/MyCollectionPage'));
const PurchaseHistoryPage = React.lazy(() => import('./ebook/PurchaseHistoryPage'));
const ChatPage = React.lazy(() => import('./chat/ChatPage'));
const PenulisSettingPage = React.lazy(() => import('./settings/SettingsPage'));
const OrderCetakPage = React.lazy(() => import('./naskah/OrderCetakPage'));

/* ── Types ── */
interface MenuItem {
    key: string;
    icon: string;
    label: string;
    badge?: number;
    children?: { key: string; label: string }[];
}

interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning';
    title: string;
    message: string;
    time: string;
    read: boolean;
}

const PenulisLayout: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Sidebar states
    const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);  // icon-only by default (production style)
    const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);

    // Header states
    const [unreadChat, setUnreadChat] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userDropOpen, setUserDropOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const notifRef = useRef<HTMLDivElement>(null);
    const userDropRef = useRef<HTMLDivElement>(null);

    /* ── Poll unread chat count ── */
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/v1/user/chat/unread`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (json.success) setUnreadChat(json.unread || 0);
            } catch { /* ignore */ }
        };
        fetchUnread();
        const iv = setInterval(fetchUnread, 10000);
        return () => clearInterval(iv);
    }, []);

    /* ── Mock notifications (real endpoint can be wired later) ── */
    useEffect(() => {
        setNotifications([
            { id: 1, type: 'info', title: 'Naskah Diterima', message: 'Naskah Anda sedang dalam proses review editor.', time: '5 mnt lalu', read: false },
            { id: 2, type: 'success', title: 'Kontrak Aktif', message: 'Kontrak buku Anda telah disetujui.', time: '2 jam lalu', read: false },
            { id: 3, type: 'info', title: 'Royalti Tersedia', message: 'Laporan royalti Q1 2026 sudah tersedia.', time: 'Kemarin', read: true },
        ]);
    }, []);

    /* ── Close dropdowns on outside click ── */
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) setUserDropOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    /* ── Close sidebar on ESC ── */
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setSidebarOpen(false); setNotifOpen(false); setUserDropOpen(false); }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    /* ── Menu items with RBAC ── */
    const menuItems: MenuItem[] = [
        { key: '/penulis', icon: '🏠', label: 'Dashboard' },
        {
            key: '/penulis/naskah', icon: '📄', label: 'Karya & Penerbitan',
            children: [
                { key: '/penulis/naskah', label: 'Naskah Saya' },
                { key: '/penulis/kirim-naskah', label: 'Kirim Naskah Baru' },
                { key: '/penulis/cetak', label: 'Order Cetak' },
            ],
        },
        {
            key: '/penulis/ebook', icon: '📚', label: 'E-Book & Library',
            children: [
                { key: '/penulis/koleksi', label: 'E-Book Koleksi' },
                { key: '/penulis/ebook', label: 'Buku Terbitan Saya' },
                { key: '/penulis/pembelian', label: 'Riwayat Pembelian' },
            ],
        },
        { key: '/penulis/chat', icon: '💬', label: 'Chat Admin', badge: unreadChat },
        { key: '/penulis/setting', icon: '👤', label: 'Profil & Akun' },
    ];

    // RBAC: Only verified authors or admins can see Publishing/Printing
    const filteredMenuItems = menuItems.filter(item => {
        if (item.key === '/penulis/naskah') {
            return user?.role === 'ADMIN' || user?.is_verified_author;
        }
        return true;
    });

    const isActive = (key: string) => {
        if (key === '/penulis') return location.pathname === '/penulis';
        return location.pathname.startsWith(key);
    };

    const toggleSubmenu = (key: string) => {
        setSubmenuOpen(prev => prev === key ? null : key);
    };

    /* ── Auto-expand submenu when route matches ── */
    useEffect(() => {
        const activeParent = menuItems.find(
            item => item.children && item.children.some(c => location.pathname.startsWith(c.key))
        );
        if (activeParent) setSubmenuOpen(activeParent.key);
    }, [location.pathname]);

    /* ── Logout ── */
    const handleLogout = async () => {
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

    const unreadNotifCount = notifications.filter(n => !n.read).length;
    const currentLabel = menuItems.find(m => isActive(m.key))?.label
        || menuItems.flatMap(m => m.children || []).find(c => location.pathname.startsWith(c.key))?.label
        || 'Dashboard';

    const notifIcon = (type: Notification['type']) =>
        type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

    return (
        <div className={`pl ${sidebarCollapsed ? 'pl--collapsed' : ''}`}>
            {/* ── Background Decorations (Blobs) ── */}
            <div className="pl-bg-blob pl-bg-blob--1" />
            <div className="pl-bg-blob pl-bg-blob--2" />
            <div className="pl-bg-blob pl-bg-blob--3" />

            {/* ── Sidebar ── */}
            <aside className={`pl-sidebar ${sidebarOpen ? 'pl-sidebar--open' : ''}`}>

                {/* Logo + collapse toggle */}
                <div className="pl-sidebar__header">
                    <div className="pl-sidebar__logo">R</div>
                    {!sidebarCollapsed && (
                        <div className="pl-sidebar__brand">
                            <span className="pl-sidebar__title">Portal Penulis</span>
                            <span className="pl-sidebar__subtitle">Penerbit Rizquna</span>
                        </div>
                    )}
                    <button
                        className="pl-sidebar__collapse-btn"
                        onClick={() => setSidebarCollapsed(c => !c)}
                        title={sidebarCollapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
                    >
                        {sidebarCollapsed ? '›' : '‹'}
                    </button>
                </div>

                {/* User profile card */}
                {!sidebarCollapsed && (
                    <div className="pl-sidebar__profile">
                        <div className="pl-sidebar__profile-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <div className="pl-sidebar__profile-info">
                            <strong>{user?.name || 'Penulis'}</strong>
                            <span>{user?.email || ''}</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="pl-sidebar__nav">
                    {filteredMenuItems.map(item => {
                        const hasChildren = item.children && item.children.length > 0;
                        const active = isActive(item.key);
                        const expanded = submenuOpen === item.key;

                        return (
                            <div key={item.key} className="pl-nav-group">
                                <button
                                    className={`pl-sidebar__item ${active ? 'pl-sidebar__item--active' : ''}`}
                                    onClick={() => {
                                        if (hasChildren) {
                                            toggleSubmenu(item.key);
                                        } else {
                                            navigate(item.key);
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    <span className="pl-sidebar__icon">{item.icon}</span>
                                    {!sidebarCollapsed && (
                                        <>
                                            <span className="pl-sidebar__label">{item.label}</span>
                                            {item.badge ? (
                                                <span className="pl-badge-pill">{item.badge}</span>
                                            ) : null}
                                            {hasChildren && (
                                                <span className={`pl-chevron ${expanded ? 'pl-chevron--open' : ''}`}>
                                                    ›
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {sidebarCollapsed && item.badge ? (
                                        <span className="pl-badge-dot" />
                                    ) : null}
                                </button>

                                {/* Submenu */}
                                {hasChildren && !sidebarCollapsed && expanded && (
                                    <div className="pl-submenu">
                                        {item.children!.map(child => (
                                            <button
                                                key={child.key}
                                                className={`pl-submenu__item ${location.pathname === child.key || location.pathname.startsWith(child.key + '/') ? 'pl-submenu__item--active' : ''}`}
                                                onClick={() => { navigate(child.key); setSidebarOpen(false); }}
                                            >
                                                <span className="pl-submenu__dot" />
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer with logout */}
                <div className="pl-sidebar__footer">
                    {!sidebarCollapsed && (
                        <button
                            className="pl-sidebar__logout"
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            🚪 Keluar
                        </button>
                    )}
                    {sidebarCollapsed && (
                        <button
                            className="pl-sidebar__logout-icon"
                            onClick={() => setShowLogoutConfirm(true)}
                            title="Keluar"
                        >
                            🚪
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="pl-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Main Content ── */}
            <main className="pl-main">

                {/* Header */}
                <header className="pl-header">
                    {/* Left: hamburger (mobile) */}
                    <button className="pl-header__toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span /><span /><span />
                    </button>

                    {/* Breadcrumb */}
                    <div className="pl-header__breadcrumb">
                        {currentLabel}
                    </div>

                    {/* Right actions */}
                    <div className="pl-header__actions">

                        {/* Search placeholder */}
                        <div className="pl-header__search">
                            <span className="pl-header__search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Cari..."
                                className="pl-header__search-input"
                                readOnly
                                onClick={() => navigate('/penulis/naskah')}
                            />
                        </div>

                        {/* Notification bell */}
                        <div className="pl-header__notif-wrap" ref={notifRef}>
                            <button
                                className={`pl-header__icon-btn ${notifOpen ? 'pl-header__icon-btn--active' : ''}`}
                                onClick={() => { setNotifOpen(o => !o); setUserDropOpen(false); }}
                                title="Notifikasi"
                            >
                                🔔
                                {unreadNotifCount > 0 && (
                                    <span className="pl-header__badge">{unreadNotifCount}</span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="pl-notif-dropdown">
                                    <div className="pl-notif-dropdown__header">
                                        <span>Notifikasi</span>
                                        {unreadNotifCount > 0 && (
                                            <button
                                                className="pl-notif-dropdown__mark-all"
                                                onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
                                            >
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>
                                    <div className="pl-notif-dropdown__list">
                                        {notifications.length === 0 ? (
                                            <div className="pl-notif-dropdown__empty">Tidak ada notifikasi</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`pl-notif-item ${!n.read ? 'pl-notif-item--unread' : ''}`}
                                                    onClick={() => setNotifications(prev =>
                                                        prev.map(x => x.id === n.id ? { ...x, read: true } : x)
                                                    )}
                                                >
                                                    <span className="pl-notif-item__icon">{notifIcon(n.type)}</span>
                                                    <div className="pl-notif-item__body">
                                                        <strong>{n.title}</strong>
                                                        <p>{n.message}</p>
                                                        <span className="pl-notif-item__time">{n.time}</span>
                                                    </div>
                                                    {!n.read && <span className="pl-notif-item__dot" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User avatar dropdown */}
                        <div className="pl-header__user-wrap" ref={userDropRef}>
                            <button
                                className={`pl-header__avatar-btn ${userDropOpen ? 'pl-header__avatar-btn--active' : ''}`}
                                onClick={() => { setUserDropOpen(o => !o); setNotifOpen(false); }}
                            >
                                <span className="pl-header__avatar">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                                </span>
                                <span className="pl-header__username">{user?.name?.split(' ')[0]}</span>
                                <span className="pl-header__chevron">▾</span>
                            </button>

                            {userDropOpen && (
                                <div className="pl-user-dropdown">
                                    <div className="pl-user-dropdown__info">
                                        <div className="pl-user-dropdown__avatar">
                                            {user?.name?.charAt(0)?.toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <strong>{user?.name}</strong>
                                            <span>{user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="pl-user-dropdown__divider" />
                                    <button
                                        className="pl-user-dropdown__item"
                                        onClick={() => { navigate('/penulis/setting'); setUserDropOpen(false); }}
                                    >
                                        ⚙️ Pengaturan
                                    </button>
                                    <button
                                        className="pl-user-dropdown__item"
                                        onClick={() => navigate('/penulis')}
                                    >
                                        🏠 Dashboard
                                    </button>
                                    <div className="pl-user-dropdown__divider" />
                                    <button
                                        className="pl-user-dropdown__item pl-user-dropdown__item--danger"
                                        onClick={() => { setShowLogoutConfirm(true); setUserDropOpen(false); }}
                                    >
                                        🚪 Keluar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick action */}
                        <button className="pl-header__btn" onClick={() => navigate('/penulis/kirim-naskah')}>
                            ➕ Kirim Naskah
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="pl-content">
                    <React.Suspense fallback={
                        <div className="pl-loading">
                            <div className="pl-loading__spinner" />
                            <p>Memuat...</p>
                        </div>
                    }>
                        <Routes>
                            <Route index element={<PenulisDashboard />} />
                            <Route path="naskah" element={<NaskahSayaPage />} />
                            <Route path="kirim-naskah" element={<KirimNaskahPage />} />
                            <Route path="cetak" element={<OrderCetakPage />} />
                            <Route path="ebook" element={<EbookLibraryPage />} />
                            <Route path="koleksi" element={<MyCollectionPage />} />
                            <Route path="pembelian" element={<PurchaseHistoryPage />} />
                            <Route path="chat/*" element={<ChatPage />} />
                            <Route path="setting/*" element={<PenulisSettingPage />} />
                            <Route path="*" element={<Navigate to="/penulis" replace />} />
                        </Routes>
                    </React.Suspense>
                </div>
            </main>

            {/* ── Logout Confirmation Modal ── */}
            {showLogoutConfirm && (
                <div className="pl-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="pl-modal" onClick={e => e.stopPropagation()}>
                        <div className="pl-modal__icon">🚪</div>
                        <h3 className="pl-modal__title">Konfirmasi Keluar</h3>
                        <p className="pl-modal__text">Apakah Anda yakin ingin keluar dari Portal Penulis?</p>
                        <div className="pl-modal__actions">
                            <button
                                className="pl-modal__btn pl-modal__btn--cancel"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Batal
                            </button>
                            <button
                                className="pl-modal__btn pl-modal__btn--danger"
                                onClick={handleLogout}
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PenulisLayout;

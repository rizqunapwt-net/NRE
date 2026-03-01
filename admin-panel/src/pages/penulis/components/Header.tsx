import React, { useState } from 'react';
import './Header.css';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface HeaderProps {
  pageTitle: string;
  onMenuClick: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onViewAllNotifications: () => void;
  userAvatar?: string;
  userName?: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onMenuClick,
  notifications,
  unreadCount,
  onMarkAllRead,
  onViewAllNotifications,
  userAvatar,
  userName,
  onLogout,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);

  const notifIcon = (type: Notification['type']) =>
    type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

  return (
    <header className="author-header">
      <div className="author-header__left">
        <button className="author-header__menu-btn" onClick={onMenuClick}>
          ☰
        </button>
        <h1 className="author-header__title">{pageTitle}</h1>
      </div>

      <div className="author-header__right">
        {/* Search Bar */}
        <div className="author-header__search">
          <input
            type="text"
            placeholder="Cari..."
            className="author-header__search-input"
          />
          <span className="author-header__search-icon">🔍</span>
        </div>

        {/* Notifications */}
        <div className="author-header__notifications">
          <button
            className="author-header__notif-btn"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            🔔
            {unreadCount > 0 && (
              <span className="author-header__notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="author-header__notif-dropdown">
              <div className="author-header__notif-header">
                <h4>Notifikasi</h4>
                <button onClick={onMarkAllRead}>Tandai semua dibaca</button>
              </div>
              <div className="author-header__notif-list">
                {notifications.length === 0 ? (
                  <p className="author-header__notif-empty">Tidak ada notifikasi</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`author-header__notif-item ${!notif.read ? 'unread' : ''}`}>
                      <span className="author-header__notif-icon">{notifIcon(notif.type)}</span>
                      <div className="author-header__notif-content">
                        <strong>{notif.title}</strong>
                        <p>{notif.message}</p>
                        <span className="author-header__notif-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                className="author-header__notif-footer"
                onClick={onViewAllNotifications}
              >
                Lihat Semua Notifikasi
              </button>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="author-header__user">
          <button
            className="author-header__user-btn"
            onClick={() => setUserDropOpen(!userDropOpen)}
          >
            <img
              src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=008B95&color=fff`}
              alt={userName}
              className="author-header__user-avatar"
            />
            <span className="author-header__user-name">{userName || 'User'}</span>
            <span className="author-header__user-arrow">›</span>
          </button>

          {userDropOpen && (
            <div className="author-header__user-dropdown">
              <div className="author-header__user-info">
                <strong>{userName}</strong>
                <span>Author Portal</span>
              </div>
              <div className="author-header__user-menu">
                <button>👤 Profil Saya</button>
                <button>⚙️ Pengaturan</button>
                <button>❓ Bantuan</button>
              </div>
              <div className="author-header__user-divider" />
              <button className="author-header__user-logout" onClick={onLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

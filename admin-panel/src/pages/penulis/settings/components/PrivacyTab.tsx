import React from 'react';

const PrivacyTab: React.FC = () => {
    return (
        <div className="pp-card pp-card--shadow">
            <div className="form-section">
                <div className="form-section__header">
                    <h3 className="form-section__title">📊 Privasi & Visibilitas</h3>
                    <p className="form-section__subtitle">Kontrol siapa yang dapat melihat profil dan aktivitas menulis Anda.</p>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Profil Publik</p>
                        <p className="notif-desc">Jika diaktifkan, profil penulis Anda dapat dilihat oleh pembaca di katalog website Rizquna.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Tampilkan Email di Profil</p>
                        <p className="notif-desc">Pembaca dapat melihat email Anda untuk keperluan kerjasama atau apresiasi langsung.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Statistik Penjualan Anonim</p>
                        <p className="notif-desc">Kontribusi data penjualan Anda secara anonim untuk statistik tren buku nasional.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div style={{ margin: '40px 0', height: 1, background: '#F3F4F6' }} />

            <div className="danger-zone">
                <h3 className="danger-zone__title">⚠️ Zona Bahaya</h3>
                <p className="danger-zone__desc">
                    Penghapusan akun bersifat permanen. Seluruh naskah, data royalti, dan informasi profil Anda akan terhapus dari server kami dalam 30 hari.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="pp-btn pp-btn--outline pp-btn--sm" style={{ borderColor: '#FCA5A5', color: '#B91C1C' }}>
                        📥 Download Semua Data (JSON)
                    </button>
                    <button className="pp-btn pp-btn--primary" style={{ background: '#DC2626', borderColor: '#DC2626' }}>
                        Tutup Akun Permanen
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyTab;

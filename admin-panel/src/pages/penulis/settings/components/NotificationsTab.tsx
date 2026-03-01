import React, { useState, useEffect } from 'react';
import api from '../../../../api';

interface Prefs {
    email_book_status: boolean;
    email_royalty_report: boolean;
    email_new_contract: boolean;
    push_chat: boolean;
}

const DEFAULT_PREFS: Prefs = {
    email_book_status: true,
    email_royalty_report: true,
    email_new_contract: true,
    push_chat: true,
};

const NotificationsTab: React.FC = () => {
    const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/v1/user/profile').then(res => {
            const p = res.data?.data?.notification_preferences;
            if (p) setPrefs({ ...DEFAULT_PREFS, ...p });
        }).catch(() => {});
    }, []);

    const toggle = (key: keyof Prefs) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);
        try {
            await api.put('/v1/user/notification-preferences', {
                notification_preferences: prefs,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: unknown) {
            const apiError = err as { response?: { data?: { message?: string } } };
            setError(apiError.response?.data?.message || 'Gagal menyimpan preferensi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pp-card pp-card--shadow">
            <div className="form-section">
                <div className="form-section__header">
                    <h3 className="form-section__title">📧 Pengaturan Notifikasi</h3>
                    <p className="form-section__subtitle">Pilih notifikasi yang ingin Anda terima di email dan browser.</p>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Pembaruan Status Naskah</p>
                        <p className="notif-desc">Dapatkan notifikasi email setiap kali naskah Anda berganti tahap (Review, Editing, ISBN, dll).</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={prefs.email_book_status} onChange={() => toggle('email_book_status')} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Laporan Royalti</p>
                        <p className="notif-desc">Ringkasan royalti dan laporan penjualan saat sudah tersedia.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={prefs.email_royalty_report} onChange={() => toggle('email_royalty_report')} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notif-item">
                    <div className="notif-info">
                        <p className="notif-title">Kontrak Baru</p>
                        <p className="notif-desc">Notifikasi email saat ada kontrak baru yang perlu Anda tanda tangani.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={prefs.email_new_contract} onChange={() => toggle('email_new_contract')} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <div className="notif-item" style={{ borderBottom: 'none' }}>
                    <div className="notif-info">
                        <p className="notif-title">Pesan Masuk (Chat)</p>
                        <p className="notif-desc">Notifikasi saat editor atau admin mengirimkan pesan melalui sistem chat.</p>
                    </div>
                    <label className="toggle-switch">
                        <input type="checkbox" checked={prefs.push_chat} onChange={() => toggle('push_chat')} />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: 8 }}>{error}</p>}
                {saved && <p style={{ color: '#10B981', fontSize: '0.85rem', marginTop: 8 }}>✓ Preferensi berhasil disimpan</p>}

                <div style={{ marginTop: 24 }}>
                    <button className="pp-btn pp-btn--primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Menyimpan...' : '💾 Simpan Preferensi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsTab;

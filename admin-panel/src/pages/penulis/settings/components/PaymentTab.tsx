import React from 'react';

const PaymentTab: React.FC = () => {
    return (
        <div className="pp-card pp-card--shadow">
            <div className="form-section">
                <div className="form-section__header">
                    <h3 className="form-section__title">💳 Metode Pembayaran Royalti</h3>
                    <p className="form-section__subtitle">Rekening bank yang Anda daftarkan akan digunakan untuk mencairkan royalti penjualan buku.</p>
                </div>

                <div className="bank-card">
                    <div className="bank-overlay"></div>
                    <p className="bank-name">BANK CENTRAL ASIA (BCA)</p>
                    <p className="bank-number">**** **** 7890</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <p className="bank-holder">Pemilik Rekening</p>
                            <p style={{ fontSize: '1rem', fontWeight: 700 }}>Ahmad Rizqi</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', background: '#10B981', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>VERIFIED ✓</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="pp-btn pp-btn--outline pp-btn--sm">Ganti Rekening</button>
                    <button className="pp-btn pp-btn--outline pp-btn--sm" style={{ color: '#DC2626' }}>Hapus</button>
                </div>
            </div>

            <div style={{ margin: '32px 0', height: 1, background: '#F3F4F6' }} />

            <div className="form-section">
                <div className="form-section__header">
                    <h3 className="form-section__title">📄 Dokumen Pajak (NPWP)</h3>
                    <p className="form-section__subtitle">Lengkapi NPWP untuk menghindari potongan pajak royalti yang lebih tinggi.</p>
                </div>

                <div className="pp-form-group">
                    <label className="pp-label">Nomor NPWP</label>
                    <input className="pp-input" placeholder="00.000.000.0-000.000" />
                </div>

                <div style={{ background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: 16 }}>Belum ada foto NPWP diunggah.</p>
                    <button className="pp-btn pp-btn--outline pp-btn--sm">📤 Upload Foto NPWP</button>
                </div>

                <div style={{ marginTop: 24 }}>
                    <button className="pp-btn pp-btn--primary">💾 Simpan Data Pajak</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentTab;

import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import './KirimNaskahPage.css';

type ManuscriptForm = {
    title: string;
    genre: string;
    synopsis: string;
    target_readers: string;
};
type ApiError = { response?: { data?: { message?: string } } };

const STEPS = [
    { num: 1, title: 'Profil', desc: 'Data Penulis' },
    { num: 2, title: 'Buku', desc: 'Judul & Genre' },
    { num: 3, title: 'Isi', desc: 'Sinopsis' },
    { num: 4, title: 'File', desc: 'Upload Naskah' },
    { num: 5, title: 'Review', desc: 'Cek Ulang' },
];

const KirimNaskahPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [requestId, setRequestId] = useState<number | null>(null);

    const [form, setForm] = useState<ManuscriptForm>({
        title: '',
        genre: '',
        synopsis: '',
        target_readers: '',
    });

    const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);

    const updateForm = (key: keyof ManuscriptForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const canGoNext = useMemo(() => {
        if (currentStep === 1) return true;
        if (currentStep === 2) return Boolean(form.title.trim() && form.genre.trim());
        if (currentStep === 3) return form.synopsis.trim().length >= 30;
        if (currentStep === 4) return Boolean(manuscriptFile);
        return true;
    }, [currentStep, form, manuscriptFile]);

    const nextStep = () => {
        if (!canGoNext) {
            if (currentStep === 3) setError('Sinopsis minimal harus 30 karakter agar dapat di-review dengan baik.');
            if (currentStep === 4) setError('File naskah (.pdf/.doc) wajib diunggah.');
            return;
        }
        setError('');
        setCurrentStep((prev) => Math.min(6, prev + 1));
    };

    const prevStep = () => {
        setError('');
        setCurrentStep((prev) => Math.max(1, prev - 1));
    };

    const submitRequest = async () => {
        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('title', form.title.trim());
            formData.append('genre', form.genre.trim());
            formData.append('synopsis', form.synopsis.trim());
            formData.append('target_readers', form.target_readers.trim());
            if (manuscriptFile) formData.append('manuscript', manuscriptFile);

            const res = await api.post('/user/publishing-requests', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setRequestId(res.data?.data?.id || null);
            setCurrentStep(6);
        } catch (err: unknown) {
            const apiError = err as ApiError;
            setError(apiError.response?.data?.message || 'Gagal mengirim naskah. Silakan periksa koneksi Anda.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="kn-form-card">
                        <h3 className="kn-card-title">Konfirmasi Profil Penulis</h3>
                        <div className="pp-grid pp-grid-2">
                            <div className="pp-form-group">
                                <label className="pp-label">Nama Lengkap</label>
                                <input className="pp-input" value={user?.name || '-'} disabled />
                            </div>
                            <div className="pp-form-group">
                                <label className="pp-label">Email</label>
                                <input className="pp-input" value={user?.email || '-'} disabled />
                            </div>
                        </div>
                        <div className="kn-info-box">
                            <span className="kn-info-icon">ℹ️</span>
                            <p className="kn-info-text">
                                Pastikan profil Anda sudah lengkap di menu <b>Pengaturan</b> (termasuk bio dan foto) untuk mempermudah proses publikasi.
                            </p>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="kn-form-card">
                        <h3 className="kn-card-title">Informasi Dasar Naskah</h3>
                        <div className="pp-form-group">
                            <label className="pp-label">Judul Naskah <span className="pp-required">*</span></label>
                            <input
                                className="pp-input"
                                placeholder="Masukkan judul utama buku Anda..."
                                value={form.title}
                                onChange={(e) => updateForm('title', e.target.value)}
                            />
                        </div>
                        <div className="pp-grid pp-grid-2">
                            <div className="pp-form-group">
                                <label className="pp-label">Kategori/Genre <span className="pp-required">*</span></label>
                                <select className="pp-select" value={form.genre} onChange={(e) => updateForm('genre', e.target.value)}>
                                    <option value="">Pilih Kategori</option>
                                    <option value="Buku Ajar">Buku Ajar (Dosen)</option>
                                    <option value="Monograf">Monograf</option>
                                    <option value="Novel">Novel / Sastra</option>
                                    <option value="Referensi">Buku Referensi</option>
                                    <option value="Motivasi">Pengembangan Diri</option>
                                </select>
                            </div>
                            <div className="pp-form-group">
                                <label className="pp-label">Target Pembaca</label>
                                <input
                                    className="pp-input"
                                    placeholder="Contoh: Mahasiswa, Guru, Umum"
                                    value={form.target_readers}
                                    onChange={(e) => updateForm('target_readers', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="kn-form-card">
                        <h3 className="kn-card-title">Sinopsis & Deskripsi</h3>
                        <div className="pp-form-group">
                            <label className="pp-label">Sinopsis Lengkap <span className="pp-required">*</span></label>
                            <textarea
                                className="pp-textarea"
                                placeholder="Tuliskan ringkasan isi buku, keunggulan, dan pesan utama yang ingin disampaikan..."
                                value={form.synopsis}
                                onChange={(e) => updateForm('synopsis', e.target.value)}
                            />
                            <p className="pp-help-text">
                                Minimal 30 karakter. Sinopsis yang bagus mempermudah editor memahami naskah Anda.
                            </p>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="kn-form-card">
                        <h3 className="kn-card-title">Upload Draft Naskah</h3>
                        <div
                            className={`kn-upload-zone ${manuscriptFile ? 'kn-upload-zone--has-file' : ''}`}
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={(e) => setManuscriptFile(e.target.files?.[0] || null)}
                            />
                            <span className="kn-upload-icon">{manuscriptFile ? '📄' : '📤'}</span>
                            {manuscriptFile ? (
                                <div>
                                    <p className="kn-file-name">{manuscriptFile.name}</p>
                                    <p className="kn-file-size">{(manuscriptFile.size / 1024 / 1024).toFixed(2)} MB • Klik untuk ganti file</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="kn-file-name">Pilih atau Taruh File Naskah</p>
                                    <p className="kn-file-size">Format: PDF, DOC, atau DOCX (Maks 20MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="kn-form-card">
                        <h3 className="kn-card-title">Review & Konfirmasi</h3>
                        <div className="kn-review-grid">
                            <div>
                                <label className="pp-label">Judul</label>
                                <p className="pp-text-bold">{form.title}</p>
                            </div>
                            <div>
                                <label className="pp-label">Genre</label>
                                <span className="pp-badge pp-badge--teal">{form.genre}</span>
                            </div>
                        </div>
                        <div className="pp-form-group">
                            <label className="pp-label">Sinopsis</label>
                            <div className="kn-synopsis-preview">
                                {form.synopsis}
                            </div>
                        </div>
                        <div className="kn-agreement-box">
                            <p className="kn-agreement-text">
                                Dengan menekan tombol <b>Kirim Naskah</b>, Anda setuju bahwa naskah ini adalah karya asli Anda dan bukan hasil plagiarisme.
                            </p>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="kn-form-card kn-success">
                        <span className="kn-success-icon">🚀</span>
                        <h2 className="kn-success-title">Naskah Terkirim!</h2>
                        <p className="kn-success-desc">
                            Naskah Anda <b>#{requestId || '...'}</b> telah masuk ke sistem editorial. Kami akan mereview dalam 3-5 hari kerja.
                        </p>
                        <div className="pp-btn-group">
                            <button className="pp-btn pp-btn--primary" onClick={() => navigate('/penulis/naskah')}>
                                Lihat Naskah Saya
                            </button>
                            <button className="pp-btn pp-btn--outline" onClick={() => navigate('/penulis')}>
                                Ke Dashboard
                            </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="kn-page-container">
            <div className="kn-stepper-card">
                <div className="kn-stepper">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className={`kn-step ${currentStep === s.num ? 'kn-step--active' : ''} ${currentStep > s.num ? 'kn-step--done' : ''}`}>
                                <div className="kn-step-num">{currentStep > s.num ? '✓' : s.num}</div>
                                <span className="kn-step-title">{s.title}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`kn-step-line ${currentStep > s.num ? 'kn-step-line--done' : ''}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {renderStep()}

            {error && (
                <div className="kn-error-alert">
                    ⚠️ {error}
                </div>
            )}

            {currentStep < 6 && (
                <div className="kn-footer">
                    <button className="pp-btn pp-btn--outline" onClick={prevStep} disabled={currentStep === 1 || submitting}>
                        Sebelumnya
                    </button>
                    <div className="kn-btn-group">
                        <button className="pp-btn pp-btn--outline" onClick={() => navigate('/penulis/naskah')} disabled={submitting}>
                            Batal
                        </button>
                        {currentStep < 5 ? (
                            <button className="pp-btn pp-btn--primary" onClick={nextStep} disabled={!canGoNext || submitting}>
                                Lanjut
                            </button>
                        ) : (
                            <button className="pp-btn pp-btn--accent" onClick={submitRequest} disabled={submitting}>
                                {submitting ? '⏳ Mengirim...' : '🚀 Kirim Naskah'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default KirimNaskahPage;

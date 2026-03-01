import React, { useState } from 'react';

const ContactPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    };

    return (
        <>
            {/* Hero */}
            <section className="contact-hero">
                <div className="container contact-hero__inner">
                    <h1 className="contact-hero__title">Hubungi Kami</h1>
                    <p className="contact-hero__subtitle">
                        Punya rencana cetak buku? Kirim detail kebutuhan Anda dan tim Rizquna akan bantu hitung serta rekomendasikan opsi produksi terbaik.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="contact-content">
                <div className="container contact-content__inner">
                    <div className="contact-grid">
                        {/* Contact Info */}
                        <div>
                            <h2 className="contact-section-title">Informasi Kontak</h2>
                            <div className="contact-info-list">
                                {[
                                    { icon: '📍', label: 'Alamat', value: 'Jl. KS. Tubun Gang Cemar, Purwokerto, Jawa Tengah' },
                                    { icon: '📱', label: 'WhatsApp', value: '081294856272', href: 'https://wa.me/6281294856272' },
                                    { icon: '✉️', label: 'Email', value: 'cv.rizqunaa@gmail.com', href: 'mailto:cv.rizqunaa@gmail.com' },
                                    { icon: '🕐', label: 'Jam Kerja', value: 'Senin – Jumat, 08:00 – 17:00 WIB' },
                                ].map((c, i) => (
                                    <div key={i} className="contact-info-item glass-card">
                                        <div className="contact-info-icon">{c.icon}</div>
                                        <div>
                                            <div className="contact-info-label">{c.label}</div>
                                            {c.href ? (
                                                <a href={c.href} className="contact-info-value contact-info-link">{c.value}</a>
                                            ) : (
                                                <div className="contact-info-value">{c.value}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Map */}
                            <div className="contact-map">
                                <iframe
                                    title="Lokasi Rizquna Elfath"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3956.345!2d109.234!3d-7.424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjUnMjYuNCJTIDEwOcKwMTQnMTQuNSJF!5e0!3m2!1sid!2sid!4v1"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                />
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="contact-section-title">Kirim Pesan</h2>

                            {submitted && (
                                <div className="contact-success">
                                    ✅ Pesan berhasil dikirim! Kami akan segera merespons.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="contact-field">
                                    <label>Nama Lengkap</label>
                                    <input required placeholder="Masukkan nama Anda" />
                                </div>
                                <div className="contact-field">
                                    <label>Email</label>
                                    <input required type="email" placeholder="email@contoh.com" />
                                </div>
                                <div className="contact-field">
                                    <label>Subjek</label>
                                    <select>
                                        <option>Konsultasi Cetak Buku</option>
                                        <option>Cetak Satuan / POD</option>
                                        <option>Cetak Massal / Offset</option>
                                        <option>Revisi File & Proofing</option>
                                        <option>Kerjasama</option>
                                        <option>Lainnya</option>
                                    </select>
                                </div>
                                <div className="contact-field">
                                    <label>Pesan</label>
                                    <textarea required rows={5} placeholder="Contoh: ukuran buku, jumlah cetak, target selesai, dan kebutuhan finishing." />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg contact-submit">
                                    Kirim Pesan
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ContactPage;

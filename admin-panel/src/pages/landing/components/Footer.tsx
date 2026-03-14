import React from 'react';
import { Link } from 'react-router-dom';
import logoHorizontal from '../../../assets/logo/logo_horizontal.png';

const Footer: React.FC = () => {
    return (
        <footer className="landing-footer">
            <div className="container">
                <div className="footer-content">
                    {/* Brand */}
                    <div className="footer-section">
                        <div className="footer-brand">
                            <img src={logoHorizontal} alt="Rizquna Elfath" className="footer-logo" />
                        </div>
                        <p className="footer-desc">
                            Penerbit & percetakan profesional anggota IKAPI. Melayani penerbitan buku, cetak on demand, ISBN resmi, dan distribusi nasional.
                        </p>
                        <div className="footer-ikapi-badge">
                            📜 IKAPI No. 199/JTE/2020
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h4>Info Kontak</h4>
                        <ul>
                            <li className="footer-contact-item">
                                <span>📍</span>
                                <span>Jl. KS. Tubun Gang Camar,<br />Purwokerto, Jawa Tengah</span>
                            </li>
                            <li className="footer-contact-item">
                                <span>📱</span>
                                <a href="tel:081294856272">081294856272</a>
                            </li>
                            <li className="footer-contact-item">
                                <span>✉️</span>
                                <a href="mailto:info@rizquna.id">info@rizquna.id</a>
                            </li>
                            <li className="footer-contact-item">
                                <span>🕐</span>
                                <span>Hari Kerja: 09.00 – 18.00</span>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h4>Tautan Cepat</h4>
                        <ul>
                            <li><a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer">Penerbitan Buku</a></li>
                            <li><a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer">Percetakan Profesional</a></li>
                            <li><Link to="/buku">Buku</Link></li>
                            <li><a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer">Konsultasi Menulis</a></li>
                            <li><a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer">Jasa Pengurusan HAKI</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="footer-section">
                        <h4>Buletin</h4>
                        <p>Dapatkan info layanan terbaru, promo percetakan, dan tips menulis langsung ke email Anda.</p>
                        <div className="newsletter-input">
                            <input type="email" placeholder="Email Anda" />
                            <button aria-label="Kirim">➤</button>
                        </div>
                        <div className="social-links">
                            <a href="https://instagram.com/penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
                            <a href="https://facebook.com/penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="Facebook">📘</a>
                            <a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
                            <a href="https://tiktok.com/@penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="TikTok">🎵</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} CV. New Rizquna Elfath. Hak cipta dilindungi.</span>
                    <span>
                        <a href="#">Kebijakan Privasi</a>
                        {' · '}
                        <a href="#">Syarat & Ketentuan</a>
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

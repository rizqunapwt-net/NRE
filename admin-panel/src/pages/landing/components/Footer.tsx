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
                            CV. New Rizquna Elfath<br />
                            Partner Cetak Buku Berkualitas
                        </p>
                        <div className="social-links">
                            <a href="https://instagram.com/penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📷</a>
                            <a href="https://facebook.com/penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="Facebook">📘</a>
                            <a href="https://wa.me/6281294856272" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
                            <a href="https://tiktok.com/@penerbitrizquna" target="_blank" rel="noopener noreferrer" aria-label="TikTok">🎵</a>
                        </div>
                    </div>

                    {/* Navigasi */}
                    <div className="footer-section">
                        <h4>Navigasi</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/katalog">Katalog Buku</Link></li>
                            <li><Link to="/contact">Konsultasi Cetak</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Layanan Cetak */}
                    <div className="footer-section">
                        <h4>Layanan Cetak</h4>
                        <ul>
                            <li><Link to="/contact">Konsultasi Cetak</Link></li>
                            <li><Link to="/contact">Print on Demand</Link></li>
                            <li><Link to="/contact">Cetak Massal / Offset</Link></li>
                            <li><Link to="/contact">Finishing & Binding</Link></li>
                        </ul>
                    </div>

                    {/* Kontak */}
                    <div className="footer-section">
                        <h4>Hubungi Kami</h4>
                        <ul>
                            <li className="footer-contact-item">
                                <span>📍</span>
                                <span>Jl. KS. Tubun Gang Cemar,<br />Purwokerto, Jawa Tengah</span>
                            </li>
                            <li className="footer-contact-item">
                                <span>📱</span>
                                <a href="https://wa.me/6281294856272">081294856272</a>
                            </li>
                            <li className="footer-contact-item">
                                <span>✉️</span>
                                <a href="mailto:cv.rizqunaa@gmail.com">cv.rizqunaa@gmail.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} CV. New Rizquna Elfath · IKAPI 199/JTE/2020</span>
                    <span>Made with ❤️ in Purwokerto</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

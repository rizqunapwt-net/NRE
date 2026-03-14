import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoHorizontal from '../../../assets/logo/logo_horizontal.png';

const Navbar: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const links = [
        { label: 'Home', href: '/' },
        { label: 'Buku', href: '/buku' },
        { label: 'Sitasi', href: '/sitasi' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return location.pathname === '/';
        return location.pathname.startsWith(href);
    };

    return (
        <nav className={`navbar-glass ${scrolled ? 'navbar-glass--scrolled' : ''}`}>
            <div className="container navbar-glass__inner">
                <Link to="/" className="navbar-glass__logo">
                    <img src={logoHorizontal} alt="Rizquna" />
                </Link>

                <div className="navbar-glass__nav desktop-nav">
                    {links.map(l => (
                        <Link
                            key={l.label}
                            to={l.href}
                            className={`navbar-glass__link ${isActive(l.href) ? 'navbar-glass__link--active' : ''}`}
                        >{l.label}</Link>
                    ))}
                </div>

                <div className="header-actions navbar-glass__actions">
                </div>

                <button
                    className="navbar-glass__mobile-toggle mobile-menu-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? (
                        <span style={{ fontSize: '24px', color: '#1A1F2E' }}>✕</span>
                    ) : (
                        <><span /><span /><span /></>
                    )}
                </button>
            </div>

            {mobileOpen && (
                <div className="navbar-glass__mobile-menu">
                    {links.map(l => (
                        <Link
                            key={l.label}
                            to={l.href}
                            className={`navbar-glass__mobile-link ${isActive(l.href) ? 'navbar-glass__mobile-link--active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >{l.label}</Link>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;

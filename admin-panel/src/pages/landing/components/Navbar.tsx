import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import logoHorizontal from '../../../assets/logo/logo_horizontal.png';

interface Props { scrolled?: boolean }

const Navbar: React.FC<Props> = () => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const isAuthenticated = !!user;
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
        { label: 'Katalog', href: '/katalog' },
        { label: 'Artikel', href: '/blog' },
        { label: 'Repository', href: '/repository' },
        { label: 'Kontak', href: '/contact' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return location.pathname === '/';
        return location.pathname.startsWith(href);
    };

    return (
        <nav className={`navbar-glass ${scrolled ? 'navbar-glass--scrolled' : ''}`}>
            <div className="container navbar-glass__inner">
                <Link to="/" className="navbar-glass__logo">
                    <img src={logoHorizontal} alt="Rizquna Elfath" />
                </Link>

                <div className="navbar-glass__nav desktop-nav">
                    {links.map(l => (
                        l.href.startsWith('/#') ? (
                            <a key={l.label} href={l.href} className="navbar-glass__link">{l.label}</a>
                        ) : (
                            <Link
                                key={l.label}
                                to={l.href}
                                className={`navbar-glass__link ${isActive(l.href) ? 'navbar-glass__link--active' : ''}`}
                            >{l.label}</Link>
                        )
                    ))}
                </div>

                <div className="header-actions navbar-glass__actions">
                    {/* Theme Switcher */}
                    <div className="navbar-glass__theme-switcher">
                        <button
                            onClick={() => setTheme('bokify')}
                            title="Editorial Minimalist"
                            className={`navbar-glass__theme-dot navbar-glass__theme-dot--light ${theme === 'bokify' ? 'navbar-glass__theme-dot--selected' : ''}`}
                        />
                        <button
                            onClick={() => setTheme('warm')}
                            title="Warm Library"
                            className={`navbar-glass__theme-dot navbar-glass__theme-dot--warm ${theme === 'warm' ? 'navbar-glass__theme-dot--selected-warm' : ''}`}
                        />
                        <button
                            onClick={() => setTheme('dark')}
                            title="Dark Reader"
                            className={`navbar-glass__theme-dot navbar-glass__theme-dot--dark ${theme === 'dark' ? 'navbar-glass__theme-dot--selected-dark' : ''}`}
                        />
                    </div>

                    {isAuthenticated ? (
                        <Link
                            to={user?.role === 'ADMIN' ? '/dashboard' : '/penulis'}
                            className="btn btn-primary navbar-glass__cta"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="navbar-glass__btn-secondary">Masuk</Link>
                            <Link to="/register" className="navbar-glass__btn-primary">Daftar</Link>
                        </>
                    )}
                </div>

                <button
                    className="navbar-glass__mobile-toggle mobile-menu-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span /><span /><span />
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
                    <div className="navbar-glass__mobile-actions">
                        {isAuthenticated ? (
                            <Link to={user?.role === 'ADMIN' ? '/dashboard' : '/penulis'}
                                className="btn btn-primary" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="navbar-glass__btn-secondary" onClick={() => setMobileOpen(false)}>Masuk</Link>
                                <Link to="/register" className="navbar-glass__btn-primary" onClick={() => setMobileOpen(false)}>Daftar</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;

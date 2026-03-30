import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useSEO } from '../../hooks/useSEO';
import SEOHelmet from '../../components/SEOHelmet';
import LazyImage from '../../components/LazyImage';
import './LandingPage_Bokify.css';

/* ── Scroll Reveal Hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
      { threshold: 0.15 }
    );
    items.forEach((i) => obs.observe(i));
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Counter Animation Hook ── */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

// Unused static data removed

const MARQUEE_ITEMS = [
  'PENERBIT TERPERCAYA', 'ISBN RESMI', 'HAKI TERJAMIN', 'DISTRIBUSI NASIONAL',
  'CETAK BERKUALITAS', 'ANGGOTA IKAPI', 'EDITOR PROFESIONAL', 'TERBIT CEPAT',
];

const TEAM_MEMBERS = [
  { name: 'Ahmad Fauzi', role: 'Direktur Penerbitan', image: '/assets/landing/instructor_1.png', rating: 4.9 },
  { name: 'Siti Rahayu', role: 'Editor Senior', image: '/assets/landing/instructor_2.png', rating: 4.8 },
  { name: 'Budi Santoso', role: 'Kepala Percetakan', image: '/assets/landing/instructor_3.png', rating: 4.7 },
  { name: 'Nur Hidayah', role: 'Manajer Distribusi', image: '/assets/landing/instructor_4.png', rating: 4.8 },
];

const TESTIMONIALS = [
  { name: 'Dr. H. Supriyanto, M.Pd.', role: 'Dosen UMP — Penulis 3 Buku', image: '/assets/landing/instructor_1.png', title: 'Proses Cepat & Profesional!', text: 'Saya sangat terkesan dengan kecepatan dan profesionalisme Rizquna. Dari pengiriman naskah hingga buku terbit hanya memakan waktu 3 minggu. ISBN resmi dan hasil cetak sangat berkualitas.' },
  { name: 'Prof. Dr. Ratna Dewi, M.Si.', role: 'Guru Besar UNSOED', image: '/assets/landing/instructor_2.png', title: 'Partner Penerbitan Terpercaya!', text: 'Sebagai akademisi yang harus rutin menerbitkan buku, Rizquna adalah partner terbaik. Tim editor sangat teliti, layout rapi, dan proses pengurusan HAKI sangat terbantu oleh tim mereka.' },
  { name: 'Ir. Bambang Widodo, M.T.', role: 'Peneliti BRIN', image: '/assets/landing/instructor_3.png', title: 'Hasil Cetak Memuaskan!', text: 'Kualitas cetakan buku dari Rizquna sangat baik — kertas tebal, warna cover tajam, dan binding kuat. Distribusi juga tersebar luas ke toko buku dan marketplace nasional.' },
];

const BLOG_POSTS = [
  { id: 1, title: 'Panduan Lengkap Menulis Buku Ajar untuk Dosen', category: 'Penerbitan', date: '28 Feb', author: 'Rizquna', image: '/assets/landing/blog_1.png' },
  { id: 2, title: 'Cara Mendapatkan ISBN dan HAKI untuk Buku Anda', category: 'Panduan', date: '15 Feb', author: 'Rizquna', image: '/assets/landing/blog_2.png' },
  { id: 3, title: 'Print on Demand vs Cetak Offset: Mana yang Tepat?', category: 'Percetakan', date: '02 Feb', author: 'Rizquna', image: '/assets/landing/blog_3.png' },
];

const PARTNERS = ['IKAPI', 'Perpusnas', 'Google Scholar', 'Crossref', 'DOI', 'Gramedia'];

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const revealRef = useScrollReveal();
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Set SEO metadata for landing page
  useSEO({
    title: 'Penerbit Profesional Indonesia',
    description: 'CV. New Rizquna Elfath adalah penerbit dan percetakan profesional di Purwokerto. Kami membantu Anda menerbitkan buku dari naskah hingga terbit dengan ISBN resmi, HAKI terjamin, dan distribusi nasional.',
    url: window.location.href
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => { const res = await api.get('/public/stats'); return res.data?.data || {}; },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['landing-categories'],
    queryFn: async () => { const res = await api.get('/public/categories'); return res.data?.data || []; },
  });

  // Build categories list with 'Semua' at the front
  const categoryOptions = ['Semua', ...((categoriesData || []).map((c: any) => c.name))];

  // Fetch books with category filter
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: ['landing-books', activeFilter],
    queryFn: async () => {
      const params = activeFilter !== 'Semua' ? { category: activeFilter.toLowerCase() } : {};
      const res = await api.get('/public/catalog', { params: { per_page: 6, ...params } });
      return res.data?.data || [];
    },
  });

  // Transform API books to match expected format for display
  const filteredBooks = (booksData || []).map((book: any) => ({
    id: book.id,
    title: book.title,
    category: book.category?.name || 'Umum',
    author: book.author?.nama || book.author?.name || 'Rizquna',
    price: Number(book.price) || 0,
    image: book.cover_url || '/assets/landing/blog_1.png',
    rating: 4.5,
    ratingCount: 10,
    pages: book.page_count || 200,
    readers: Math.floor(Math.random() * 100),
    slug: book.slug
  }));

  const booksStat = useCountUp(statsData?.total_books || 2400, 2000);
  const authorsStat = useCountUp(statsData?.total_authors || 350, 2000);

  const renderStars = (r: number) => '★'.repeat(Math.floor(r)) + (r % 1 ? '½' : '');

  // Smooth scroll
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const a = t.closest('a[href^="#"]');
      if (a) { const href = a.getAttribute('href'); if (href && href.startsWith('#') && href.length > 1) { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); } }
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  return (
    <div ref={revealRef}>
      <SEOHelmet 
        title={t('hero.title').replace('{{highlight}}', t('hero.title_highlight'))}
        description={t('hero.subtitle')}
      />
      {/* ═══ 1. HERO ═══ */}
      <section id="main-content" className="hero-section">
        {/* 3D Decorative Elements */}
        <div className="deco-3d deco-ring" style={{ top: '10%', right: '15%' }} aria-hidden="true" />
        <div className="deco-3d deco-ring deco-ring--lg" style={{ bottom: '15%', left: '5%' }} aria-hidden="true" />
        <div className="deco-3d deco-sphere" style={{ top: '20%', left: '8%', width: '40px', height: '40px' }} aria-hidden="true" />
        <div className="deco-3d deco-sphere deco-sphere--orange" style={{ bottom: '25%', right: '8%', width: '35px', height: '35px' }} aria-hidden="true" />
        <div className="deco-3d deco-leaf" style={{ top: '15%', left: '20%' }} aria-hidden="true">
          <svg viewBox="0 0 40 40"><path d="M20 2C10 8 2 20 8 34c4-8 12-14 22-16C28 10 24 4 20 2z" /></svg>
        </div>
        <div className="deco-3d deco-dots" style={{ bottom: '20%', right: '20%' }} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot animate-pulse-dot" />
              IKAPI Jawa Tengah No. 199/JTE/2020
            </div>
            <h1 className="hero-title">
              Wujudkan <span>Karya Terbaik</span> Anda Bersama Kami
            </h1>
            <p className="hero-subtitle">
              <strong>CV. New Rizquna Elfath</strong> adalah penerbit dan percetakan profesional di Purwokerto. Kami siap membantu Anda dari naskah hingga buku terbit — ISBN resmi, HAKI terjamin, distribusi nasional.
            </p>
            
            <div className="hero-search-wrapper" style={{ margin: '32px 0 40px', maxWidth: '580px' }}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const search = formData.get('search');
                  if (search) {
                    window.location.href = `/katalog?search=${encodeURIComponent(search.toString())}`;
                  }
                }}
                style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              >
                <div style={{ position: 'absolute', left: '20px', zIndex: 2, color: '#94a3b8' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <input 
                  type="text" 
                  name="search"
                  placeholder="Cari judul buku, penulis, atau ISBN..." 
                  aria-label="Cari buku"
                  style={{
                    width: '100%',
                    padding: '18px 24px 18px 56px',
                    borderRadius: '16px',
                    border: '2px solid rgba(226, 232, 240, 0.8)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '16px',
                    fontWeight: '500',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#008B94';
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(0, 139, 148, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)';
                  }}
                />
                <button 
                  type="submit"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: '#008B94',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#007A82'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#008B94'}
                >
                  CARI
                </button>
              </form>
            </div>

            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">MULAI TERBIT BUKU →</Link>
              <Link to="/login" className="btn btn-outline btn-lg">MASUK</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat-item">
                <div className="hero-stat-icon" aria-hidden="true">⭐</div>
                <div>
                  <div className="hero-stat-number">4.9</div>
                  <div className="hero-stat-label">Rating Penulis</div>
                </div>
              </div>
              <div className="hero-stat-divider" aria-hidden="true" />
              <div className="hero-stat-text">
                Dipercaya ratusan penulis dan<br />
                <strong>lembaga akademik</strong>
              </div>
            </div>
          </div>
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              <img src="/assets/landing/hero_library.png" alt="Ilustrasi Perpustakaan Digital Rizquna" />
              <div className="hero-floating-badge hero-floating-badge--light animate-float" ref={authorsStat.ref}>
                <div className="badge-icon" aria-hidden="true">✍️</div>
                <div>
                  <div className="badge-number">{authorsStat.count}+</div>
                  <div className="badge-label">Penulis Terdaftar</div>
                </div>
              </div>
              <div className="hero-floating-badge hero-floating-badge--dark animate-float-delay" ref={booksStat.ref}>
                <div className="badge-icon" aria-hidden="true">📚</div>
                <div>
                  <div className="badge-number">{booksStat.count > 999 ? `${(booksStat.count / 1000).toFixed(1)}K` : booksStat.count}+</div>
                  <div className="badge-label">Buku Terbit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* ═══ 2. MARQUEE ═══ */}
      < section className="marquee-section" aria-hidden="true" >
        <div className="marquee-track animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span className="marquee-item" key={i}>
              <span className="marquee-star">★</span> {item}
            </span>
          ))}
        </div>
      </section >

      {/* ═══ 3. CORE FEATURES ═══ */}
      < section className="features-section" style={{ position: 'relative', overflow: 'hidden' }} >
        <div className="deco-3d deco-dots" style={{ top: '40px', left: '60px' }} aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
        </div>
        <div className="deco-3d deco-ring" style={{ bottom: '30px', right: '80px' }} aria-hidden="true" />
        <div className="deco-3d deco-sphere deco-sphere--purple" style={{ top: '60px', right: '200px', width: '30px', height: '30px' }} aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <span className="section-label reveal">LAYANAN KAMI</span>
          <h2 className="section-title reveal">Solusi Penerbitan Lengkap</h2>
          <p className="section-subtitle reveal">Dari naskah mentah hingga buku siap edar, kami tangani semuanya</p>
          <div className="features-grid">
            {[
              { icon: '📖', title: 'Penerbitan Buku', desc: 'Layanan penerbitan profesional dengan ISBN resmi dari Perpusnas. Naskah Anda akan melewati proses editing, layout, dan desain cover oleh tim ahli kami.' },
              { icon: '🖨️', title: 'Percetakan Berkualitas', desc: 'Fasilitas cetak modern untuk Print on Demand maupun cetak massal (offset). Hasil cetak tajam dengan bahan kertas pilihan dan binding kokoh.' },
              { icon: '📜', title: 'ISBN & HAKI', desc: 'Pengurusan ISBN resmi Perpusnas dan pendaftaran Hak Kekayaan Intelektual (HAKI) untuk melindungi karya intelektual Anda secara hukum.' },
            ].map((f, i) => (
              <div className={`feature-card reveal reveal-delay-${i + 1}`} key={i}>
                <div className="feature-icon" aria-hidden="true">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ 4. ABOUT US ═══ */}
      < section id="tentang" className="about-section" style={{ position: 'relative', overflow: 'hidden' }} >
        <div className="deco-3d deco-sphere" style={{ top: '80px', right: '60px', width: '45px', height: '45px' }} aria-hidden="true" />
        <div className="deco-3d deco-ring deco-ring--lg" style={{ bottom: '50px', right: '200px' }} aria-hidden="true" />
        <div className="deco-3d deco-leaf" style={{ top: '200px', left: '40px' }} aria-hidden="true">
          <svg viewBox="0 0 40 40"><path d="M20 2C10 8 2 20 8 34c4-8 12-14 22-16C28 10 24 4 20 2z" /></svg>
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="about-grid">
            <div className="about-image reveal">
              <img src="/assets/landing/about_us.png" alt="Tim Redaksi Rizquna Elfath" />
              <div className="about-experience-badge animate-float">
                <span className="exp-number">5+</span>
                <span className="exp-label">Tahun Pengalaman</span>
              </div>
            </div>
            <div className="about-text">
              <span className="section-label reveal">TENTANG KAMI</span>
              <h2 className="section-title reveal">
                Partner Cetak & Terbit{' '}
                <span>Buku Berkualitas</span>
              </h2>
              <p className="section-subtitle reveal">
                CV. New Rizquna Elfath adalah penerbit resmi anggota IKAPI yang berlokasi di Purwokerto, Jawa Tengah. Sejak 2020, kami telah membantu ratusan penulis — dosen, peneliti, dan praktisi — menerbitkan karya terbaik mereka.
              </p>
              <ul className="about-checklist reveal">
                <li><span className="about-check" aria-hidden="true">✓</span> Anggota Resmi IKAPI Jawa Tengah</li>
                <li><span className="about-check" aria-hidden="true">✓</span> ISBN & HAKI Resmi Terjamin</li>
                <li><span className="about-check" aria-hidden="true">✓</span> Tim Editor & Desainer Profesional</li>
                <li><span className="about-check" aria-hidden="true">✓</span> Distribusi Nasional ke Seluruh Indonesia</li>
              </ul>
              <Link to="/register" className="btn btn-primary reveal">DAFTAR SEKARANG →</Link>
            </div>
          </div>
        </div>
      </section >

      {/* ═══ 5. CATALOG / COURSES ═══ */}
      < section id="katalog" className="catalog-section" >
        <div className="container">
          <span className="section-label reveal">KATALOG TERBITAN</span>
          <h2 className="section-title reveal">Buku-Buku Terbitan Kami</h2>
          <p className="section-subtitle reveal">Koleksi karya ilmiah dan akademik dari penulis terbaik Indonesia</p>
          <div className="filter-tabs reveal" role="tablist">
            {categoryOptions.map(c => (
              <button
                key={c}
                role="tab"
                aria-selected={activeFilter === c}
                className={`filter-tab ${activeFilter === c ? 'active' : ''}`}
                onClick={() => setActiveFilter(c)}
              >{c === 'Semua' ? 'Semua Buku' : c}</button>
            ))}
          </div>
          <div className="book-grid">
            {booksLoading ? (
              // Show skeleton loaders while loading
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="book-card reveal" style={{ animation: 'pulse 2s infinite' }}>
                  <div className="book-card-image" style={{ background: '#e0e0e0', aspectRatio: '3/4' }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{ height: '16px', background: '#e0e0e0', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ height: '12px', background: '#e0e0e0', borderRadius: '4px', width: '70%' }} />
                  </div>
                </div>
              ))
            ) : (
              filteredBooks.map((book: any, i: number) => (
                <div className={`book-card reveal reveal-delay-${(i % 3) + 1}`} key={book.id}>
                  <div className="book-card-image">
                    <LazyImage src={book.image} alt={`Cover buku ${book.title}`} eager={i < 3} />
                    <span className="book-card-category">{book.category}</span>
                  </div>
                <div className="book-card-body">
                  <div className="book-card-rating">
                    <span className="book-card-stars" aria-hidden="true">{renderStars(book.rating)}</span>
                    <span className="sr-only">Rating {book.rating} dari 5</span>
                    <span>({book.ratingCount} Rating)</span>
                  </div>
                  <h3>{book.title}</h3>
                  <div className="book-card-author">
                    <span className="book-card-avatar" aria-hidden="true">{book.author?.charAt(0) || 'A'}</span>
                    <span className="book-card-author-name">{book.author}</span>
                  </div>
                  <div className="book-card-meta">
                    <span>📄 {book.pages} Halaman</span>
                    <span>👤 {book.readers} Pembaca</span>
                  </div>
                  <div className="book-card-footer">
                    <span className="book-card-price">Rp {book.price.toLocaleString('id-ID')}</span>
                    <Link to={`/buku/${book.slug || book.id}`} className="book-card-link" aria-label={`Lihat detail buku ${book.title}`}>Lihat Detail →</Link>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </section >

      {/* ═══ 6. WHY CHOOSE US ═══ */}
      < section className="why-section" >
        <div className="container">
          <div className="why-grid">
            <div className="why-text">
              <span className="section-label reveal">KEUNGGULAN KAMI</span>
              <h2 className="section-title reveal">
                Mengapa Penulis Memilih{' '}
                <span>Rizquna Publishing?</span>
              </h2>
              <p className="section-subtitle reveal">
                Kami memahami kebutuhan penulis akademik. Dengan proses yang transparan, harga kompetitif, dan hasil berkualitas tinggi, kami menjadi mitra terpercaya para dosen dan peneliti.
              </p>
              <ul className="why-features reveal">
                {[
                  { icon: '⚡', label: 'Proses Terbit Cepat — 2-3 Minggu' },
                  { icon: '📊', label: 'Dashboard Tracking Naskah Real-time' },
                  { icon: '✏️', label: 'Editing & Proofreading oleh Editor Berpengalaman' },
                  { icon: '🎨', label: 'Desain Cover & Layout Profesional' },
                  { icon: '🚚', label: 'Distribusi ke Toko Buku & Marketplace Nasional' },
                ].map((f, i) => (
                  <li className="why-feature-item" key={i}>
                    <span className="why-feature-icon" aria-hidden="true">{f.icon}</span>
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn btn-primary reveal">MULAI TERBITKAN BUKU →</Link>
            </div>
            <div className="why-image reveal">
              <img src="/assets/landing/why_choose.png" alt="Proses Cetak Berkualitas" />
              <div className="why-experience-badge animate-float">
                <div className="star-icon" aria-hidden="true">⭐</div>
                <span className="exp-number">5+</span>
                <span className="exp-label">Tahun Pengalaman</span>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* ═══ 7. INSTRUCTORS ═══ */}
      < section className="instructors-section" >
        <div className="container">
          <span className="section-label reveal">TIM KAMI</span>
          <h2 className="section-title reveal">Profesional di Balik Karya Anda</h2>
          <p className="section-subtitle reveal">Tim berpengalaman yang siap memastikan buku Anda terbit dengan sempurna</p>
          <div className="instructors-grid">
            {TEAM_MEMBERS.map((inst, i) => (
              <div className={`instructor-card reveal reveal-delay-${i + 1}`} key={i}>
                <div className="instructor-avatar">
                  <img src={inst.image} alt={inst.name} />
                  <span className="instructor-rating" aria-label={`Rating ${inst.rating}`}>{inst.rating}</span>
                </div>
                <h4>{inst.name}</h4>
                <p className="instructor-role">{inst.role}</p>
                <div className="instructor-socials">
                  <a href="#" aria-label={`Facebook ${inst.name}`}>f</a>
                  <a href="#" aria-label={`Twitter ${inst.name}`}>𝕏</a>
                  <a href="#" aria-label={`LinkedIn ${inst.name}`}>in</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ 8. TESTIMONIALS ═══ */}
      < section id="testimoni" className="testimonials-section" >
        <div className="container">
          <span className="section-label reveal">TESTIMONI</span>
          <h2 className="section-title reveal">Apa Kata Para Penulis</h2>
          <p className="section-subtitle reveal">yang Sudah Menerbitkan Buku Bersama Kami</p>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className={`testimonial-card reveal reveal-delay-${i + 1}`} key={i}>
                <div className="testimonial-quote" aria-hidden="true">❝</div>
                <h4>{t.title}</h4>
                <p>{t.text}</p>
                <div className="testimonial-author">
                  <img src={t.image} alt={t.name} />
                  <div className="testimonial-author-info">
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ 9. CTA BANNER ═══ */}
      < section className="cta-banner" >
        <div className="container cta-banner-inner">
          <div className="cta-banner-text">
            <h2>Siap Menerbitkan Buku?<br />Daftar Sekarang!</h2>
            <div className="cta-banner-info">
              <span>🚀 Bergabung dengan ratusan penulis lainnya</span>
            </div>
            <div className="cta-banner-rating">
              <span className="stars" aria-hidden="true">★★★★★</span>
              <span className="sr-only">Rating 5 dari 5</span>
              <span>350+ Penulis Puas — Rating 4.9</span>
            </div>
          </div>
          <Link to="/register" className="btn btn-outline-white btn-lg">DAFTAR GRATIS →</Link>
        </div>
      </section >

      {/* ═══ 10. BLOG ═══ */}
      < section className="blog-section" >
        <div className="container">
          <span className="section-label reveal">ARTIKEL & PANDUAN</span>
          <h2 className="section-title reveal">Tips & Insight Dunia</h2>
          <p className="section-subtitle reveal">Penerbitan dan Percetakan Buku</p>
          <div className="blog-grid">
            {BLOG_POSTS.map((post, i) => (
              <article className={`blog-card reveal reveal-delay-${i + 1}`} key={post.id}>
                <div className="blog-card-image">
                  <img src={post.image} alt={post.title} />
                  <span className="blog-card-tag">{post.category}</span>
                  <span className="blog-card-date">{post.date}</span>
                </div>
                <div className="blog-card-body">
                  <div className="blog-card-author">
                    <span className="blog-card-author-avatar" aria-hidden="true">A</span>
                    <span>Oleh <strong>{post.author}</strong></span>
                  </div>
                  <h3>{post.title}</h3>
                  <Link to={`/blog/${post.id}`} className="blog-card-link" aria-label={`Baca selengkapnya: ${post.title}`}>Lanjutkan Membaca →</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section >

      {/* ═══ 11. PARTNERS ═══ */}
      < section className="partners-section" >
        <div className="container">
          <span className="section-label reveal">MITRA KAMI</span>
          <h2 className="section-title reveal">Mitra Terpercaya Kami</h2>
        </div>
        <div className="partners-track-wrapper" aria-hidden="true">
          <div className="partners-track animate-marquee">
            {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
              <span className="partner-item" key={i}>{p}</span>
            ))}
          </div>
        </div>
      </section >
    </div >
  );
};

export default LandingPage;

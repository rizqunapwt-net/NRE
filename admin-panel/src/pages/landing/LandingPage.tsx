import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import './LandingPage_Bokify.css';

const LandingPage: React.FC = () => {
  // Fetch Data from APIs
  const { data: booksData } = useQuery({
    queryKey: ['public-catalog'],
    queryFn: async () => {
      const res = await api.get('/public/catalog?per_page=4');
      return res.data?.data || [];
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await api.get('/public/stats');
      return res.data?.data || {};
    }
  });

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      {/* Hero Section - Direct & Visual */}
      <section id="home" className="hero-section">
        <div className="container hero-content">
          <div className="hero-text">
            <p className="hero-pretitle">Portal Operasional & Marketplace</p>
            <h1 className="hero-title">Solusi Terpadu Penerbitan & Percetakan Digital</h1>
            <p className="hero-subtitle">
              Platform pendukung rizquna.id untuk menangani seluruh proses produksi naskah, cetak buku mandiri, hingga distribusi karya di perpustakaan digital.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg">
                Mulai Kirim Naskah
              </Link>
              <Link to="/percetakan/calculator" className="btn btn-outline btn-lg">
                Hitung Biaya Cetak
              </Link>
            </div>
          </div>
          <div className="hero-image-container">
            <img
              src="/assets/hero_mockup.png"
              alt="Rizquna Digital Ecosystem"
            />
          </div>
        </div>
      </section>

      {/* Service Pillars - High Impact Visual Cards */}
      <section className="service-pillars">
        <div className="container">
          <div className="pillars-grid">
            <div className="pillar-item">
              <img src="/assets/service_publishing.png" className="pillar-bg" alt="Publishing" />
              <div className="pillar-content">
                <div className="pillar-label">Layanan 01</div>
                <h3>Digital Publishing Hub</h3>
                <p>Ekosistem authoring modern untuk manajemen naskah profesional, proses editorial terukur, hingga pengurusan legalitas ISBN.</p>
                <Link to="/penulis/dashboard" className="pillar-link">Masuk Dashboard Penulis →</Link>
              </div>
            </div>

            <div className="pillar-item">
              <img src="/assets/service_printing.png" className="pillar-bg" alt="Printing" />
              <div className="pillar-content">
                <div className="pillar-label">Layanan 02</div>
                <h3>Smart Printing Marketplace</h3>
                <p>Sistem cetak mandiri (POD & Offset) dengan transparansi biaya instan dan pemantauan lini produksi secara real-time.</p>
                <Link to="/percetakan/calculator" className="pillar-link">Hitung Biaya & Cetak →</Link>
              </div>
            </div>

            <div className="pillar-item">
              <img src="/assets/service_marketplace.png" className="pillar-bg" alt="Marketplace" />
              <div className="pillar-content">
                <div className="pillar-label">Layanan 03</div>
                <h3>Integrated Digital Library</h3>
                <p>E-book system dan pusat distribusi literasi digital yang menghubungkan karya Anda langsung ke jaringan pembaca Rizquna.</p>
                <Link to="/katalog" className="pillar-link">Akses E-book & Library →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-section__grid">
            <div className="stats-section__item">
              <h2 className="stats-section__number">{statsData?.total_books || 0}+</h2>
              <p className="stats-section__label">Buku Terbit</p>
            </div>
            <div className="stats-section__item">
              <h2 className="stats-section__number">{statsData?.total_authors || 0}+</h2>
              <p className="stats-section__label">Penulis Aktif</p>
            </div>
            <div className="stats-section__item">
              <h2 className="stats-section__number">{statsData?.years_active || 4}+</h2>
              <p className="stats-section__label">Tahun Melayani</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - The Editorial Timeline */}
      <section id="how-it-works" className="process-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <p className="hero-pretitle">Alur Penerbitan</p>
            <h2 className="section-title">Wujudkan Karya Anda Bersama Kami</h2>
            <p className="section-subtitle">
              Sistem manajemen naskah yang terintegrasi, memudahkan setiap penulis memantau perkembangan bukunya secara real-time.
            </p>
          </div>

          <div className="process-flow">
            {[
              { num: '01', title: 'Kirim Naskah', desc: 'Unggah draf karya Anda melalui Dashboard Penulis.' },
              { num: '02', title: 'Review & Kurasi', desc: 'Tim admin meninjau kelengkapan dan standar kualitas.' },
              { num: '03', title: 'Editing & Layout', desc: 'Produksi visual dan penyempurnaan teks secara profesional.' },
              { num: '04', title: 'Pengurusan ISBN', desc: 'Pendaftaran legalitas buku otomatis ke Perpusnas.' },
              { num: '05', title: 'Terbit & Jual', desc: 'Buku siap dipasarkan di E-book Library & Marketplace.' }
            ].map((step) => (
              <div className="process-step" key={step.num}>
                <span className="step-number">{step.num}</span>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview - Operational Transparency */}
      <section className="dashboard-preview">
        <div className="container">
          <div className="dashboard-flex">
            <div className="dashboard-img">
              <img src="/assets/dashboard_mockup.png" alt="Author Dashboard Mockup" />
            </div>
            <div className="dashboard-text">
              <p className="hero-pretitle">Transparansi 24/7</p>
              <h2 className="section-title">Pantau Setiap Langkah Karya Anda</h2>
              <p className="section-subtitle">
                Tidak lagi bertanya-tanya kapan buku Anda selesai. Melalui Dashboard Penulis, Anda mendapatkan visibilitas penuh terhadap proses editing, pendaftaran ISBN, hingga status distribusi secara real-time.
              </p>
              <ul className="dashboard-features">
                <li>✅ Notifikasi Otomatis setiap progres selesai</li>
                <li>✅ Chat Langsung dengan Editor & Desainer</li>
                <li>✅ Laporan Penjualan & Royalti Transparan</li>
                <li>✅ Kelola E-book & Cetakan dalam satu tempat</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Books */}
      <section id="catalog" className="collection-section">
        <div className="container">
          <div className="section-header">
            <p className="hero-pretitle">Katalog Ringkas</p>
            <h2 className="section-title">Koleksi Buku Terbaru</h2>
          </div>

          {booksData && booksData.length > 0 ? (
            <div className="book-grid">
              {booksData.slice(0, 4).map((book: any) => (
                <Link to={`/katalog/${book.slug}`} key={book.id} className="book-card">
                  <div className="book-cover-img">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} />
                    ) : (
                      <span className="cover-art">📚</span>
                    )}
                  </div>
                  <h3>{book.title}</h3>
                  <p className="author">{book.author?.nama || 'Unknown Author'}</p>
                  <p className="price">Rp {Number(book.price).toLocaleString('id-ID')}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="no-books">Belum ada buku yang tersedia.</p>
          )}

          <div className="catalog-cta">
            <Link to="/katalog" className="btn btn-outline btn-lg">
              Jelajahi Seluruh Katalog →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default LandingPage;

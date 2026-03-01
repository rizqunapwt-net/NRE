import React, { useEffect, useState } from 'react';
import ArticleCard from './components/ArticleCard';
import { toArticle } from './utils';
import type { Article, BlogApiItem } from './types';
import './BlogPages.css';


const BlogIndexPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (page === 1) setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: '9',
        });

        if (search) params.set('search', search);

        const res = await fetch(`/api/v1/public/blog?${params.toString()}`);
        const payload = await res.json();

        if (payload.data && payload.data.length > 0) {
          const incoming = payload.data.map((item: BlogApiItem) => toArticle(item));
          if (!alive) return;
          setArticles((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
          setHasMore((payload.current_page || 1) < (payload.last_page || 1));
        } else {
          if (!alive) return;
          if (page === 1) setArticles([]);
          setHasMore(false);
        }
      } catch {
        if (!alive) return;
        setHasMore(false);
        if (page === 1) setArticles([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [page, search]);


  return (
    <>
      {/* Hero Header */}
      <section className="blog-index-hero">
        <div className="container">
          <p className="blog-index-hero__pretitle">Wawasan & Inspirasi</p>
          <h1 className="blog-index-hero__title">
            Artikel & Sumber Daya<br />
            Terbaru dari Kami
          </h1>
          <div className="blog-index-hero__search">
            <input
              type="text"
              placeholder="Cari artikel atau topik..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="blog-index-hero__input"
            />
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="blog-index-grid-section">
        <div className="container">
          {loading ? (
            <div className="blog-index-loading">
              <div className="blog-index-spinner" />
            </div>
          ) : articles.length === 0 ? (
            <div className="blog-index-empty">
              <p>Tidak ada artikel ditemukan.</p>
            </div>
          ) : (
            <>
              <div className="blog-index-grid">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {hasMore && (
                <div className="blog-index-loadmore">
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="btn btn-primary"
                  >
                    Muat Lebih Banyak
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default BlogIndexPage;

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArticleHeader from './components/ArticleHeader';
import AuthorBio from './components/AuthorBio';
import RelatedArticles from './components/RelatedArticles';
import type { Article, BlogApiItem } from './types';
import { parseIdFromSlug, toArticle, withHeadingIds } from './utils';
import './BlogPages.css';


const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const articleId = useMemo(() => parseIdFromSlug(slug || ''), [slug]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      try {
        const [detailRes, relatedRes] = await Promise.all([
          fetch(`/api/v1/public/blog/${articleId}`),
          fetch('/api/v1/public/blog?per_page=12'),
        ]);

        const detailPayload = await detailRes.json();
        const relatedPayload = await relatedRes.json();

        if (detailPayload.data) {
          const mapped = toArticle(detailPayload.data as BlogApiItem);
          const relatedMapped = ((relatedPayload.data || []) as BlogApiItem[])
            .map(toArticle)
            .filter((item) => item.id !== mapped.id)
            .slice(0, 3);

          if (!alive) return;

          setArticle(mapped);
          setRelated(relatedMapped);
        } else {
          if (alive) setArticle(null);
        }
      } catch (err) {
        console.error("Failed to load blog detail", err);
        if (alive) setArticle(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (articleId) load();

    return () => {
      alive = false;
    };
  }, [articleId, slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #dde3ef',
          borderTopColor: '#008B94', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, marginBottom: 20 }}>Artikel tidak ditemukan.</h2>
        <Link to="/blog" className="btn btn-primary">Kembali ke Blog</Link>
      </div>
    );
  }

  const contentWithIds = withHeadingIds(article.content);

  return (
    <>
      <article style={{ background: '#fff', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <ArticleHeader article={article} />

          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div
              className="blog-content-premium"
              style={{
                fontSize: 18,
                lineHeight: 1.8,
                color: '#1f2937',
                fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif"
              }}
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />

            <div style={{
              marginTop: 48,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              borderBottom: '1px solid #dde3ef',
              paddingBottom: 48
            }}>
              {article.tags.map((tag) => (
                <span key={tag} style={{
                  background: '#f8fafc',
                  color: '#4f5669',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid #dde3ef'
                }}>#{tag}</span>
              ))}
            </div>

            <AuthorBio author={article.author} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section style={{ background: '#f8fafc', padding: '80px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: '#06072c' }}>Artikel Terkait</h2>
              <p style={{ color: '#4f5669', fontSize: 17 }}>Mungkin Anda juga tertarik dengan topik berikut</p>
            </div>
            <RelatedArticles articles={related} />
          </div>
        </section>
      )}

      <style>{`
        .blog-content-premium h2 {
          font-family: 'DM Serif Display', serif;
          font-size: 36px;
          font-weight: 400;
          color: #06072c;
          margin: 1.5em 0 0.8em;
          line-height: 1.25;
        }
        .blog-content-premium h3 {
          font-family: 'DM Serif Display', serif;
          font-size: 28px;
          font-weight: 400;
          color: #06072c;
          margin: 1.5em 0 0.8em;
        }
        .blog-content-premium p { margin-bottom: 24px; }
        .blog-content-premium ul, .blog-content-premium ol { margin-bottom: 24px; padding-left: 20px; }
        .blog-content-premium li { margin-bottom: 12px; }
        .blog-content-premium blockquote {
          border-left: 4px solid #008B94;
          padding: 24px 32px;
          margin: 40px 0;
          background: #f2f5fb;
          font-style: italic;
          font-size: 20px;
          border-radius: 0 16px 16px 0;
        }
        .blog-content-premium img {
          max-width: 100%;
          border-radius: 16px;
          margin: 32px 0;
        }
      `}</style>
    </>
  );
};

export default BlogDetailPage;

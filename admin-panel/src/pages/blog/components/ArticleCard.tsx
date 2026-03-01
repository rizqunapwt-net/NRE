import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';

interface Props {
  article: Article;
}

const ArticleCard: React.FC<Props> = ({ article }) => {
  return (
    <Link
      to={`/blog/${article.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '16 / 10',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#f2f5fb',
      }}>
        <img
          src={article.featuredImage || '/placeholder-blog.jpg'}
          alt={article.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: '#edf3ff',
            color: '#008B94',
            padding: '4px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            {article.category.name}
          </span>
          <span style={{ color: '#a0a8b8', fontSize: 13 }}>
            {new Date(article.publishedDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <h3 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 24,
          fontWeight: 400,
          color: '#06072c',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {article.title}
        </h3>

        <p style={{
          fontSize: 15,
          color: '#4f5669',
          lineHeight: 1.6,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.excerpt}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#008B94',
          fontWeight: 700,
          fontSize: 15,
          marginTop: 4
        }}>
          Baca Selengkapnya
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;

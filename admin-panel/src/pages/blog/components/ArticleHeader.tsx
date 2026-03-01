import React from 'react';
import type { Article } from '../types';

interface Props {
  article: Article;
}

const ArticleHeader: React.FC<Props> = ({ article }) => {
  return (
    <header style={{
      textAlign: 'center',
      marginBottom: 48,
      maxWidth: 900,
      margin: '0 auto 48px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{
          background: '#edf3ff',
          color: '#008B94',
          padding: '4px 14px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {article.category.name}
        </span>
        <span style={{
          color: '#4f5669',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ width: 4, height: 4, background: '#cbd5e1', borderRadius: '50%' }} />
          {new Date(article.publishedDate).toLocaleDateString('id-ID', { month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <span style={{
          color: '#4f5669',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{ width: 4, height: 4, background: '#cbd5e1', borderRadius: '50%' }} />
          {article.readTime} min read
        </span>
      </div>

      <h1 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 'clamp(32px, 5vw, 56px)',
        fontWeight: 400,
        color: '#06072c',
        margin: '0 0 20px',
        lineHeight: 1.15
      }}>
        {article.title}
      </h1>

      {article.excerpt && (
        <p style={{
          fontSize: 'clamp(17px, 2vw, 20px)',
          color: '#4f5669',
          lineHeight: 1.6,
          maxWidth: 720,
          margin: '0 auto'
        }}>
          {article.excerpt}
        </p>
      )}

      {article.featuredImage && (
        <div style={{
          marginTop: 48,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(6,7,44,0.1)'
        }}>
          <img
            src={article.featuredImage}
            alt={article.title}
            style={{ width: '100%', display: 'block' }}
          />
        </div>
      )}
    </header>
  );
};

export default ArticleHeader;

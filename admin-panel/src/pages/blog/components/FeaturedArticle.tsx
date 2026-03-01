import React from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../types';

interface Props {
  article: Article;
}

const FeaturedArticle: React.FC<Props> = ({ article }) => {
  return (
    <Link to={`/blog/${article.slug}`} className="blog-featured">
      <div
        className="blog-featured__image"
        style={article.featuredImage ? { backgroundImage: `url(${article.featuredImage})` } : undefined}
      />
      <div className="blog-featured__content">
        <span className="blog-chip">{article.category.name}</span>
        <h2>{article.title}</h2>
        <p>{article.excerpt}</p>
        <div className="blog-meta">
          <span>{article.author.name}</span>
          <span>{new Date(article.publishedDate).toLocaleDateString('id-ID')}</span>
          <span>{article.readTime} min read</span>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedArticle;

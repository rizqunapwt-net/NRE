import React from 'react';
import type { Article } from '../types';
import ArticleCard from './ArticleCard';

interface Props {
  articles: Article[];
}

const RelatedArticles: React.FC<Props> = ({ articles }) => {
  if (articles.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 32
    }}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default RelatedArticles;

import React from 'react';
import type { PublicEbook } from '../types';

interface Props {
  title: string;
  books: PublicEbook[];
}

const FeaturedSection: React.FC<Props> = ({ title, books }) => {
  if (books.length === 0) return null;

  return (
    <section className="el-featured">
      <h4>{title}</h4>
      <div className="el-featured__row">
        {books.slice(0, 4).map((book) => (
          <article key={`${title}-${book.id}`} className="el-featured__item">
            <span>{book.title}</span>
            <small>{book.authorName}</small>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;

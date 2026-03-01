import React from 'react';
import type { PublicEbook } from '../types';

interface Props {
  ebook: PublicEbook;
  onPreview: (ebook: PublicEbook) => void;
  onAddToCart: (ebook: PublicEbook) => void;
}

const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

const EbookCardPublic: React.FC<Props> = ({ ebook, onPreview, onAddToCart }) => {
  return (
    <article className="el-card">
      <div className="el-card__book-wrapper">
        <div className="el-card__book-3d">
          <div className="el-card__book-front">
            {ebook.coverImage ? (
              <img src={ebook.coverImage} alt={ebook.title} className="el-card__book-img" />
            ) : (
              <div className="el-card__book-placeholder">📖</div>
            )}
          </div>
          <div className="el-card__book-spine"></div>
          <div className="el-card__book-pages"></div>
        </div>
      </div>
      <div className="el-card__body">
        <div className="el-card__rating">⭐ {ebook.rating.toFixed(1)} ({ebook.reviewCount} reviews)</div>
        <h4>{ebook.title}</h4>
        <p className="el-card__meta">by {ebook.authorName}</p>
        <p className="el-card__stats">{ebook.category} • {formatCurrency(ebook.discountPrice || ebook.price)}</p>
        <div className="el-card__actions">
          <button onClick={() => onPreview(ebook)}>Preview</button>
          <button onClick={() => onAddToCart(ebook)}>Add to Cart</button>
        </div>
      </div>
    </article>
  );
};

export default EbookCardPublic;

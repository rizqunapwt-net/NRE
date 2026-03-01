import React from 'react';
import EbookCard from './EbookCard';

interface Ebook {
  id: number;
  slug: string;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  publishedDate: string;
}

interface EbookGridProps {
  ebooks: Ebook[];
  onPreview?: (slug: string) => void;
  onAddToCart?: (slug: string) => void;
  isLoading?: boolean;
}

const EbookGrid: React.FC<EbookGridProps> = ({
  ebooks,
  onPreview,
  onAddToCart,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="ebook-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="ebook-card ebook-card--skeleton">
            <div className="ebook-card__image-container">
              <div className="skeleton skeleton--image" />
            </div>
            <div className="ebook-card__content">
              <div className="skeleton skeleton--rating" />
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--author" />
              <div className="skeleton skeleton--meta" />
              <div className="skeleton skeleton--buttons" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ebooks.length === 0) {
    return null;
  }

  return (
    <div className="ebook-grid">
      {ebooks.map((ebook) => (
        <EbookCard
          key={ebook.id}
          ebook={ebook}
          onPreview={onPreview}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

export default EbookGrid;

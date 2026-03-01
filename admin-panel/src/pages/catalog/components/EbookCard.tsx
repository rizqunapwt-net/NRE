import React from 'react';

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

interface EbookCardProps {
  ebook: Ebook;
  onPreview?: (slug: string) => void;
  onAddToCart?: (slug: string) => void;
}

const EbookCard: React.FC<EbookCardProps> = ({
  ebook,
  onPreview,
  onAddToCart
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.floor(rating) ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const hasDiscount = ebook.discountPrice && ebook.discountPrice < ebook.price;

  return (
    <div className="ebook-card">
      <div className="ebook-card__book-wrapper">
        <div className="ebook-card__book-3d">
          <div className="ebook-card__book-front">
            <img
              src={ebook.coverImage}
              alt={ebook.title}
              className="ebook-card__cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/placeholder-book.jpg';
              }}
            />
          </div>
          <div className="ebook-card__book-spine"></div>
          <div className="ebook-card__book-pages"></div>
        </div>
        {hasDiscount && (
          <span className="ebook-card__discount-badge">
            {Math.round((1 - ebook.discountPrice! / ebook.price) * 100)}% OFF
          </span>
        )}
      </div>

      <div className="ebook-card__content">
        <div className="ebook-card__rating">
          <div className="ebook-card__stars">
            {renderStars(ebook.rating)}
          </div>
          <span className="ebook-card__rating-count">
            ({ebook.reviewCount})
          </span>
        </div>

        <h3 className="ebook-card__title" title={ebook.title}>
          {ebook.title}
        </h3>

        <p className="ebook-card__author">
          oleh {ebook.author}
        </p>

        <div className="ebook-card__meta">
          <span className="ebook-card__category">{ebook.category}</span>
          <div className="ebook-card__price">
            {hasDiscount ? (
              <>
                <span className="ebook-card__price--discount">
                  {formatPrice(ebook.discountPrice!)}
                </span>
                <span className="ebook-card__price--original">
                  {formatPrice(ebook.price)}
                </span>
              </>
            ) : (
              <span className="ebook-card__price--regular">
                {formatPrice(ebook.price)}
              </span>
            )}
          </div>
        </div>

        <div className="ebook-card__actions">
          <button
            className="ebook-card__btn ebook-card__btn--preview"
            onClick={() => onPreview?.(ebook.slug)}
          >
            Preview
          </button>
          <button
            className="ebook-card__btn ebook-card__btn--cart"
            onClick={() => onAddToCart?.(ebook.slug)}
          >
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default EbookCard;

import React from 'react';
import CategoryFilters from './CategoryFilters';
import EbookCardPublic from './EbookCardPublic';
import FeaturedSection from './FeaturedSection';
import type { EbookFilters, PublicEbook } from '../types';

interface Props {
  loading: boolean;
  error: string;
  books: PublicEbook[];
  categories: string[];
  filters: EbookFilters;
  sortBy: string;
  onSearch: (value: string) => void;
  onFilterCategory: (value: string) => void;
  onSort: (value: string) => void;
  onPreview: (ebook: PublicEbook) => void;
  onAddToCart: (ebook: PublicEbook) => void;
  onLoadMore: () => void;
  canLoadMore: boolean;
}

const AllBooksTab: React.FC<Props> = ({
  loading,
  error,
  books,
  categories,
  filters,
  sortBy,
  onSearch,
  onFilterCategory,
  onSort,
  onPreview,
  onAddToCart,
  onLoadMore,
  canLoadMore,
}) => {
  return (
    <div>
      <div className="el-toolbar el-toolbar--search">
        <input
          className="el-input"
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search all e-books..."
        />
        <select className="el-select" value={sortBy} onChange={(e) => onSort(e.target.value)}>
          <option value="newest">Newest Releases</option>
          <option value="best-sellers">Best Sellers</option>
          <option value="top-rated">Top Rated</option>
          <option value="most-reviewed">Most Reviewed</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      <div className="el-all-layout">
        <CategoryFilters categories={categories} selected={filters.category} onSelect={onFilterCategory} variant="sidebar" />

        <div>
          <FeaturedSection title="New Releases" books={books} />
          <FeaturedSection title="Trending Now" books={[...books].sort((a, b) => b.reviewCount - a.reviewCount)} />
          <FeaturedSection title="Editor's Picks" books={[...books].sort((a, b) => b.rating - a.rating)} />

          {loading ? (
            <div className="el-grid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="el-skeleton" />)}</div>
          ) : error ? (
            <div className="el-empty">{error}</div>
          ) : books.length === 0 ? (
            <div className="el-empty">Tidak ada e-book sesuai filter saat ini.</div>
          ) : (
            <>
              <div className="el-grid">
                {books.map((ebook) => (
                  <EbookCardPublic key={ebook.id} ebook={ebook} onPreview={onPreview} onAddToCart={onAddToCart} />
                ))}
              </div>
              {canLoadMore && (
                <div className="el-load-more">
                  <button onClick={onLoadMore}>Load More</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllBooksTab;

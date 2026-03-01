import React from 'react';

interface Filters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface ActiveFiltersProps {
  filters: Filters;
  searchTerm?: string;
  onClearFilter: (key: keyof Filters | 'search') => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  searchTerm,
  onClearFilter,
  onClearAll
}) => {
  const hasActiveFilters = searchTerm || Object.keys(filters).length > 0;

  if (!hasActiveFilters) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderFilterTag = (label: string, value: string, filterKey: keyof Filters | 'search') => (
    <span key={filterKey} className="filter-tag">
      {label}: {value}
      <button onClick={() => onClearFilter(filterKey)} className="filter-tag__remove">
        ×
      </button>
    </span>
  );

  return (
    <div className="active-filters">
      <div className="active-filters__container">
        <div className="active-filters__tags">
          {searchTerm && renderFilterTag('Search', `"${searchTerm}"`, 'search')}
          
          {filters.category && renderFilterTag('Category', filters.category, 'category')}
          
          {filters.minPrice !== undefined && filters.maxPrice !== undefined && (
            renderFilterTag(
              'Price',
              `${formatPrice(filters.minPrice)} - ${formatPrice(filters.maxPrice)}`,
              'minPrice'
            )
          )}
          
          {filters.minPrice !== undefined && filters.maxPrice === undefined && (
            renderFilterTag(
              'Price',
              `> ${formatPrice(filters.minPrice)}`,
              'minPrice'
            )
          )}
          
          {filters.minRating && renderFilterTag('Rating', `${filters.minRating}★ & up`, 'minRating')}
        </div>
        
        <button onClick={onClearAll} className="active-filters__clear">
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ActiveFilters;

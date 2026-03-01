import React, { useState, useEffect } from 'react';

interface Filters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

interface SearchFilterBarProps {
  onSearch: (term: string) => void;
  onFilter: (filters: Filters) => void;
  onSort: (sort: string) => void;
  categories?: string[];
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  onSearch,
  onFilter,
  onSort,
  categories = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('');
  const [minRating, setMinRating] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Handle filter changes
  useEffect(() => {
    const filters: Filters = {};
    
    if (selectedCategory) filters.category = selectedCategory;
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filters.minPrice = min;
      filters.maxPrice = max === 999999 ? undefined : max;
    }
    if (minRating) filters.minRating = Number(minRating);
    
    onFilter(filters);
  }, [selectedCategory, priceRange, minRating, onFilter]);

  // Handle sort change
  useEffect(() => {
    onSort(sortBy);
  }, [sortBy, onSort]);

  const defaultCategories = [
    'Fiction',
    'Non-Fiction',
    'Business',
    'Technology',
    'Science',
    'History',
    'Biography',
    'Self-Help',
    'Education'
  ];

  const allCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="search-filter-bar">
      <div className="search-filter-bar__container">
        {/* Search Box */}
        <div className="search-filter-bar__search">
          <input
            type="text"
            placeholder="Cari judul, penulis, atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-filter-bar__input"
          />
          <span className="search-filter-bar__search-icon">🔍</span>
        </div>

        {/* Filters */}
        <div className="search-filter-bar__filters">
          {/* Category Dropdown */}
          <div className="search-filter-bar__filter">
            <label>Kategori</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="search-filter-bar__select"
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="search-filter-bar__filter">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="search-filter-bar__select"
            >
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="bestselling">Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="search-filter-bar__filter">
            <label>Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="search-filter-bar__select"
            >
              <option value="">All Prices</option>
              <option value="0-0">Free</option>
              <option value="0-50000">&lt; 50k</option>
              <option value="50000-100000">50k - 100k</option>
              <option value="100000-999999">&gt; 100k</option>
            </select>
          </div>

          {/* Rating */}
          <div className="search-filter-bar__filter">
            <label>Rating</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="search-filter-bar__select"
            >
              <option value="">All Ratings</option>
              <option value="4">★★★★☆ & up</option>
              <option value="3">★★★☆☆ & up</option>
              <option value="2">★★☆☆☆ & up</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;

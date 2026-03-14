import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const debounce = (fn: (...args: any[]) => void, ms: number) => {
  let timeoutId: any;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export interface SearchFilters {
  search: string;
  categories: string[];
  min_price: number | null;
  max_price: number | null;
  year: number | null;
  author_id: number | null;
  is_digital: boolean | null;
  min_rating: number | null;
  sort: string;
  page: number;
}

export const useSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const initialFilters: SearchFilters = {
    search: searchParams.get('search') || '',
    categories: searchParams.getAll('categories'),
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : null,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : null,
    year: searchParams.get('year') ? Number(searchParams.get('year')) : null,
    author_id: searchParams.get('author_id') ? Number(searchParams.get('author_id')) : null,
    is_digital: searchParams.get('is_digital') === 'true' ? true : searchParams.get('is_digital') === 'false' ? false : null,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : null,
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  };

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // Sync state to URL with debounce for text input
  const updateUrlParams = useCallback(
    debounce((newFilters: SearchFilters) => {
      const params: any = {};
      
      if (newFilters.search) params.search = newFilters.search;
      if (newFilters.categories.length) params.categories = newFilters.categories;
      if (newFilters.min_price !== null) params.min_price = newFilters.min_price.toString();
      if (newFilters.max_price !== null) params.max_price = newFilters.max_price.toString();
      if (newFilters.year !== null) params.year = newFilters.year.toString();
      if (newFilters.author_id !== null) params.author_id = newFilters.author_id.toString();
      if (newFilters.is_digital !== null) params.is_digital = newFilters.is_digital.toString();
      if (newFilters.min_rating !== null) params.min_rating = newFilters.min_rating.toString();
      if (newFilters.sort !== 'newest') params.sort = newFilters.sort;
      if (newFilters.page > 1) params.page = newFilters.page.toString();

      setSearchParams(params);
    }, 300),
    [setSearchParams]
  );

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: key === 'page' ? value : 1 };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const resetFilters = () => {
    const reset = {
      search: '',
      categories: [],
      min_price: null,
      max_price: null,
      year: null,
      author_id: null,
      is_digital: null,
      min_rating: null,
      sort: 'newest',
      page: 1,
    };
    setFilters(reset);
    setSearchParams({});
  };

  return {
    filters,
    handleFilterChange,
    resetFilters,
  };
};

import React, { useState, useEffect } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { BookOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useSEO } from '../../hooks/useSEO';
import { useSearch } from './SearchHooks';
import SearchBar from './components/SearchBar';
import SearchFilters from './components/SearchFilters';
import SearchResults from './components/SearchResults';
import './EbookCatalogPage.css';

const { Content, Sider } = Layout;

const EbookCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { filters, handleFilterChange, resetFilters } = useSearch();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'pagination' | 'infinite'>('pagination');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Set SEO metadata
  useSEO({
    title: 'Katalog Buku',
    description: 'Jelajahi koleksi buku berkualitas dari Penerbit Rizquna Elfath. Temukan buku dalam berbagai kategori dengan harga terjangkau.',
    url: window.location.href
  });

  useEffect(() => {
    fetchBooks(filters.page > 1 && viewMode === 'infinite');
  }, [JSON.stringify(filters)]);

  const fetchBooks = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      filters.categories.forEach(cat => params.append('categories[]', cat));
      if (filters.min_price !== null) params.append('min_price', filters.min_price.toString());
      if (filters.max_price !== null) params.append('max_price', filters.max_price.toString());
      if (filters.year !== null) params.append('year', filters.year.toString());
      if (filters.author_id !== null) params.append('author_id', filters.author_id.toString());
      if (filters.is_digital !== null) params.append('is_digital', filters.is_digital.toString());
      if (filters.min_rating !== null) params.append('min_rating', filters.min_rating.toString());
      params.append('sort', filters.sort);
      params.append('page', filters.page.toString());
      params.append('per_page', '12');

      const response = await api.get(`public/catalog?${params.toString()}`);
      const data = response.data;
      
      if (isLoadMore) {
        setBooks(prev => [...prev, ...(data.data || [])]);
      } else {
        setBooks(data.data || []);
      }
      setTotal(data.total || 0);
      setSuggestion(data.suggestion || null);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (slug: string) => {
    navigate(`/buku/${slug}`);
  };

  return (
    <div className="catalog-page">
      <div className="catalog-header" style={{ marginBottom: 32 }}>
        <div className="catalog-title-wrapper">
          <BookOutlined className="catalog-icon" />
          <h1 className="catalog-title">Katalog Buku</h1>
        </div>
        <p className="catalog-subtitle">
          Temukan buku-buku berkualitas dari penerbit Rizquna Elfath
        </p>
        
        <div style={{ maxWidth: 800, margin: '24px auto 0' }}>
          <SearchBar 
            value={filters.search} 
            onChange={(val) => handleFilterChange('search', val)}
            onSearch={fetchBooks}
            suggestion={suggestion}
          />
        </div>
      </div>

      <Layout style={{ background: 'transparent' }}>
        {/* Desktop Sidebar */}
        <Sider 
          width={300} 
          breakpoint="lg" 
          collapsedWidth="0" 
          trigger={null}
          style={{ background: 'transparent', marginRight: 24 }}
          className="catalog-sider"
        >
          <SearchFilters 
            filters={filters} 
            onChange={handleFilterChange} 
            onReset={resetFilters} 
          />
        </Sider>

        <Content>
          {/* Mobile Filter Button */}
          <div className="mobile-only" style={{ marginBottom: 16 }}>
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setIsMobileFilterOpen(true)}
              block
            >
              Filter Lanjutan
            </Button>
          </div>

          <SearchResults 
            loading={loading}
            books={books}
            total={total}
            filters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onChange={handleFilterChange}
            onBookClick={handleBookClick}
          />
        </Content>
      </Layout>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Filter Lanjutan"
        placement="right"
        onClose={() => setIsMobileFilterOpen(false)}
        open={isMobileFilterOpen}
        width={320}
      >
        <SearchFilters 
          filters={filters} 
          onChange={handleFilterChange} 
          onReset={resetFilters} 
        />
      </Drawer>
    </div>
  );
};

export default EbookCatalogPage;

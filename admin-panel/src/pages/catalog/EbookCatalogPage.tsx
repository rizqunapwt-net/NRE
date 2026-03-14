import React, { useState, useEffect } from 'react';
import { Input, Select, Pagination, Spin, Empty } from 'antd';
import { BookOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useSEO } from '../../hooks/useSEO';
import { CatalogSkeleton } from '../../components/SkeletonLoaders';
import './EbookCatalogPage.css';

const { Search } = Input;
const { Option } = Select;

const EbookCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);

  // Set SEO metadata
  useSEO({
    title: 'Katalog Buku',
    description: 'Jelajahi koleksi buku berkualitas dari Penerbit Rizquna Elfath. Temukan buku dalam berbagai kategori dengan harga terjangkau.',
    url: window.location.href
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('public/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [currentPage, category, searchTerm]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12',
        ...(category !== 'all' && { category: category }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await api.get(`public/catalog?${params}`);
      const data = response.data;
      
      setBooks(data.data || []);
      setTotal(data.total || 0);
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
      <div className="catalog-header">
        <div className="catalog-title-wrapper">
          <BookOutlined className="catalog-icon" />
          <h1 className="catalog-title">Katalog Buku</h1>
        </div>
        <p className="catalog-subtitle">
          Temukan buku-buku berkualitas dari penerbit Rizquna Elfath
        </p>
      </div>

      {/* Filters */}
      <div className="catalog-filters">
        <Search
          placeholder="Cari judul, penulis, atau ISBN..."
          allowClear
          enterButton
          size="large"
          className="catalog-search"
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={fetchBooks}
        />
        
        <Select
          placeholder="Semua Kategori"
          className="catalog-filter-select"
          defaultValue="all"
          onChange={(value) => {
            setCategory(value);
            setCurrentPage(1);
          }}
        >
          <Option value="all">Semua Kategori</Option>
          {categories.map((c: any) => (
            <Option key={c.id} value={c.slug}>{c.name}</Option>
          ))}
        </Select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <CatalogSkeleton />
      ) : books.length === 0 ? (
        <div className="catalog-empty">
          <Empty description="Tidak ada buku ditemukan" />
        </div>
      ) : (
        <>
          <div className="catalog-grid">
            {books.map((book) => (
              <div 
                key={book.id} 
                className="book-card"
                onClick={() => handleBookClick(book.slug)}
              >
                <div className="book-cover-wrapper">
                  {book.cover_url ? (
                    <img alt={book.title} src={book.cover_url} className="book-cover" />
                  ) : (
                    <div className="book-cover-placeholder">
                      <BookOutlined />
                    </div>
                  )}
                  {book.is_bestseller && (
                    <div className="bestseller-badge">Bestseller</div>
                  )}
                </div>
                
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author?.nama || book.author?.name || 'Penulis Tidak Diketahui'}</p>
                  
                  <div className="book-rating">
                    {[...Array(5)].map((_, i) => {
                      const rating = book.rating || 4;
                      return <StarFilled key={i} className={i < Math.round(rating) ? 'star-filled' : 'star-empty'} />;
                    })}
                    <span className="rating-text">({(book.rating || 4.0).toFixed(1)})</span>
                  </div>
                  
                  <div className="book-price">
                    <span className="price-main">
                      {Number(book.price) > 0 ? `Rp ${Number(book.price).toLocaleString('id-ID')}` : 'Hubungi Kami'}
                    </span>
                    {book.original_price && Number(book.original_price) > Number(book.price) && (
                      <span className="price-original">
                        Rp {Number(book.original_price).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="catalog-pagination">
            <Pagination
              current={currentPage}
              total={total}
              pageSize={12}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showTotal={(total) => `Total ${total} buku`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EbookCatalogPage;

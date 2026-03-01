import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, Pagination, Spin, Empty, Tag } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
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

  useEffect(() => {
    fetchBooks();
  }, [currentPage, category, searchTerm]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12',
        ...(category !== 'all' && { category_id: category }),
        ...(searchTerm && { q: searchTerm }),
      });

      const response = await api.get(`/api/v1/public/repository?${params}`);
      const data = response.data.data;
      
      setBooks(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (slug: string) => {
    navigate(`/katalog/${slug}`);
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
          size="large"
          className="catalog-filter-select"
          value={category}
          onChange={setCategory}
        >
          <Option value="all">Semua Kategori</Option>
          <Option value="1">Edukasi</Option>
          <Option value="2">Fiksi</Option>
          <Option value="3">Sains</Option>
          <Option value="4">Bisnis</Option>
          <Option value="5">Teknologi</Option>
        </Select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="catalog-loading">
          <Spin size="large" tip="Memuat katalog..." />
        </div>
      ) : books.length === 0 ? (
        <div className="catalog-empty">
          <Empty description="Tidak ada buku ditemukan" />
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]} className="catalog-grid">
            {books.map((book) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={book.id}>
                <Card
                  hoverable
                  className="book-card"
                  onClick={() => handleBookClick(book.slug)}
                  cover={
                    <div className="book-cover-wrapper">
                      {book.cover_url ? (
                        <img alt={book.title} src={book.cover_url} className="book-cover" />
                      ) : (
                        <div className="book-cover-placeholder">
                          <BookOutlined size={48} />
                        </div>
                      )}
                      {book.is_bestseller && (
                        <Tag color="red" className="bestseller-tag">Bestseller</Tag>
                      )}
                    </div>
                  }
                >
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    {book.subtitle && <p className="book-subtitle">{book.subtitle}</p>}
                    <p className="book-author">
                      <span className="author-label">Penulis:</span> {book.author?.name || 'Anonim'}
                    </p>
                    <div className="book-meta">
                      <span className="book-year">{book.year || 'N/A'}</span>
                      {book.isbn && (
                        <>
                          <span className="book-divider">•</span>
                          <span className="book-isbn">ISBN: {book.isbn}</span>
                        </>
                      )}
                    </div>
                    {book.category && (
                      <Tag color="blue" className="book-category">{book.category.name}</Tag>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

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

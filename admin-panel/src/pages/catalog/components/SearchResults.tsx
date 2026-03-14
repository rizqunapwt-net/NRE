import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, Pagination, Select, Space, Typography, Tag, Button, Modal, Input, message, Segmented } from 'antd';
import { StarFilled, BookOutlined, HeartOutlined, HeartFilled, UnorderedListOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useInView } from 'react-intersection-observer';
import { CatalogSkeleton } from '../../../components/SkeletonLoaders';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api';

import type { SearchFilters } from '../SearchHooks';

const { Text, Title } = Typography;
const { Option } = Select;

interface SearchResultsProps {
  loading: boolean;
  books: any[];
  total: number;
  filters: SearchFilters;
  viewMode: 'pagination' | 'infinite';
  onViewModeChange: (mode: 'pagination' | 'infinite') => void;
  onChange: (key: keyof SearchFilters, value: any) => void;
  onBookClick: (slug: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  loading, 
  books, 
  total, 
  filters, 
  viewMode,
  onViewModeChange,
  onChange, 
  onBookClick 
}) => {
  const { user } = useAuth();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // Load more when in view for infinite scroll
  useEffect(() => {
    if (inView && viewMode === 'infinite' && books.length < total && !loading) {
      onChange('page', filters.page + 1);
    }
  }, [inView, viewMode, books.length, total, loading]);

  const handleSaveSearch = async () => {
    if (!searchName) {
      message.warning('Harap beri nama untuk pencarian ini');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/user/saved-searches', {
        name: searchName,
        filters: filters,
      });
      message.success('Pencarian berhasil disimpan ke favorit');
      setIsSaveModalOpen(false);
      setSearchName('');
    } catch (error) {
      message.error('Gagal menyimpan pencarian');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <CatalogSkeleton />;

  return (
    <div className="search-results-container">
      {/* Meta Info & Sorting */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {total > 0 ? `${total} Buku ditemukan` : 'Hasil Pencarian'}
          </Title>
          {filters.search && (
            <Text type="secondary">Hasil untuk: "{filters.search}"</Text>
          )}
        </div>
        
        <Space>
          {user && (
            <Button 
              icon={<HeartOutlined />} 
              onClick={() => setIsSaveModalOpen(true)}
            >
              Simpan Pencarian
            </Button>
          )}
          
          <Segmented
            options={[
              { label: 'Halaman', value: 'pagination', icon: <UnorderedListOutlined /> },
              { label: 'Scroll', value: 'infinite', icon: <AppstoreOutlined /> },
            ]}
            value={viewMode}
            onChange={(value) => onViewModeChange(value as 'pagination' | 'infinite')}
          />

          <Text>Urutkan:</Text>
          <Select 
            value={filters.sort} 
            onChange={(val) => onChange('sort', val)}
            style={{ width: 180 }}
          >
            <Option value="newest">Terbaru</Option>
            <Option value="popular">Terpopuler</Option>
            <Option value="bestseller">Bestseller</Option>
            <Option value="price_low">Harga: Terendah</Option>
            <Option value="price_high">Harga: Tertinggi</Option>
            <Option value="rating">Rating Tertinggi</Option>
          </Select>
        </Space>
      </div>

      {/* Filter Chips / Breadcrumbs */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          {filters.categories.map((cat: string) => (
            <Tag 
              key={cat} 
              closable 
              onClose={() => onChange('categories', filters.categories.filter((c: string) => c !== cat))}
            >
              Kategori: {cat}
            </Tag>
          ))}
          {filters.year && (
            <Tag closable onClose={() => onChange('year', null)}>Tahun: {filters.year}</Tag>
          )}
          {filters.min_rating && (
            <Tag closable onClose={() => onChange('min_rating', null)}>Rating: {filters.min_rating}+</Tag>
          )}
          {filters.is_digital !== null && (
            <Tag closable onClose={() => onChange('is_digital', null)}>
              Format: {filters.is_digital ? 'Digital' : 'Cetak'}
            </Tag>
          )}
        </Space>
      </div>

      {books.length === 0 ? (
        <Empty description="Tidak ada buku yang sesuai dengan kriteria Anda" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {books.map((book) => (
              <Col xs={24} sm={12} md={8} lg={6} key={book.id}>
                <div 
                  className="book-card"
                  onClick={() => onBookClick(book.slug)}
                  style={{ cursor: 'pointer' }}
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
                      <span className="rating-text">({(Number(book.rating) || 4.0).toFixed(1)})</span>
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
              </Col>
            ))}
          </Row>

          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
            {viewMode === 'pagination' ? (
              <Pagination
                current={filters.page}
                total={total}
                pageSize={12}
                onChange={(page) => onChange('page', page)}
                showSizeChanger={false}
                showTotal={(total) => `Total ${total} buku`}
              />
            ) : (
              <div ref={ref} style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
                {books.length < total ? (
                  <CatalogSkeleton />
                ) : (
                  <Text type="secondary">Semua buku telah dimuat.</Text>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        title="Simpan Pencarian ke Favorit"
        open={isSaveModalOpen}
        onOk={handleSaveSearch}
        onCancel={() => setIsSaveModalOpen(false)}
        confirmLoading={isSaving}
        okText="Simpan"
        cancelText="Batal"
      >
        <p>Beri nama untuk filter pencarian ini agar Anda dapat mengaksesnya kembali dengan mudah.</p>
        <Input 
          placeholder="Contoh: Buku Digital 2024" 
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onPressEnter={handleSaveSearch}
        />
      </Modal>
    </div>
  );
};

export default SearchResults;

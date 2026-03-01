import React from 'react';
import CategoryFilters from './CategoryFilters';
import EbookCardMyBooks from './EbookCardMyBooks';
import StatsBar from './StatsBar';
import type { EbookFilters, LibraryStats, MyEbook } from '../types';

interface Props {
  loading: boolean;
  error: string;
  books: MyEbook[];
  stats: LibraryStats;
  filters: EbookFilters;
  categories: string[];
  sortBy: string;
  onFilterCategory: (value: string) => void;
  onSort: (value: string) => void;
  onViewDetail: (ebook: MyEbook) => void;
  onEdit: (ebook: MyEbook) => void;
  onPromote: (ebook: MyEbook) => void;
  onReport: (ebook: MyEbook) => void;
  onDownload: (ebook: MyEbook) => void;
  onRead: (ebook: MyEbook) => void;
  onShortPdf: (ebook: MyEbook) => void;
}

const MyBooksTab: React.FC<Props> = ({
  loading,
  error,
  books,
  stats,
  filters,
  categories,
  sortBy,
  onFilterCategory,
  onSort,
  onViewDetail,
  onEdit,
  onPromote,
  onReport,
  onDownload,
  onRead,
  onShortPdf,
}) => {
  return (
    <div>
      <StatsBar stats={stats} />

      <div className="el-toolbar">
        <CategoryFilters categories={categories} selected={filters.category} onSelect={onFilterCategory} />
        <select className="el-select" value={sortBy} onChange={(e) => onSort(e.target.value)}>
          <option value="latest">Latest</option>
          <option value="best-selling">Best Selling</option>
          <option value="highest-rated">Highest Rated</option>
          <option value="title-az">Title A-Z</option>
        </select>
      </div>

      {loading ? (
        <div className="el-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="el-skeleton" />)}</div>
      ) : error ? (
        <div className="el-empty">{error}</div>
      ) : books.length === 0 ? (
        <div className="el-empty">Belum ada e-book terbit. Kirim naskah dan publikasikan buku pertama Anda.</div>
      ) : (
        <div className="el-grid">
          {books.map((ebook) => (
            <EbookCardMyBooks
              key={ebook.id}
              ebook={ebook}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onPromote={onPromote}
              onReport={onReport}
              onDownload={onDownload}
              onRead={onRead}
              onShortPdf={onShortPdf}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBooksTab;

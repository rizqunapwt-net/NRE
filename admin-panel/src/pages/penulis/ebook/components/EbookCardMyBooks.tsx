import React from 'react';
import type { MyEbook } from '../types';

interface Props {
  ebook: MyEbook;
  onViewDetail: (ebook: MyEbook) => void;
  onEdit: (ebook: MyEbook) => void;
  onPromote: (ebook: MyEbook) => void;
  onReport: (ebook: MyEbook) => void;
  onDownload: (ebook: MyEbook) => void;
  onRead: (ebook: MyEbook) => void;
  onShortPdf: (ebook: MyEbook) => void;
}

const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

const EbookCardMyBooks: React.FC<Props> = ({ ebook, onViewDetail, onEdit, onPromote, onReport, onDownload, onRead, onShortPdf }) => {
  return (
    <article className="el-card">
      <div className="el-card__cover" style={ebook.coverImage ? { backgroundImage: `url(${ebook.coverImage})` } : undefined} />
      <div className="el-card__body">
        <div className="el-card__rating">⭐ {ebook.rating.toFixed(1)} ({ebook.reviewCount})</div>
        <h4>{ebook.title}</h4>
        <p className="el-card__meta">Published: {new Date(ebook.publishedDate).toLocaleDateString('id-ID')}</p>
        <p className="el-card__stats">📊 {ebook.salesCount.toLocaleString('id-ID')} sales • {formatCurrency(ebook.totalRevenue)}</p>
        <p className="el-card__meta">{ebook.shortPdfUrl ? 'PDF singkat tersedia' : 'PDF singkat belum diupload'}</p>
        <div className="el-card__actions">
          <button onClick={() => onViewDetail(ebook)}>View Details</button>
          <button onClick={() => onEdit(ebook)}>Edit</button>
          <button onClick={() => onPromote(ebook)}>Promote</button>
          <button onClick={() => onReport(ebook)}>Sales Report</button>
          <button onClick={() => onShortPdf(ebook)}>{ebook.shortPdfUrl ? 'Lihat PDF Singkat' : 'Upload PDF Singkat'}</button>
          <button onClick={() => onRead(ebook)}>Baca PDF</button>
          <button onClick={() => onDownload(ebook)}>Download</button>
        </div>
      </div>
    </article>
  );
};

export default EbookCardMyBooks;

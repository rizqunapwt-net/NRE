import React from 'react';
import type { LibraryTab } from '../types';

interface Props {
  active: LibraryTab;
  myBooksCount: number;
  onChange: (tab: LibraryTab) => void;
}

const LibraryTabs: React.FC<Props> = ({ active, myBooksCount, onChange }) => {
  return (
    <div className="el-tabs">
      <button
        className={`el-tabs__btn ${active === 'my-books' ? 'is-active' : ''}`}
        onClick={() => onChange('my-books')}
      >
        📚 My Books ({myBooksCount})
      </button>
      <button
        className={`el-tabs__btn ${active === 'all-books' ? 'is-active' : ''}`}
        onClick={() => onChange('all-books')}
      >
        🌐 All Books
      </button>
    </div>
  );
};

export default LibraryTabs;

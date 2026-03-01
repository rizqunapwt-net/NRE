import React from 'react';

interface Props {
  categories: string[];
  selected: string;
  onSelect: (value: string) => void;
  variant?: 'inline' | 'sidebar';
}

const CategoryFilters: React.FC<Props> = ({ categories, selected, onSelect, variant = 'inline' }) => {
  if (variant === 'sidebar') {
    return (
      <aside className="el-sidebar">
        <h4>Categories</h4>
        <button className={selected === 'all' ? 'is-active' : ''} onClick={() => onSelect('all')}>All Categories</button>
        {categories.map((category) => (
          <button key={category} className={selected === category ? 'is-active' : ''} onClick={() => onSelect(category)}>
            {category}
          </button>
        ))}
      </aside>
    );
  }

  return (
    <select className="el-select" value={selected} onChange={(e) => onSelect(e.target.value)}>
      <option value="all">Semua Kategori</option>
      {categories.map((category) => (
        <option key={category} value={category}>{category}</option>
      ))}
    </select>
  );
};

export default CategoryFilters;

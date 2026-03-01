import React from 'react';

type Category = {
  id: string;
  label: string;
};

interface Props {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}

const CategoryTabs: React.FC<Props> = ({ categories, selected, onSelect }) => {
  return (
    <div className="blog-tabs">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`blog-tabs__item ${selected === category.id ? 'blog-tabs__item--active' : ''}`}
          onClick={() => onSelect(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;

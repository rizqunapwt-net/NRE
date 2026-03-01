import React from 'react';

interface EmptyStateProps {
  onResetFilters: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onResetFilters }) => {
  return (
    <div className="empty-state">
      <div className="empty-state__container">
        <div className="empty-state__illustration">
          <svg
            viewBox="0 0 200 200"
            width="200"
            height="200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="80" fill="#f3f4f6" />
            <rect x="60" y="50" width="80" height="100" rx="4" fill="#d1d5db" />
            <circle cx="100" cy="90" r="20" fill="#9ca3af" />
            <line x1="70" y1="120" x2="130" y2="120" stroke="#9ca3af" strokeWidth="4" />
            <line x1="70" y1="135" x2="130" y2="135" stroke="#9ca3af" strokeWidth="4" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="#ef4444" strokeWidth="4" />
            <line x1="85" y1="85" x2="115" y2="115" stroke="#ef4444" strokeWidth="4" />
          </svg>
        </div>

        <h3 className="empty-state__title">E-book tidak ditemukan</h3>
        <p className="empty-state__message">
          Coba kata kunci lain atau reset filter Anda
        </p>

        <button onClick={onResetFilters} className="empty-state__btn">
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default EmptyState;

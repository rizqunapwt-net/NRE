import React from 'react';

/**
 * Skeleton loader untuk book card
 */
export const BookCardSkeleton: React.FC = () => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }}>
      {/* Cover image skeleton */}
      <div style={{
        width: '100%',
        aspectRatio: '3/4',
        background: '#f0f0f0'
      }} />
      
      {/* Content skeleton */}
      <div style={{ padding: '16px' }}>
        {/* Title skeleton */}
        <div style={{
          height: '16px',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '12px'
        }} />
        
        {/* Author skeleton */}
        <div style={{
          height: '12px',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '12px',
          width: '70%'
        }} />
        
        {/* Price skeleton */}
        <div style={{
          height: '14px',
          background: '#e0e0e0',
          borderRadius: '4px',
          width: '50%'
        }} />
      </div>
    </div>
  );
};

/**
 * Skeleton loader untuk detail page
 */
export const DetailPageSkeleton: React.FC = () => {
  return (
    <div style={{
      maxWidth: 1140,
      margin: '0 auto',
      padding: '40px 20px',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 520px) 1fr',
      gap: 60,
      alignItems: 'start'
    }}>
      {/* Cover skeleton */}
      <div style={{
        background: '#F8FAFC',
        padding: '40px',
        minHeight: 520,
        borderRadius: 24,
        border: '1px solid #E2E8F0',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }} />
      
      {/* Content skeleton */}
      <div>
        {/* Title skeleton */}
        <div style={{
          height: '32px',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '20px',
          width: '80%'
        }} />
        
        {/* Author skeleton */}
        <div style={{
          height: '16px',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '20px',
          width: '40%'
        }} />
        
        {/* Stats skeleton */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: '20px',
              background: '#e0e0e0',
              borderRadius: '4px',
              width: '100px'
            }} />
          ))}
        </div>
        
        {/* Description skeletons */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            height: '16px',
            background: '#e0e0e0',
            borderRadius: '4px',
            marginBottom: '12px',
            width: i === 4 ? '60%' : '100%'
          }} />
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader untuk katalog page
 */
export const CatalogSkeleton: React.FC = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '20px',
      padding: '20px'
    }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Add CSS animation untuk skeleton
 */
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
if (!document.head.querySelector('style[data-skeleton]')) {
  style.setAttribute('data-skeleton', 'true');
  document.head.appendChild(style);
}

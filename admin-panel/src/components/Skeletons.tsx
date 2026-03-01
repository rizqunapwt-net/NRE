import React from 'react';
import { Skeleton } from 'antd';

interface DashboardSkeletonProps {
  showMetrics?: boolean;
  showChart?: boolean;
  showWorkflow?: boolean;
}

/**
 * Skeleton loader for Dashboard page
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  showMetrics = true,
  showChart = true,
  showWorkflow = true,
}) => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Hero Section */}
      <Skeleton
        active
        paragraph={{ rows: 2 }}
        style={{ marginBottom: 24 }}
      />

      {/* Workflow Cards */}
      {showWorkflow && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 2 }} />
          ))}
        </div>
      )}

      {/* Metrics Section */}
      {showMetrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 3 }} />
          ))}
        </div>
      )}

      {/* Chart Section */}
      {showChart && (
        <Skeleton
          active
          paragraph={{ rows: 6 }}
          style={{ height: 300 }}
        />
      )}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

/**
 * Skeleton loader for table components
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 10,
  showHeader = true,
}) => {
  return (
    <div style={{ padding: 16 }}>
      {showHeader && (
        <Skeleton
          active
          paragraph={{ rows: 1 }}
          style={{ marginBottom: 16 }}
        />
      )}
      <Skeleton
        active
        paragraph={{ rows }}
        title={false}
      />
    </div>
  );
};

interface CardSkeletonProps {
  count?: number;
  avatar?: boolean;
  paragraphRows?: number;
}

/**
 * Skeleton loader for card grids
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 6,
  avatar = false,
  paragraphRows = 3,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          active
          avatar={avatar}
          paragraph={{ rows: paragraphRows }}
        />
      ))}
    </div>
  );
};

interface FormSkeletonProps {
  fields?: number;
  showActions?: boolean;
}

/**
 * Skeleton loader for form pages
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 5,
  showActions = true,
}) => {
  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: 24 }} />
      
      {Array.from({ length: fields }).map((_, i) => (
        <Skeleton
          key={i}
          active
          paragraph={{ rows: 1 }}
          style={{ marginBottom: 16 }}
        />
      ))}

      {showActions && (
        <Skeleton
          active
          paragraph={{ rows: 1 }}
          style={{ marginTop: 24 }}
        />
      )}
    </div>
  );
};

interface PageSkeletonProps {
  title?: boolean;
  actions?: boolean;
  children?: React.ReactNode;
}

/**
 * Generic page skeleton with optional title and actions
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  title = true,
  actions = true,
  children,
}) => {
  return (
    <div style={{ padding: 24 }}>
      {/* Page Header */}
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          {title && (
            <Skeleton
              active
              paragraph={{ rows: 1 }}
              style={{ flex: 1 }}
            />
          )}
          {actions && (
            <Skeleton
              active
              paragraph={{ rows: 1 }}
              style={{ width: 200, marginLeft: 16 }}
            />
          )}
        </div>
      )}

      {/* Content */}
      {children || <Skeleton active paragraph={{ rows: 10 }} />}
    </div>
  );
};

/**
 * Shimmer loading effect component
 */
export const Shimmer: React.FC<{ width?: string | number; height?: string | number; borderRadius?: number }> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
};

// Add shimmer animation to document
if (typeof document !== 'undefined') {
  const styleId = 'shimmer-animation';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default {
  DashboardSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  PageSkeleton,
  Shimmer,
};

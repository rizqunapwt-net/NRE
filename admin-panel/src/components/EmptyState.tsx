import React from 'react';
import { Empty, Button } from 'antd';
import { PlusOutlined, InboxOutlined, FileTextOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  /** Type of empty state */
  type?: 'data' | 'search' | 'error' | 'success' | 'custom';
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom image/icon */
  image?: React.ReactNode;
  /** Additional content below */
  children?: React.ReactNode;
}

/**
 * Empty State Component - Consistent empty states across the app
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'data',
  title,
  description,
  action,
  secondaryAction,
  image,
  children,
}) => {
  // Default content based on type
  const defaults = {
    data: {
      title: 'Belum Ada Data',
      description: 'Mulai dengan menambahkan data baru',
      icon: <InboxOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
    },
    search: {
      title: 'Tidak Ditemukan',
      description: 'Coba kata kunci lain atau hapus filter',
      icon: <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />,
    },
    error: {
      title: 'Terjadi Kesalahan',
      description: 'Silakan coba lagi nanti',
      icon: undefined, // Use Ant Design default error image
    },
    success: {
      title: 'Berhasil!',
      description: 'Data telah disimpan',
      icon: undefined,
    },
    custom: {
      title: '',
      description: '',
      icon: undefined,
    },
  };

  const currentDefaults = defaults[type];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        minHeight: 400,
      }}
    >
      {/* Image/Icon */}
      {image || (
        <div style={{ marginBottom: 24 }}>
          {currentDefaults.icon || <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </div>
      )}

      {/* Title */}
      {(title || currentDefaults.title) && (
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: 20,
            fontWeight: 600,
            color: '#1A1A1A',
          }}
        >
          {title || currentDefaults.title}
        </h3>
      )}

      {/* Description */}
      {(description || currentDefaults.description) && (
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: 14,
            color: '#666666',
            maxWidth: 400,
          }}
        >
          {description || currentDefaults.description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {action && (
            <Button
              type="primary"
              icon={action.icon || <PlusOutlined />}
              onClick={action.onClick}
              size="large"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} size="large">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Additional Content */}
      {children}
    </div>
  );
};

/**
 * Quick Empty State Variants
 */

export const EmptyData: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="data" {...props} />
);

export const EmptySearch: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="search" {...props} />
);

export const EmptyError: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="error" {...props} />
);

export const EmptySuccess: React.FC<Omit<EmptyStateProps, 'type'>> = (props) => (
  <EmptyState type="success" {...props} />
);

export default EmptyState;

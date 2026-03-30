import React, { useEffect, useState } from 'react';
import { Card, Timeline, Typography, Tag, Spin, Empty } from 'antd';
import {
  BookOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import api from '../../api';
import './ActivityTimeline.css';

const { Text } = Typography;

interface Activity {
  id: number;
  type: 'book' | 'author' | 'payment' | 'system';
  action: string;
  description: string;
  created_at: string;
  metadata?: any;
}

const ActivityTimeline: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      // Using existing endpoint - will be enhanced on backend
      const response = await api.get('/admin/activities?limit=10');
      setActivities(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      // Fallback to empty state
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookOutlined style={{ fontSize: '16px' }} />;
      case 'author':
        return <UserOutlined style={{ fontSize: '16px' }} />;
      case 'payment':
        return <DollarOutlined style={{ fontSize: '16px' }} />;
      default:
        return <ClockCircleOutlined style={{ fontSize: '16px' }} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'book':
        return '#008B94';
      case 'author':
        return '#8B5CF6';
      case 'payment':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <Card title="📋 Aktivitas Terbaru" className="activity-timeline-card">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card title="📋 Aktivitas Terbaru" className="activity-timeline-card">
        <Empty description="Belum ada aktivitas" />
      </Card>
    );
  }

  return (
    <Card title="📋 Aktivitas Terbaru" className="activity-timeline-card">
      <Timeline
        items={activities.map((activity) => ({
          key: activity.id,
          color: getColor(activity.type),
          dot: getIcon(activity.type),
          children: (
            <div className="activity-item">
              <div className="activity-header">
                <Text strong className="activity-action">
                  {activity.action}
                </Text>
                <Tag color={getColor(activity.type)} style={{ marginLeft: 8 }}>
                  {activity.type}
                </Tag>
              </div>
              <Text type="secondary" className="activity-description">
                {activity.description}
              </Text>
              <Text className="activity-time">
                {formatTime(activity.created_at)}
              </Text>
            </div>
          ),
        }))}
      />
    </Card>
  );
};

export default ActivityTimeline;

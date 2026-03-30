import React, { useEffect, useState } from 'react';
import { Card, Alert, Progress, Spin, Row, Col, Statistic } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import api from '../../api';
import './PerformanceAlerts.css';

interface PerformanceMetrics {
  api_response_time: number;
  database_queries: number;
  cache_hit_rate: number;
  active_users: number;
  queue_jobs: number;
  storage_usage: number;
}

interface Alert {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  description: string;
}

const PerformanceAlerts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/admin/performance/metrics');
      const data = response.data.data || response.data;
      setMetrics(data);
      generateAlerts(data);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      // Use mock data for development
      const mockData = {
        api_response_time: 145,
        database_queries: 234,
        cache_hit_rate: 87,
        active_users: 12,
        queue_jobs: 3,
        storage_usage: 45,
      };
      setMetrics(mockData as PerformanceMetrics);
      generateAlerts(mockData);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (data: PerformanceMetrics) => {
    const newAlerts: Alert[] = [];

    // API Response Time Alert
    if (data.api_response_time > 500) {
      newAlerts.push({
        type: 'error',
        message: 'API Response Time Tinggi',
        description: `Response time ${data.api_response_time}ms melebihi batas 500ms`,
      });
    } else if (data.api_response_time > 200) {
      newAlerts.push({
        type: 'warning',
        message: 'API Response Time Perlu Diperhatikan',
        description: `Response time ${data.api_response_time}ms di atas 200ms`,
      });
    } else {
      newAlerts.push({
        type: 'success',
        message: 'API Performance Baik',
        description: `Response time ${data.api_response_time}ms dalam batas normal`,
      });
    }

    // Cache Hit Rate Alert
    if (data.cache_hit_rate < 70) {
      newAlerts.push({
        type: 'warning',
        message: 'Cache Hit Rate Rendah',
        description: `Cache hit rate ${data.cache_hit_rate}% di bawah 70%`,
      });
    }

    // Queue Jobs Alert
    if (data.queue_jobs > 50) {
      newAlerts.push({
        type: 'error',
        message: 'Antrian Job Menumpuk',
        description: `${data.queue_jobs} job menunggu diproses`,
      });
    } else if (data.queue_jobs > 10) {
      newAlerts.push({
        type: 'info',
        message: 'Antrian Job Aktif',
        description: `${data.queue_jobs} job dalam antrian`,
      });
    }

    // Storage Usage Alert
    if (data.storage_usage > 90) {
      newAlerts.push({
        type: 'error',
        message: 'Storage Hampir Penuh',
        description: `Storage usage ${data.storage_usage}% - segera bersihkan`,
      });
    } else if (data.storage_usage > 75) {
      newAlerts.push({
        type: 'warning',
        message: 'Storage Usage Tinggi',
        description: `Storage usage ${data.storage_usage}% - pertimbangkan cleanup`,
      });
    }

    setAlerts(newAlerts);
  };

  if (loading) {
    return (
      <Card title="⚡ Performance & Alerts" className="performance-alerts-card">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <ThunderboltOutlined /> Performance & Alerts
        </span>
      }
      className="performance-alerts-card"
      extra={
        <button onClick={fetchMetrics} className="refresh-btn" title="Refresh">
          <SyncOutlined spin={loading} />
        </button>
      }
    >
      {/* Metrics Overview */}
      <Row gutter={[16, 16]} className="metrics-row">
        <Col xs={12} sm={8} lg={4}>
          <div className="metric-item">
            <Statistic
              title="API Response"
              value={metrics?.api_response_time || 0}
              suffix="ms"
              valueStyle={{
                fontSize: '18px',
                color:
                  (metrics?.api_response_time || 0) > 500
                    ? '#ff4d4f'
                    : (metrics?.api_response_time || 0) > 200
                    ? '#faad14'
                    : '#52c41a',
              }}
            />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className="metric-item">
            <Statistic
              title="Cache Hit"
              value={metrics?.cache_hit_rate || 0}
              suffix="%"
              valueStyle={{
                fontSize: '18px',
                color: (metrics?.cache_hit_rate || 0) < 70 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className="metric-item">
            <Statistic
              title="Queue Jobs"
              value={metrics?.queue_jobs || 0}
              valueStyle={{
                fontSize: '18px',
                color: (metrics?.queue_jobs || 0) > 50 ? '#ff4d4f' : '#1890ff',
              }}
            />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className="metric-item">
            <Statistic
              title="Storage"
              value={metrics?.storage_usage || 0}
              suffix="%"
              valueStyle={{
                fontSize: '18px',
                color: (metrics?.storage_usage || 0) > 90 ? '#ff4d4f' : '#52c41a',
              }}
            />
          </div>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <div className="metric-item">
            <Statistic
              title="Active Users"
              value={metrics?.active_users || 0}
              valueStyle={{ fontSize: '18px', color: '#722ed1' }}
            />
          </div>
        </Col>
      </Row>

      {/* Alerts */}
      <div className="alerts-container" style={{ marginTop: 16 }}>
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            type={alert.type}
            message={alert.message}
            description={alert.description}
            showIcon
            className="performance-alert"
            icon={
              alert.type === 'success' ? (
                <CheckCircleOutlined />
              ) : alert.type === 'error' ? (
                <ExclamationCircleOutlined />
              ) : (
                <ExclamationCircleOutlined />
              )
            }
          />
        ))}
      </div>
    </Card>
  );
};

export default PerformanceAlerts;

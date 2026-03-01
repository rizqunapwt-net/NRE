import React from 'react';
import type { LibraryStats } from '../types';

interface Props {
  stats: LibraryStats;
}

const formatCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

const StatsBar: React.FC<Props> = ({ stats }) => {
  return (
    <div className="el-stats">
      <article className="el-stat">
        <span className="el-stat__label">Total Published</span>
        <strong className="el-stat__value">{stats.totalPublished}</strong>
      </article>
      <article className="el-stat">
        <span className="el-stat__label">Total Sales</span>
        <strong className="el-stat__value">{stats.totalSales.toLocaleString('id-ID')}</strong>
      </article>
      <article className="el-stat">
        <span className="el-stat__label">Total Revenue</span>
        <strong className="el-stat__value">{formatCurrency(stats.totalRevenue)}</strong>
      </article>
      <article className="el-stat">
        <span className="el-stat__label">Average Rating</span>
        <strong className="el-stat__value">{stats.averageRating.toFixed(1)} ⭐</strong>
      </article>
    </div>
  );
};

export default StatsBar;

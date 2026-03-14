import React, { useState, useEffect } from 'react';
import { Card, Select, Slider, Checkbox, Rate, Typography, Space, Button, Divider } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../../api';

import type { SearchFilters } from '../SearchHooks';

const { Title, Text } = Typography;
const { Option } = Select;

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (key: keyof SearchFilters, value: any) => void;
  onReset: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onChange, onReset }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchAuthors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/public/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchAuthors = async () => {
    try {
      const response = await api.get('/public/authors');
      setAuthors(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  return (
    <Card 
      className="filter-sidebar" 
      title={
        <Space>
          <FilterOutlined />
          <span>Filter Lanjutan</span>
        </Space>
      }
      extra={
        <Button 
          type="text" 
          icon={<ReloadOutlined />} 
          onClick={onReset}
          size="small"
        >
          Reset
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Categories */}
        <div className="filter-group">
          <Title level={5}>Kategori</Title>
          <Select
            mode="multiple"
            placeholder="Pilih Kategori"
            style={{ width: '100%' }}
            value={filters.categories}
            onChange={(val) => onChange('categories', val)}
            allowClear
          >
            {categories.map((c) => (
              <Option key={c.slug} value={c.slug}>{c.name}</Option>
            ))}
          </Select>
        </div>

        {/* Price Range */}
        <div className="filter-group">
          <Title level={5}>Rentang Harga</Title>
          <Slider
            range
            min={0}
            max={500000}
            step={10000}
            value={[filters.min_price || 0, filters.max_price || 500000]}
            onChange={(val: number[]) => {
              onChange('min_price', val[0]);
              onChange('max_price', val[1]);
            }}
            tooltip={{
              formatter: (value) => `Rp ${value?.toLocaleString('id-ID')}`
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary">Min: Rp { (filters.min_price || 0).toLocaleString('id-ID') }</Text>
            <Text type="secondary">Max: Rp { (filters.max_price || 500000).toLocaleString('id-ID') }</Text>
          </div>
        </div>

        {/* Published Year */}
        <div className="filter-group">
          <Title level={5}>Tahun Terbit</Title>
          <Select
            placeholder="Semua Tahun"
            style={{ width: '100%' }}
            value={filters.year}
            onChange={(val) => onChange('year', val)}
            allowClear
          >
            {years.map((y) => (
              <Option key={y} value={y}>{y}</Option>
            ))}
          </Select>
        </div>

        {/* Author */}
        <div className="filter-group">
          <Title level={5}>Penulis</Title>
          <Select
            showSearch
            placeholder="Cari Penulis"
            style={{ width: '100%' }}
            value={filters.author_id}
            onChange={(val) => onChange('author_id', val)}
            allowClear
            optionFilterProp="children"
          >
            {authors.map((a) => (
              <Option key={a.id} value={a.id}>{a.name}</Option>
            ))}
          </Select>
        </div>

        {/* Type */}
        <div className="filter-group">
          <Title level={5}>Format</Title>
          <Checkbox.Group
            options={[
              { label: 'Digital (PDF)', value: true },
              { label: 'Cetak (Fisik)', value: false },
            ]}
            value={filters.is_digital === null ? [] : [filters.is_digital]}
            onChange={(vals) => {
              if (vals.length === 0) onChange('is_digital', null);
              else if (vals.length === 1) onChange('is_digital', vals[0]);
              else onChange('is_digital', null); // If both selected, show all
            }}
          />
        </div>

        {/* Rating */}
        <div className="filter-group">
          <Title level={5}>Rating Minimal</Title>
          <Rate 
            value={filters.min_rating || 0} 
            onChange={(val) => onChange('min_rating', val)} 
          />
          {filters.min_rating && (
            <Text style={{ marginLeft: 8 }}>{filters.min_rating} Ke atas</Text>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default SearchFilters;

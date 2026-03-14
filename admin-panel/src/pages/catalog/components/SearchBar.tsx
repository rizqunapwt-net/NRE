import React, { useState, useEffect } from 'react';
import { Input, AutoComplete, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Search } = Input;
const { Text } = Typography;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  suggestion?: string | null;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onSearch, suggestion }) => {
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);

  const handleSearch = async (searchText: string) => {
    if (searchText.length < 3) {
      setOptions([]);
      return;
    }

    try {
      const response = await api.get(`/public/catalog?search=${searchText}&per_page=5`);
      const books = response.data.data || [];
      setOptions(
        books.map((book: any) => ({
          value: book.title,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{book.title}</span>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {book.author?.nama || book.author?.name}
              </Text>
            </div>
          ),
        }))
      );
    } catch (error) {
      console.error('Autocomplete fetch failed:', error);
    }
  };

  return (
    <div className="search-bar-container">
      <AutoComplete
        dropdownMatchSelectWidth={500}
        style={{ width: '100%' }}
        options={options}
        onSearch={handleSearch}
        onSelect={(val) => {
          onChange(val);
          onSearch();
        }}
        value={value}
      >
        <Search
          placeholder="Cari judul, penulis, deskripsi, atau ISBN..."
          enterButton="Cari"
          size="large"
          prefix={<SearchOutlined />}
          onChange={(e) => onChange(e.target.value)}
          onSearch={onSearch}
        />
      </AutoComplete>
      
      {suggestion && (
        <div className="search-suggestion" style={{ marginTop: 8 }}>
          <Text type="secondary">
            Mungkin maksud Anda:{' '}
            <a onClick={() => { onChange(suggestion); onSearch(); }}>
              {suggestion}
            </a>
            ?
          </Text>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

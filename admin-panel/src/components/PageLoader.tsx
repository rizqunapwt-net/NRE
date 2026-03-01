import React from 'react';
import { Spin } from 'antd';

const PageLoader: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
    <Spin size="large" />
  </div>
);

export default PageLoader;

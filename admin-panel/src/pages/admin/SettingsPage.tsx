import React, { useState } from 'react';
import { Tabs } from 'antd';
import {
  SettingOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  LikeOutlined,
  PictureOutlined,
  MailOutlined,
} from '@ant-design/icons';
import GeneralSettings from './tabs/GeneralSettings';
import PublishSettings from './tabs/PublishSettings';
import FAQManagement from './tabs/FAQManagement';
import TestimonialsManagement from './tabs/TestimonialsManagement';
import HomepageBanners from './tabs/HomepageBanners';
import EmailTemplates from './tabs/EmailTemplates';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabItems = [
    {
      key: 'general',
      label: 'General',
      icon: <SettingOutlined />,
      children: <GeneralSettings />,
    },
    {
      key: 'publish',
      label: 'Publish Settings',
      icon: <BookOutlined />,
      children: <PublishSettings />,
    },
    {
      key: 'faqs',
      label: 'FAQs',
      icon: <QuestionCircleOutlined />,
      children: <FAQManagement />,
    },
    {
      key: 'testimonials',
      label: 'Testimonials',
      icon: <LikeOutlined />,
      children: <TestimonialsManagement />,
    },
    {
      key: 'banners',
      label: 'Homepage Banners',
      icon: <PictureOutlined />,
      children: <HomepageBanners />,
    },
    {
      key: 'email',
      label: 'Email Templates',
      icon: <MailOutlined />,
      children: <EmailTemplates />,
    },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your website settings, content, and configurations</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
        className="settings-tabs"
      />
    </div>
  );
};

export default SettingsPage;

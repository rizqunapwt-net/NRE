import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DollarOutlined,
  QuestionCircleOutlined,
  CommentOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './MainLayout.css';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/books',
      icon: <BookOutlined />,
      label: 'Buku',
    },
    {
      key: '/publishing/manuscripts',
      icon: <FileTextOutlined />,
      label: 'Naskah',
    },
    {
      key: '/publishing/authors',
      icon: <TeamOutlined />,
      label: 'Penulis',
    },
    {
      key: '/publishing/sales',
      icon: <ShoppingOutlined />,
      label: 'Penjualan',
    },
    {
      key: '/publishing/royalties',
      icon: <DollarOutlined />,
      label: 'Keuangan / Royalti',
    },
    {
      key: 'settings_group',
      icon: <SettingOutlined />,
      label: 'Pengaturan',
      children: [
        {
          key: '/settings/users',
          icon: <UserOutlined />,
          label: 'Manajemen User',
        },
        {
          key: '/website/faq',
          icon: <QuestionCircleOutlined />,
          label: 'Kelola FAQ',
        },
        {
          key: '/website/testimoni',
          icon: <CommentOutlined />,
          label: 'Kelola Testimoni',
        },
        {
          key: '/admin/settings',
          icon: <SettingOutlined />,
          label: 'Settings',
        },
      ]
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="80"
        width="260"
        className="main-sider"
      >
        <div className="logo">
          {collapsed ? (
            <span className="logo-short">R</span>
          ) : (
            <>
              <span className="logo-text">Rizquna</span>
              <span className="logo-sub">Publishing</span>
            </>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="main-menu"
        />
      </Sider>

      <Layout className="main-content-wrapper">
        <Header className="main-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-btn"
          />

          <div className="header-right">
            <Button
              type="text"
              icon={theme === 'dark' ? <BulbFilled style={{ color: '#fadb14' }} /> : <BulbOutlined />}
              onClick={() => setTheme(theme === 'dark' ? 'bokify' : 'dark')}
              className="header-icon"
              title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            />

            <Badge count={3} size="small">
              <BellOutlined className="header-icon" />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div className="user-info">
                <Avatar src={user?.avatar_url} icon={<UserOutlined />} />
                {!collapsed && <span className="user-name">{user?.name}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="main-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

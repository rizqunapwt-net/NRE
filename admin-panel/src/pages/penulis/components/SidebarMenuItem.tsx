import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

interface SubMenuItem {
  key: string;
  label: string;
}

interface SidebarMenuItemProps {
  item: {
    key: string;
    icon: string;
    label: string;
    badge?: number;
    children?: SubMenuItem[];
  };
  isActive: (key: string) => boolean;
  isExpanded: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClick: () => void;
}

const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isActive,
  isExpanded,
  collapsed,
  onToggle,
  onClick,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const active = isActive(item.key);

  const handleClick = () => {
    if (hasChildren) {
      onToggle();
    } else {
      onClick();
    }
  };

  return (
    <div className="sidebar-menu-item">
      <div
        className={`sidebar-menu-item__content ${active ? 'active' : ''}`}
        onClick={handleClick}
      >
        <Link to={item.key} className="sidebar-menu-item__link" onClick={(e) => !hasChildren && e.stopPropagation()}>
          <span className="sidebar-menu-item__icon">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="sidebar-menu-item__label">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="sidebar-menu-item__badge">{item.badge}</span>
              )}
              {hasChildren && (
                <span className={`sidebar-menu-item__arrow ${isExpanded ? 'expanded' : ''}`}>
                  ›
                </span>
              )}
            </>
          )}
        </Link>
      </div>

      {/* Submenu */}
      {hasChildren && isExpanded && !collapsed && (
        <div className="sidebar-menu-item__submenu">
          {item.children!.map(child => (
            <Link
              key={child.key}
              to={child.key}
              className="sidebar-menu-item__submenu-item"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarMenuItem;

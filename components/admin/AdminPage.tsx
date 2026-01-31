/**
 * 后台管理主页面
 */

import React, { useState, useEffect } from 'react';
import { pb } from '../../src/api/pocketbase';
import { adminAuthService } from '../../src/api/admin';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminSettings from './AdminSettings';
import AdminUsers from './AdminUsers';

type AdminTab = 'dashboard' | 'users' | 'settings';

export const AdminPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const checkAuth = () => {
      const isValid = pb.authStore.isValid;
      setIsLoggedIn(isValid);
      setChecking(false);
    };
    
    checkAuth();

    // 监听认证状态变化
    const unsubscribe = pb.authStore.onChange(() => {
      checkAuth();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // 检查中显示加载
  if (checking) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  // 未登录显示登录页
  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // 已登录显示管理面板
  return (
    <div style={styles.container}>
      {/* 侧边栏 */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div style={styles.logoText}>
            <span style={styles.logoTitle}>Nexus</span>
            <span style={styles.logoSubtitle}>管理后台</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavItem
            icon="dashboard"
            label="数据概览"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            icon="users"
            label="用户管理"
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />
          <NavItem
            icon="settings"
            label="系统设置"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div style={styles.sidebarFooter}>
          <a href="/" style={styles.backLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            返回首页
          </a>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {activeTab === 'dashboard' && '数据概览'}
            {activeTab === 'users' && '用户管理'}
            {activeTab === 'settings' && '系统设置'}
          </h1>
          <div style={styles.userInfo}>
            <span style={styles.userEmail}>{pb.authStore.model?.email}</span>
            <div style={styles.userAvatar}>
              {pb.authStore.model?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'settings' && <AdminSettings />}
        </div>
      </main>

      {/* 全局样式 */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// 导航项组件
interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  const getIcon = () => {
    switch (icon) {
      case 'dashboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'users':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
    >
      {getIcon()}
      {label}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f0d1a',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f0d1a',
  },
  sidebar: {
    width: '260px',
    background: 'rgba(15, 13, 26, 0.95)',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  logo: {
    width: '48px',
    height: '48px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
  },
  logoSubtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
  },
  sidebarFooter: {
    padding: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(15, 13, 26, 0.8)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userEmail: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
};

export default AdminPage;

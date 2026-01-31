/**
 * 后台管理仪表盘 - 统计数据展示
 */

import React, { useState, useEffect } from 'react';
import { statisticsService, Statistics } from '../../src/api/admin';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const data = await statisticsService.getStatistics();
      setStats(data);
    } catch (err: any) {
      setError('加载统计数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <span>{error}</span>
        <button onClick={loadStatistics} style={styles.retryButton}>重试</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>数据概览</h2>
        <button onClick={loadStatistics} style={styles.refreshButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      {/* 核心指标卡片 */}
      <div style={styles.statsGrid}>
        <StatCard
          title="总用户数"
          value={stats?.users.total || 0}
          icon="users"
          color="#6366f1"
          subtext={`本周新增 ${stats?.users.newThisWeek || 0}`}
        />
        <StatCard
          title="今日活跃"
          value={stats?.users.activeToday || 0}
          icon="activity"
          color="#22c55e"
          subtext="有阅读/观看记录"
        />
        <StatCard
          title="阅读进度"
          value={stats?.content.totalProgress || 0}
          icon="book"
          color="#f59e0b"
          subtext={`今日 ${stats?.activity.readsToday || 0} 条`}
        />
        <StatCard
          title="笔记数量"
          value={stats?.content.totalNotes || 0}
          icon="edit"
          color="#ec4899"
          subtext="用户创建的笔记"
        />
        <StatCard
          title="收藏数量"
          value={stats?.content.totalFavorites || 0}
          icon="heart"
          color="#ef4444"
          subtext={`总书签 ${stats?.content.totalBookmarks || 0}`}
        />
        <StatCard
          title="本月阅读"
          value={stats?.activity.readsThisMonth || 0}
          icon="calendar"
          color="#06b6d4"
          subtext={`本周 ${stats?.activity.readsThisWeek || 0}`}
        />
      </div>

      {/* 详细数据 */}
      <div style={styles.detailsGrid}>
        {/* 热门内容 */}
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            热门内容
          </h3>
          <div style={styles.listContainer}>
            {stats?.topContent.length === 0 ? (
              <div style={styles.emptyText}>暂无数据</div>
            ) : (
              stats?.topContent.map((item, index) => (
                <div key={item.path} style={styles.listItem}>
                  <span style={styles.rank}>{index + 1}</span>
                  <span style={styles.itemName} title={item.path}>{item.name}</span>
                  <span style={styles.itemCount}>{item.accessCount} 次</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 最近活动 */}
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            最近活动
          </h3>
          <div style={styles.listContainer}>
            {stats?.recentActivity.length === 0 ? (
              <div style={styles.emptyText}>暂无活动</div>
            ) : (
              stats?.recentActivity.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={styles.activityContent}>
                    <span style={styles.activityUser}>{activity.userName}</span>
                    <span style={styles.activityAction}>{activity.action}</span>
                    <span style={styles.activityTarget}>{activity.target}</span>
                  </div>
                  <span style={styles.activityTime}>
                    {formatTime(activity.time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtext: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtext }) => {
  const getIcon = () => {
    switch (icon) {
      case 'users':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'activity':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
      case 'book':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'edit':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case 'heart':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: `${color}20`, color }}>
        {getIcon()}
      </div>
      <div style={styles.statContent}>
        <span style={styles.statValue}>{value.toLocaleString()}</span>
        <span style={styles.statTitle}>{title}</span>
        <span style={styles.statSubtext}>{subtext}</span>
      </div>
    </div>
  );
};

// 时间格式化
const formatTime = (timeStr: string) => {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  
  return date.toLocaleDateString('zh-CN');
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '8px',
    color: '#a5b4fc',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '60px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(99, 102, 241, 0.2)',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '60px',
    color: '#f87171',
  },
  retryButton: {
    padding: '8px 24px',
    background: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    lineHeight: 1,
  },
  statTitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statSubtext: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
  },
  detailCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  detailTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  listContainer: {
    padding: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  emptyText: {
    padding: '24px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  rank: {
    width: '24px',
    height: '24px',
    background: 'rgba(99, 102, 241, 0.2)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#a5b4fc',
    flexShrink: 0,
  },
  itemName: {
    flex: 1,
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemCount: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
  activityContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    overflow: 'hidden',
  },
  activityUser: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#a5b4fc',
    flexShrink: 0,
  },
  activityAction: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
  },
  activityTarget: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  activityTime: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    flexShrink: 0,
    marginLeft: '12px',
  },
};

export default AdminDashboard;

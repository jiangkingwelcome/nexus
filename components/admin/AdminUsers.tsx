/**
 * 后台管理用户列表
 */

import React, { useState, useEffect } from 'react';
import { userManageService, UserInfo } from '../../src/api/admin';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await userManageService.getUsers(page, 20);
      setUsers(result.items);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalItems);
    } catch (err) {
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`确定要删除用户 "${userName}" 吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await userManageService.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert('删除失败，请重试');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>用户管理</h2>
          <p style={styles.subtitle}>共 {totalItems} 位用户</p>
        </div>
        <button onClick={loadUsers} style={styles.refreshButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          刷新
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>加载用户列表...</span>
        </div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>用户</th>
                  <th style={styles.th}>邮箱</th>
                  <th style={styles.th}>注册时间</th>
                  <th style={styles.th}>阅读记录</th>
                  <th style={styles.th}>笔记</th>
                  <th style={styles.th}>收藏</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.empty}>暂无用户数据</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.userCell}>
                          <div style={styles.avatar}>
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span style={styles.userName}>{user.name || '未设置'}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.email}>{user.email}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.date}>{formatDate(user.created)}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.count}>{user.progressCount}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.count}>{user.notesCount}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.count}>{user.bookmarksCount}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            style={styles.deleteButton}
                            title="删除用户"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  ...styles.pageButton,
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                上一页
              </button>
              <span style={styles.pageInfo}>
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  ...styles.pageButton,
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
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
  tableContainer: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  tr: {
    transition: 'background 0.2s',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },
  empty: {
    padding: '48px 16px',
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
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
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
  },
  email: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  date: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  count: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontVariantNumeric: 'tabular-nums',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  deleteButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#f87171',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  pageButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  pageInfo: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
};

export default AdminUsers;

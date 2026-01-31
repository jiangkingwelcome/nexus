/**
 * 后台管理设置页面
 */

import React, { useState, useEffect } from 'react';
import { settingsService, SystemSettings } from '../../src/api/admin';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'paths' | 'api' | 'app' | 'other'>('paths');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载设置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      await settingsService.saveSettings(settings);
      setMessage({ type: 'success', text: '设置已保存' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(settingsService.getDefaultSettings());
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <span>加载设置...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={styles.error}>
        <span>无法加载设置</span>
        <button onClick={loadSettings} style={styles.retryButton}>重试</button>
      </div>
    );
  }

  const tabs = [
    { id: 'paths', label: '路径配置', icon: 'folder' },
    { id: 'api', label: 'API 配置', icon: 'server' },
    { id: 'app', label: '应用配置', icon: 'settings' },
    { id: 'other', label: '其他设置', icon: 'sliders' },
  ] as const;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>系统设置</h2>
        <div style={styles.actions}>
          <button onClick={handleReset} style={styles.resetButton}>
            恢复默认
          </button>
          <button
            onClick={handleSave}
            style={{ ...styles.saveButton, opacity: saving ? 0.7 : 1 }}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          ...styles.message,
          background: message.type === 'success' 
            ? 'rgba(34, 197, 94, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          borderColor: message.type === 'success'
            ? 'rgba(34, 197, 94, 0.3)'
            : 'rgba(239, 68, 68, 0.3)',
          color: message.type === 'success' ? '#22c55e' : '#ef4444',
        }}>
          {message.text}
        </div>
      )}

      {/* 标签页导航 */}
      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
          >
            {getTabIcon(tab.icon)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 设置内容 */}
      <div style={styles.content}>
        {activeTab === 'paths' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>路径配置</h3>
            <p style={styles.sectionDesc}>配置各功能模块的网盘根目录路径</p>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>图书馆根路径</label>
              <input
                type="text"
                value={settings.library_base_path}
                onChange={(e) => updateSetting('library_base_path', e.target.value)}
                placeholder="/百度网盘/电子书"
                style={styles.input}
              />
              <span style={styles.hint}>电子书存放的主目录</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>书城路径</label>
              <input
                type="text"
                value={settings.library_bookshelf_path}
                onChange={(e) => updateSetting('library_bookshelf_path', e.target.value)}
                placeholder="/百度网盘/电子书/书城"
                style={styles.input}
              />
              <span style={styles.hint}>微信读书风格展示的书城目录</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>电影院根路径</label>
              <input
                type="text"
                value={settings.cinema_base_path}
                onChange={(e) => updateSetting('cinema_base_path', e.target.value)}
                placeholder="/百度网盘/电影"
                style={styles.input}
              />
              <span style={styles.hint}>视频文件存放的主目录</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>文件管理根路径</label>
              <input
                type="text"
                value={settings.files_base_path}
                onChange={(e) => updateSetting('files_base_path', e.target.value)}
                placeholder="/百度网盘"
                style={styles.input}
              />
              <span style={styles.hint}>文件浏览器的根目录</span>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>API 配置</h3>
            <p style={styles.sectionDesc}>配置外部服务的连接信息（文件接口待自建）</p>
          </div>
        )}

        {activeTab === 'app' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>应用配置</h3>
            <p style={styles.sectionDesc}>配置应用的基本信息和支持的文件格式</p>

            <div style={styles.formGroup}>
              <label style={styles.label}>应用名称</label>
              <input
                type="text"
                value={settings.app_name}
                onChange={(e) => updateSetting('app_name', e.target.value)}
                placeholder="Nexus"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>默认用户名</label>
              <input
                type="text"
                value={settings.default_user_name}
                onChange={(e) => updateSetting('default_user_name', e.target.value)}
                placeholder="User"
                style={styles.input}
              />
              <span style={styles.hint}>未登录时显示的默认用户名</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>支持的电子书格式</label>
              <input
                type="text"
                value={settings.book_formats}
                onChange={(e) => updateSetting('book_formats', e.target.value)}
                placeholder="pdf,epub,mobi,azw3,txt,md"
                style={styles.input}
              />
              <span style={styles.hint}>用逗号分隔的文件扩展名列表</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>支持的视频格式</label>
              <input
                type="text"
                value={settings.video_formats}
                onChange={(e) => updateSetting('video_formats', e.target.value)}
                placeholder="mp4,mkv,avi,mov,webm,flv,m4v"
                style={styles.input}
              />
              <span style={styles.hint}>用逗号分隔的文件扩展名列表</span>
            </div>
          </div>
        )}

        {activeTab === 'other' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>其他设置</h3>
            <p style={styles.sectionDesc}>配置系统行为和性能参数</p>

            <div style={styles.formGroup}>
              <div style={styles.switchRow}>
                <div>
                  <label style={styles.label}>开放用户注册</label>
                  <span style={styles.hint}>允许新用户自行注册账号</span>
                </div>
                <button
                  onClick={() => updateSetting('enable_registration', !settings.enable_registration)}
                  style={{
                    ...styles.switch,
                    background: settings.enable_registration 
                      ? '#6366f1' 
                      : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{
                    ...styles.switchThumb,
                    transform: settings.enable_registration 
                      ? 'translateX(20px)' 
                      : 'translateX(0)',
                  }} />
                </button>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>最近访问数量</label>
              <input
                type="number"
                value={settings.max_recent_items}
                onChange={(e) => updateSetting('max_recent_items', parseInt(e.target.value) || 10)}
                min={5}
                max={50}
                style={styles.input}
              />
              <span style={styles.hint}>首页显示的最近访问条目数量（5-50）</span>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>自动保存间隔（秒）</label>
              <input
                type="number"
                value={settings.auto_save_interval}
                onChange={(e) => updateSetting('auto_save_interval', parseInt(e.target.value) || 30)}
                min={10}
                max={300}
                style={styles.input}
              />
              <span style={styles.hint}>阅读进度自动保存的时间间隔（10-300秒）</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getTabIcon = (icon: string) => {
  switch (icon) {
    case 'folder':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'server':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      );
    case 'settings':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'sliders':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    default:
      return null;
  }
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#fff',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  resetButton: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 20px',
    background: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    marginBottom: '20px',
    fontSize: '14px',
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
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    padding: '4px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    width: 'fit-content',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
  },
  content: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  section: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    margin: '0 0 8px',
  },
  sectionDesc: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    maxWidth: '400px',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  hint: {
    display: 'block',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '6px',
  },
  switchRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
    padding: '2px',
  },
  switchThumb: {
    display: 'block',
    width: '20px',
    height: '20px',
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.2s',
  },
};

export default AdminSettings;

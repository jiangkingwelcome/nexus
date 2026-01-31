import React, { useState, useEffect, useContext } from 'react';
import { fileCache } from '@/src/utils/fileCache';
import { ThemeContext, UserContext } from '../App';
import * as baiduApi from '@/src/api/baidu';

// 缓存统计类型
interface CacheStats {
  count: number;
  totalSize: number;
  mode: string;
  folderName?: string;
  location?: string;
  videoSupported: boolean;
  localCount?: number;
  localSize?: number;
  idbCount?: number;
  idbSize?: number;
}

// 缓存管理组件
const CacheManagement: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    const stats = await fileCache.getStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSelectFolder = async () => {
    setIsLoading(true);
    const success = await fileCache.selectLocalFolder();
    if (success) {
      await loadStats();
    }
    setIsLoading(false);
  };

  const handleClearCache = async () => {
    if (confirm('确定要清除所有文件缓存吗？')) {
      await fileCache.clear();
      await loadStats();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  const isLocalSupported = fileCache.isLocalFolderSupported();
  const hasLocalFolder = cacheStats?.videoSupported || false;

  return (
    <section className="mb-8">
      <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
          <svg className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        文件缓存
      </h2>

      <div className={`rounded-2xl border p-4 space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
        {/* IndexedDB 缓存状态 */}
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
              🗃️ 浏览器缓存 (IndexedDB)
            </p>
            <p className="text-sm font-medium text-slate-700">
              {cacheStats ? formatSize(cacheStats.idbSize || 0) : '...'}
            </p>
          </div>
          <p className="text-xs text-slate-500">
            书籍、文档等文件 · {cacheStats?.idbCount || 0} 个文件 · 最大 2GB
          </p>
        </div>

        {/* 本地文件夹状态 */}
        <div className={`p-3 rounded-xl ${hasLocalFolder ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <p className={`text-sm font-medium flex items-center gap-2 ${hasLocalFolder ? 'text-green-700' : 'text-amber-700'}`}>
              {hasLocalFolder ? '📁' : '⚠️'} 本地文件夹 {hasLocalFolder ? `(${cacheStats?.folderName})` : '(未设置)'}
            </p>
            {hasLocalFolder && (
              <p className="text-sm font-medium text-green-700">
                {formatSize(cacheStats?.localSize || 0)}
              </p>
            )}
          </div>
          <p className={`text-xs ${hasLocalFolder ? 'text-green-600' : 'text-amber-600'}`}>
            {hasLocalFolder 
              ? `视频下载位置 · ${cacheStats?.localCount || 0} 个文件`
              : '需要设置本地文件夹才能下载视频'
            }
          </p>
        </div>

        {/* 存储策略说明 */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>💡 存储策略：</strong><br/>
            • <strong>书籍/文档</strong>：自动存储到 IndexedDB（2GB 容量）<br/>
            • <strong>视频文件</strong>：需设置本地文件夹后才能下载
          </p>
        </div>

        {/* 设置本地文件夹按钮 */}
        {isLocalSupported && (
          <button
            onClick={handleSelectFolder}
            disabled={isLoading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
              hasLocalFolder 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-amber-500 text-white hover:bg-amber-600'
            } disabled:opacity-50`}
          >
            {isLoading ? '选择中...' : hasLocalFolder ? `📁 更换文件夹 (当前: ${cacheStats?.folderName})` : '📁 设置本地文件夹 (用于视频下载)'}
          </button>
        )}

        {/* 清除缓存 */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={handleClearCache}
            className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          >
            清除所有缓存
          </button>
        </div>
      </div>
    </section>
  );
};

// 百度网盘连接组件
const BaiduConnection: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState<baiduApi.BaiduUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [appKey, setAppKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [manualToken, setManualToken] = useState('');

  // 检查连接状态
  useEffect(() => {
    checkConnection();
    // 监听来自授权回调的消息
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'baidu_auth_success') {
        checkConnection();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnection = async () => {
    const loggedIn = baiduApi.isLoggedIn();
    setIsConnected(loggedIn);
    if (loggedIn) {
      // 尝试获取用户信息
      const cached = baiduApi.getCachedUserInfo();
      if (cached) {
        setUserInfo(cached);
      } else {
        try {
          const info = await baiduApi.getUserInfo();
          setUserInfo(info);
        } catch (err) {
          console.error('获取百度用户信息失败:', err);
        }
      }
    }
  };

  const handleConnect = () => {
    if (!baiduApi.isBaiduConfigured()) {
      setShowConfig(true);
      setError('请先配置百度应用信息');
      return;
    }
    // 打开授权页面
    const authUrl = baiduApi.getAuthUrl();
    window.open(authUrl, 'baidu_auth', 'width=600,height=700');
  };

  const handleDisconnect = () => {
    if (confirm('确定要断开百度网盘连接吗？')) {
      baiduApi.clearTokens();
      setIsConnected(false);
      setUserInfo(null);
    }
  };

  const handleSaveConfig = () => {
    if (!appKey || !secretKey) {
      setError('请填写完整的应用信息');
      return;
    }
    baiduApi.setBaiduConfig(appKey, secretKey);
    setShowConfig(false);
    setError(null);
  };

  const handleImportToken = async () => {
    if (!manualToken.trim()) {
      setError('请输入 refresh_token');
      return;
    }
    if (!appKey || !secretKey) {
      setError('请先填写 App Key 和 Secret Key');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      baiduApi.setBaiduConfig(appKey, secretKey);
      baiduApi.setRefreshToken(manualToken.trim());
      await baiduApi.refreshAccessToken(); // 验证 token 是否有效
      await checkConnection();
      setShowConfig(false);
      setManualToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败，请检查 token 是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await baiduApi.refreshAccessToken();
      await checkConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : '刷新失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载已保存的配置
  useEffect(() => {
    const savedKey = localStorage.getItem('baidu_app_key') || '';
    const savedSecret = localStorage.getItem('baidu_secret_key') || '';
    setAppKey(savedKey);
    setSecretKey(savedSecret);
  }, []);

  return (
    <section className="mb-8">
      <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.5 7.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5c0 1.792-1.048 3.339-2.564 4.064C13.5 12.207 15 14.205 15 16.5V21H3v-4.5c0-2.295 1.5-4.293 3.064-4.936C4.548 10.839 3.5 9.292 3.5 7.5h2zm14.5 9c0-1.657-1.343-3-3-3s-3 1.343-3 3v1.5h6V16.5zm-3-10.5c1.105 0 2 .895 2 2s-.895 2-2 2-2-.895-2-2 .895-2 2-2z"/>
          </svg>
        </div>
        百度网盘
      </h2>

      <div className={`rounded-2xl border p-4 space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
        {isConnected && userInfo ? (
          <>
            {/* 已连接状态 */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <div className="flex items-center gap-4">
                {userInfo.avatar_url ? (
                  <img src={userInfo.avatar_url} alt="头像" className="w-12 h-12 rounded-full" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {userInfo.netdisk_name?.[0] || 'B'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {userInfo.netdisk_name || userInfo.baidu_name}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {userInfo.vip_type > 0 ? '会员用户' : '普通用户'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  已连接
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleRefreshToken}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {isLoading ? '刷新中...' : '刷新 Token'}
              </button>
              <button
                onClick={handleDisconnect}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                断开连接
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 未连接状态 */}
            <div className={`text-center py-6 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
              </div>
              <p className="font-medium mb-1">未连接百度网盘</p>
              <p className="text-sm">连接后可访问您的网盘文件</p>
            </div>

            {/* 连接按钮 */}
            <button
              onClick={handleConnect}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
              </svg>
              连接百度网盘
            </button>

            {/* 配置区域 */}
            {showConfig && (
              <div className={`mt-4 p-4 rounded-xl space-y-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  百度应用配置
                </p>
                <input
                  type="text"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  placeholder="App Key (客户端ID)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                    isDark ? 'bg-white/10 text-white placeholder:text-white/30' : 'bg-white border border-slate-200'
                  }`}
                />
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Secret Key (客户端密钥)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm ${
                    isDark ? 'bg-white/10 text-white placeholder:text-white/30' : 'bg-white border border-slate-200'
                  }`}
                />
                
                {/* 分隔线 */}
                <div className={`border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                
                {/* 直接导入 Token */}
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  直接导入 Token（推荐）
                </p>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Refresh Token (刷新令牌)"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-mono ${
                    isDark ? 'bg-white/10 text-white placeholder:text-white/30' : 'bg-white border border-slate-200'
                  }`}
                />
                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  如果已有 refresh_token，填入后点击"导入并连接"即可
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleImportToken}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? '连接中...' : '导入并连接'}
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${
                      isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    仅保存配置
                  </button>
                </div>
              </div>
            )}

            {/* 展开/收起配置 */}
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`w-full py-2 text-sm ${isDark ? 'text-white/50 hover:text-white/70' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {showConfig ? '收起配置' : '配置百度应用 (首次使用)'}
            </button>
          </>
        )}

        {/* 错误提示 */}
        {error && (
          <div className={`p-3 rounded-xl text-sm ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}
      </div>
    </section>
  );
};

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(UserContext);
  const isDark = theme === 'dark';

  // 退出登录
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <div className="animate-fade-in pb-32 px-6">
      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>设置</h1>

      {/* 账号管理 */}
      <section className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          账号管理
        </h2>

        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
          {user ? (
            <div className="space-y-4">
              {/* 用户信息卡片 */}
              <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10' : 'bg-gradient-to-r from-violet-50 to-indigo-50'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                  isDark 
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' 
                    : 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
                }`}>
                  {(user.name || user.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {user.name || '用户'}
                  </p>
                  <p className={`text-sm truncate ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {user.email}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  已登录
                </div>
              </div>

              {/* 用户 ID */}
              <div className={`flex items-center justify-between py-3 px-1 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>用户 ID</span>
                <span className={`text-sm font-mono ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{user.id}</span>
              </div>

              {/* 退出登录按钮 */}
              <button
                onClick={handleLogout}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出登录
              </button>
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
              <p>未登录</p>
            </div>
          )}
        </div>
      </section>

      {/* 主题设置 */}
      <section className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-700'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
            {isDark ? (
              <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            )}
          </div>
          外观主题
        </h2>

        <div className={`rounded-2xl border p-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDark 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                  : 'bg-gradient-to-br from-amber-400 to-orange-500'
              }`}>
                {isDark ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {isDark ? '深色模式' : '浅色模式'}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  {isDark ? '减少眼睛疲劳，适合夜间使用' : '明亮清晰，适合日间使用'}
                </p>
              </div>
            </div>
            
            {/* 切换开关 */}
            <button
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
                isDark ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                isDark ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </section>

      {/* 百度网盘连接 */}
      <BaiduConnection isDark={isDark} />

      {/* 缓存管理 */}
      <CacheManagement isDark={isDark} />

      {/* 关于 */}
      <section>
        <div className={`rounded-2xl p-4 text-center ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Nexus OS</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>个人知识操作系统</p>
          <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>v0.1.0</p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;

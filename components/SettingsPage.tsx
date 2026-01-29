import React, { useState, useEffect } from 'react';
import { 
  login as alistLogin, 
  logout as alistLogout, 
  isLoggedIn as checkAlistLogin,
  getCurrentUser,
  setBaseUrl,
  getBaseUrl,
  saveToken,
  AlistUserInfo
} from '@/src/api/alist';
import { fileCache } from '@/src/utils/fileCache';

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
const CacheManagement: React.FC = () => {
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
      <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        文件缓存
      </h2>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
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

const SettingsPage: React.FC = () => {
  // Alist 设置
  const [alistUrl, setAlistUrl] = useState(getBaseUrl());
  const [authMode, setAuthMode] = useState<'token' | 'password'>('token');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alistUser, setAlistUser] = useState<AlistUserInfo['data'] | null>(null);
  const [alistLoading, setAlistLoading] = useState(false);
  const [alistError, setAlistError] = useState<string | null>(null);
  const [alistSuccess, setAlistSuccess] = useState<string | null>(null);

  // PocketBase 设置
  const [pbUrl, setPbUrl] = useState(import.meta.env.VITE_PB_URL || 'http://localhost:8090');

  // 检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const loggedIn = await checkAlistLogin();
    if (loggedIn) {
      const user = await getCurrentUser();
      setAlistUser(user);
    }
  };

  // 使用 Token 认证
  const handleTokenAuth = async () => {
    setAlistLoading(true);
    setAlistError(null);
    setAlistSuccess(null);

    try {
      // 先保存 URL
      setBaseUrl(alistUrl);
      
      // 保存 Token
      saveToken(token);
      
      // 验证 Token 是否有效
      const user = await getCurrentUser();
      if (user) {
        setAlistUser(user);
        setAlistSuccess('连接成功！');
        setToken('');
      } else {
        throw new Error('Token 无效，请检查后重试');
      }
    } catch (err) {
      setAlistError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setAlistLoading(false);
    }
  };

  // Alist 用户名密码登录
  const handleAlistLogin = async () => {
    setAlistLoading(true);
    setAlistError(null);
    setAlistSuccess(null);

    try {
      // 先保存 URL
      setBaseUrl(alistUrl);
      
      // 登录
      await alistLogin(username, password);
      
      // 获取用户信息
      const user = await getCurrentUser();
      setAlistUser(user);
      setAlistSuccess('登录成功！');
      setPassword('');
    } catch (err) {
      setAlistError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setAlistLoading(false);
    }
  };

  // Alist 登出
  const handleAlistLogout = () => {
    alistLogout();
    setAlistUser(null);
    setAlistSuccess('已退出登录');
  };

  // 保存 URL 设置
  const handleSaveUrl = () => {
    setBaseUrl(alistUrl);
    setAlistSuccess('服务器地址已保存');
    setTimeout(() => setAlistSuccess(null), 3000);
  };

  return (
    <div className="animate-fade-in pb-32 px-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">设置</h1>

      {/* Alist 设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          Alist 文件服务器
        </h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
          {/* 服务器地址 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">服务器地址</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={alistUrl}
                onChange={(e) => setAlistUrl(e.target.value)}
                placeholder="https://your-alist-server.com"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                保存
              </button>
            </div>
          </div>

          {/* 登录状态 */}
          {alistUser ? (
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">已连接</p>
                    <p className="text-sm text-green-600">用户: {alistUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={handleAlistLogout}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  断开连接
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 认证方式切换 */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setAuthMode('token')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === 'token' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  使用 Token（推荐）
                </button>
                <button
                  onClick={() => setAuthMode('password')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === 'password' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  用户名密码
                </button>
              </div>

              {authMode === 'token' ? (
                <>
                  {/* Token 输入 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Token 令牌
                    </label>
                    <input 
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="粘贴从 Alist 管理后台获取的 Token"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      获取方式：Alist 管理后台 → 设置 → 其他 → 令牌
                    </p>
                  </div>

                  {/* Token 登录按钮 */}
                  <button
                    onClick={handleTokenAuth}
                    disabled={alistLoading || !token}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {alistLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        验证中...
                      </>
                    ) : (
                      '使用 Token 连接'
                    )}
                  </button>
                </>
              ) : (
                <>
                  {/* 用户名 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">用户名</label>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="输入 Alist 用户名"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  {/* 密码 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">密码</label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      onKeyDown={(e) => e.key === 'Enter' && handleAlistLogin()}
                    />
                  </div>

                  {/* 密码登录按钮 */}
                  <button
                    onClick={handleAlistLogin}
                    disabled={alistLoading || !username || !password}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {alistLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        登录中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </button>
                </>
              )}
            </>
          )}

          {/* 提示信息 */}
          {alistError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {alistError}
            </div>
          )}
          {alistSuccess && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-xl">
              {alistSuccess}
            </div>
          )}
        </div>
      </section>

      {/* PocketBase 设置 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          PocketBase 数据同步
        </h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">服务器地址</label>
            <input 
              type="text"
              value={pbUrl}
              onChange={(e) => setPbUrl(e.target.value)}
              placeholder="http://localhost:8090"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <p className="text-xs text-slate-400">
            PocketBase 用于同步阅读进度、笔记等数据（可选）
          </p>
        </div>
      </section>

      {/* 缓存管理 */}
      <CacheManagement />

      {/* 关于 */}
      <section>
        <div className="bg-slate-50 rounded-2xl p-4 text-center">
          <h3 className="font-bold text-slate-800">Nexus OS</h3>
          <p className="text-sm text-slate-500 mt-1">个人知识操作系统</p>
          <p className="text-xs text-slate-400 mt-2">v0.1.0</p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;

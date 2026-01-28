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
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          缓存管理
        </h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            清除所有缓存数据
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            将清除登录状态、阅读进度等本地数据
          </p>
        </div>
      </section>

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

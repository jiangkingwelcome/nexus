import React, { useState, useContext, useRef, useEffect } from 'react';
import { SearchIcon } from './Icons';
import { UserContext, ThemeContext } from '../App';

interface HeaderProps {
  name: string;
}

const Header: React.FC<HeaderProps> = ({ name }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 9) return '早上好';
    if (hours < 12) return '上午好';
    if (hours < 18) return '下午好';
    return '晚上好';
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // 退出登录
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      setShowUserMenu(false);
    }
  };

  // 获取用户头像字母
  const getAvatarLetter = () => {
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  return (
    <header className={`px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md transition-all duration-300 ${
      isDark ? 'bg-[#0f0f12]/80' : 'bg-slate-50/80'
    }`}>
      <div className="flex flex-col">
        <span className={`text-sm font-semibold tracking-wider uppercase mb-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <h1 className={`text-3xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {getGreeting()}, <span className={`block md:inline ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{name}</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className={`p-2.5 rounded-full shadow-sm border active:scale-95 transition-transform ${
          isDark 
            ? 'bg-white/10 border-white/10 text-white/70 hover:text-indigo-400 hover:bg-white/15' 
            : 'bg-white border-slate-100 text-slate-600 hover:text-indigo-600'
        }`}>
          <SearchIcon className="w-5 h-5" />
        </button>
        
        {/* 用户头像和下拉菜单 */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="relative cursor-pointer active:scale-95 transition-transform group"
          >
            {/* 头像 */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold border-2 shadow-md transition-colors ${
              isDark 
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-white/20 group-hover:border-indigo-400/50' 
                : 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white border-white group-hover:border-indigo-100'
            }`}>
              {getAvatarLetter()}
            </div>
            {/* 在线状态指示器 */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
              isDark ? 'border-2 border-[#0f0f12]' : 'border-2 border-white'
            }`}></div>
          </button>

          {/* 下拉菜单 */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-xl border overflow-hidden z-50 animate-fade-in ${
              isDark 
                ? 'bg-[#1a1a1f] border-white/10' 
                : 'bg-white border-slate-100'
            }`}>
              {/* 用户信息头部 */}
              <div className={`p-4 ${isDark ? 'bg-gradient-to-r from-violet-500/10 to-indigo-500/10' : 'bg-gradient-to-r from-violet-50 to-indigo-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                    isDark 
                      ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' 
                      : 'bg-gradient-to-br from-violet-400 to-indigo-500 text-white'
                  }`}>
                    {getAvatarLetter()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {user?.name || '用户'}
                    </p>
                    <p className={`text-sm truncate ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* 用户 ID */}
              <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-400'}`}>用户 ID</span>
                  <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{user?.id}</span>
                </div>
              </div>

              {/* 菜单选项 */}
              <div className="p-2">
                {/* 退出登录 */}
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                    isDark 
                      ? 'text-red-400 hover:bg-red-500/10' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
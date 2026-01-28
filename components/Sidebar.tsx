import React from 'react';
import { NavTab } from '../types';
import { NexusIcon } from './Icons';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

// 微信读书风格导航项配置
const navItems = [
  { 
    id: NavTab.HOME, 
    label: '首页',
    gradient: 'from-slate-500 to-slate-600',
    activeGradient: 'from-indigo-500 to-purple-600',
    shadowColor: 'shadow-indigo-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  { 
    id: NavTab.LIBRARY, 
    label: '图书馆',
    gradient: 'from-amber-400 to-orange-500',
    activeGradient: 'from-amber-400 to-orange-500',
    shadowColor: 'shadow-orange-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  { 
    id: NavTab.CINEMA, 
    label: '电影院',
    gradient: 'from-purple-400 to-pink-500',
    activeGradient: 'from-purple-400 to-pink-500',
    shadowColor: 'shadow-purple-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
  },
  { 
    id: NavTab.FILES, 
    label: '文件',
    gradient: 'from-blue-400 to-indigo-500',
    activeGradient: 'from-blue-400 to-indigo-500',
    shadowColor: 'shadow-blue-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  { 
    id: NavTab.SETTINGS, 
    label: '设置',
    gradient: 'from-slate-400 to-slate-500',
    activeGradient: 'from-slate-500 to-slate-600',
    shadowColor: 'shadow-slate-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-40 bg-white/95 backdrop-blur-xl border-r border-slate-100">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <NexusIcon className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">Nexus</span>
      </div>

      {/* 导航项 - 微信读书风格 */}
      <nav className="flex-1 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* 渐变色图标容器 */}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                isActive ? item.activeGradient : item.gradient
              } flex items-center justify-center text-white shadow-md ${
                isActive ? item.shadowColor : ''
              } transition-all duration-200 ${
                !isActive ? 'opacity-70 group-hover:opacity-100' : ''
              }`}>
                {item.icon}
              </div>
              <span className={`font-medium transition-colors ${
                isActive 
                  ? 'text-slate-800' 
                  : 'text-slate-500 group-hover:text-slate-700'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 用户信息 */}
      <div className="p-6 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
            J
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold text-slate-800">Jiangking</span>
            <span className="text-xs text-slate-500">查看设置</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

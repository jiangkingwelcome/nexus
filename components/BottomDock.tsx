import React from 'react';
import { NavTab } from '../types';

interface BottomDockProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

// 图标组件
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FilmIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const BottomDock: React.FC<BottomDockProps> = ({ activeTab, onTabChange }) => {
  
  const navItems = [
    { id: NavTab.HOME, icon: HomeIcon, label: '首页' },
    { id: NavTab.LIBRARY, icon: BookIcon, label: '图书' },
    { id: NavTab.CINEMA, icon: FilmIcon, label: '影院' },
    { id: NavTab.FILES, icon: FolderIcon, label: '文件' },
  ];
  
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none md:hidden">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl px-4 py-3 flex items-center justify-between gap-2 pointer-events-auto mx-4 w-full max-w-sm">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="group relative flex flex-col items-center justify-center flex-1 py-2"
            >
              {/* 激活背景 */}
              {isActive && (
                <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl" />
              )}
              
              {/* 图标 */}
              <div 
                className={`relative transition-all duration-300 ${
                  isActive ? 'text-indigo-600 -translate-y-1 scale-110' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-6 h-6" />
              </div>

              {/* 标签 */}
              <span className={`text-[10px] font-semibold mt-1 transition-all duration-300 ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {item.label}
              </span>

              {/* 激活指示点 */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomDock;

import React, { useContext } from 'react';
import { APP_ENTRIES, RECENT_ITEMS } from '../constants';
import { AppEntry, RecentItem, NavTab } from '../types';
import { ThemeContext } from '../App';

interface HomeSectionProps {
  onNavigate: (tab: NavTab) => void;
}

const HomeSection: React.FC<HomeSectionProps> = ({ onNavigate }) => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  
  return (
    <div className="animate-fade-in pb-32">
      {/* 功能入口 */}
      <section className="px-6 mb-8">
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>开始使用</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {APP_ENTRIES.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onNavigate(entry.tab)}
              className="group flex flex-col items-center"
            >
              <div className={`w-20 h-20 ${entry.color} rounded-2xl shadow-lg flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95`}>
                {entry.icon}
              </div>
              <span className={`text-sm font-semibold group-hover:text-indigo-500 transition-colors ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                {entry.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 继续阅读/观看 - 紧凑横向布局 */}
      <section>
        <div className="flex items-center justify-between mb-3 px-6">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>继续</h2>
          <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
            查看全部
          </button>
        </div>

        {/* 横向滚动列表 */}
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {RECENT_ITEMS.map((item) => (
            <CompactRecentCard key={item.id} item={item} isDark={isDark} />
          ))}
        </div>

        {RECENT_ITEMS.length === 0 && (
          <div className={`flex flex-col items-center justify-center py-12 px-6 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm">还没有最近访问的内容</p>
          </div>
        )}
      </section>
    </div>
  );
};

// 紧凑型最近访问卡片组件（横向滚动用）
const CompactRecentCard: React.FC<{ item: RecentItem; isDark: boolean }> = ({ item, isDark }) => {
  const getTypeLabel = () => {
    switch (item.type) {
      case 'book': return '图书';
      case 'video': return '视频';
      default: return '文件';
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'book':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`group flex-shrink-0 w-32 cursor-pointer transition-all active:scale-95`}>
      {/* 缩略图 */}
      <div className={`relative w-32 h-20 rounded-xl overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
        {item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'
          }`}>
            <span className={`text-xl ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {getTypeIcon()}
            </span>
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded">
          <span className="text-[9px] font-bold text-white uppercase tracking-wide">
            {getTypeLabel()}
          </span>
        </div>

        {/* 视频播放按钮 */}
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40 group-hover:bg-white/40 transition-colors">
              <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5" />
            </div>
          </div>
        )}

        {/* 进度条（覆盖在底部） */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-indigo-500 transition-all"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      </div>

      {/* 标题和信息 */}
      <h3 className={`text-xs font-semibold truncate group-hover:text-indigo-500 transition-colors ${
        isDark ? 'text-white' : 'text-slate-800'
      }`}>
        {item.name}
      </h3>
      <div className={`flex items-center gap-1 mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
        <span className="text-[10px]">{item.progress}%</span>
        <span className="text-[10px]">·</span>
        <span className="text-[10px] truncate">{item.lastAccess}</span>
      </div>
    </div>
  );
};

// 最近访问卡片组件（大卡片版本，保留备用）
const RecentCard: React.FC<{ item: RecentItem; isDark: boolean }> = ({ item, isDark }) => {
  const getTypeIcon = () => {
    switch (item.type) {
      case 'book':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'book': return '图书';
      case 'video': return '视频';
      default: return '文件';
    }
  };

  return (
    <div className={`group rounded-2xl p-4 shadow-sm border flex gap-4 transition-all cursor-pointer active:scale-[0.99] ${
      isDark 
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30' 
        : 'bg-white border-slate-100 hover:shadow-md hover:border-indigo-100'
    }`}>
      {/* 缩略图 */}
      <div className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
        {item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDark ? 'bg-gradient-to-br from-white/10 to-white/5' : 'bg-gradient-to-br from-slate-100 to-slate-200'
          }`}>
            {getTypeIcon()}
          </div>
        )}
        
        {/* 类型标签 */}
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md">
          <span className="text-[10px] font-bold text-white uppercase tracking-wide">
            {getTypeLabel()}
          </span>
        </div>

        {/* 视频播放按钮 */}
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
            <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
        <div>
          <h3 className={`font-bold truncate group-hover:text-indigo-500 transition-colors ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}>
            {item.name}
          </h3>
          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            {item.lastAccess}
          </p>
        </div>

        {/* 进度条 */}
        <div className="mt-3">
          <div className={`flex items-center justify-between text-xs font-semibold mb-1.5 ${
            isDark ? 'text-white/60' : 'text-slate-500'
          }`}>
            <span>{item.progress}%</span>
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>
              {getTypeIcon()}
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;

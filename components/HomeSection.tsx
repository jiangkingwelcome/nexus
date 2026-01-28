import React from 'react';
import { APP_ENTRIES, RECENT_ITEMS } from '../constants';
import { AppEntry, RecentItem, NavTab } from '../types';

interface HomeSectionProps {
  onNavigate: (tab: NavTab) => void;
}

const HomeSection: React.FC<HomeSectionProps> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in pb-32">
      {/* 功能入口 */}
      <section className="px-6 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4">开始使用</h2>
        
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
              <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                {entry.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 继续阅读/观看 */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">继续</h2>
          <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
            查看全部
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {RECENT_ITEMS.map((item) => (
            <RecentCard key={item.id} item={item} />
          ))}
        </div>

        {RECENT_ITEMS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm">还没有最近访问的内容</p>
            <p className="text-xs mt-1">开始浏览文件吧</p>
          </div>
        )}
      </section>
    </div>
  );
};

// 最近访问卡片组件
const RecentCard: React.FC<{ item: RecentItem }> = ({ item }) => {
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
    <div className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer active:scale-[0.99]">
      {/* 缩略图 */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
        {item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
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
          <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {item.lastAccess}
          </p>
        </div>

        {/* 进度条 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>{item.progress}%</span>
            <span className="text-slate-400 flex items-center gap-1">
              {getTypeIcon()}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
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

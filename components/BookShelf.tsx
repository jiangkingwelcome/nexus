import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileItem, FileCategory } from '../types';
import { listFiles, getFileCategory, FileListItem } from '@/src/api/files';

interface BookShelfProps {
  path: string;
  basePath: string;
  bookShelfPath?: string;
  onBookClick: (file: FileItem) => void;
  onFolderClick: (path: string) => void;
  onBack?: () => void;  // 返回上一级（首页）
}

// 书籍封面颜色
const COVER_COLORS = [
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-orange-500 to-red-600',
];

const getColorByName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
};

const getFormatBadge = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return { text: 'PDF', color: 'bg-red-500' };
    case 'epub': return { text: 'EPUB', color: 'bg-green-500' };
    case 'mobi': return { text: 'MOBI', color: 'bg-blue-500' };
    case 'azw3': return { text: 'AZW3', color: 'bg-purple-500' };
    case 'txt': return { text: 'TXT', color: 'bg-gray-500' };
    default: return null;
  }
};

const cleanBookName = (name: string) => {
  return name
    .replace(/\.(pdf|epub|mobi|azw3|txt|md)$/i, '')
    .replace(/【.*?】/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
};

// 获取书名首字（用于封面装饰）
const getBookInitial = (name: string) => {
  const clean = cleanBookName(name);
  // 优先取中文字符
  const chinese = clean.match(/[\u4e00-\u9fa5]/);
  if (chinese) return chinese[0];
  // 否则取首字母大写
  return clean.charAt(0).toUpperCase();
};

// 封面装饰样式
const COVER_STYLES = [
  { pattern: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)', decoration: 'top-right' },
  { pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)', decoration: 'bottom-left' },
  { pattern: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)', decoration: 'diagonal' },
  { pattern: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)', decoration: 'top-center' },
];

const getCoverStyle = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 3) - hash);
  }
  return COVER_STYLES[Math.abs(hash) % COVER_STYLES.length];
};

type LibraryTab = 'shelf' | 'store' | 'stats' | 'profile';

const BookShelf: React.FC<BookShelfProps> = ({
  path,
  onBookClick,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('shelf');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  useEffect(() => {
    loadFiles();
  }, [path]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileList = await listFiles(path);
      const items: FileItem[] = fileList.map((f: FileListItem) => ({
        name: f.name,
        path: f.path || `${path === '/' ? '' : path}/${f.name}`,
        size: f.size,
        isDir: f.is_dir,
        modified: f.modified,
        category: getFileCategory(f.name, f.is_dir),
        thumb: f.thumb,
        fs_id: f.fs_id,
      }));

      const bookCategories: FileCategory[] = ['document', 'ebook'];
      const bookFiles = items.filter(f => !f.isDir && bookCategories.includes(f.category));
      bookFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
      setFiles(bookFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 模拟最近阅读的书
  const recentBook = filteredBooks.length > 0 ? {
    ...filteredBooks[0],
    progress: 45,
    author: '未知作者'
  } : null;

  const tags = ['all', 'tech', 'novel', 'history', 'psychology', 'business'];
  const tagLabels: Record<string, string> = {
    all: '全部', tech: '技术', novel: '小说', 
    history: '历史', psychology: '心理', business: '商业'
  };

  const categories = [
    { id: 'tech', name: '技术', gradient: 'from-amber-400 via-orange-400 to-orange-500', shadow: 'shadow-orange-400/40', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'novel', name: '小说', gradient: 'from-teal-400 via-emerald-400 to-cyan-500', shadow: 'shadow-teal-400/40', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'history', name: '历史', gradient: 'from-indigo-400 via-purple-400 to-violet-500', shadow: 'shadow-purple-400/40', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'psychology', name: '心理', gradient: 'from-pink-400 via-rose-400 to-red-400', shadow: 'shadow-pink-400/40', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    { id: 'business', name: '商业', gradient: 'from-blue-400 via-cyan-400 to-sky-500', shadow: 'shadow-blue-400/40', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'design', name: '设计', gradient: 'from-emerald-400 via-green-400 to-teal-500', shadow: 'shadow-emerald-400/40', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'science', name: '科学', gradient: 'from-yellow-400 via-amber-400 to-orange-400', shadow: 'shadow-yellow-400/40', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { id: 'all', name: '全部', gradient: 'from-violet-400 via-purple-400 to-fuchsia-500', shadow: 'shadow-violet-400/40', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  ];

  // ==================== 书架 Tab ====================
  const renderShelfTab = () => (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部固定区域 */}
      <div className="sticky top-0 z-20 bg-white">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 返回按钮 - 仅移动端显示 */}
            {onBack && (
              <button 
                onClick={onBack}
                className="md:hidden w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95"
                title="返回首页"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">书架</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95" title="搜索">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/30 active:scale-95" title="添加书籍">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-full py-2.5 px-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              type="text" 
              placeholder="搜索书架" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 内容滚动区 */}
      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        {/* 最近阅读 - 横向滚动多本书 */}
        {filteredBooks.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-600">最近阅读</h2>
              <button className="text-xs text-orange-500 hover:text-orange-600">更多 ›</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {filteredBooks.slice(0, 6).map((book, i) => {
                const coverColor = getColorByName(book.name);
                const cleanName = cleanBookName(book.name);
                const initial = getBookInitial(book.name);
                const coverStyle = getCoverStyle(book.name);
                const progress = [45, 72, 23, 88, 30, 55][i % 6];
                
                return (
                  <button
                    key={book.path}
                    onClick={() => onBookClick(book)}
                    className="flex-shrink-0 group"
                    style={{ width: '80px' }}
                  >
                    <div 
                      className={`bg-gradient-to-br ${coverColor} rounded-xl shadow-lg relative overflow-hidden group-hover:shadow-xl group-active:scale-95 transition-all`} 
                      style={{ width: '80px', height: '110px' }}
                    >
                      {/* 书脊 */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20"></div>
                      {/* 装饰光效 */}
                      <div className="absolute inset-0" style={{ background: coverStyle.pattern }}></div>
                      {/* 内容 */}
                      <div className="absolute inset-0 p-2 flex flex-col">
                        <div className="text-white/90 text-[9px] font-medium leading-tight pl-0.5 line-clamp-2">{cleanName}</div>
                        <div className="flex-1"></div>
                        {/* 首字装饰 */}
                        <div className="flex justify-end">
                          <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <span className="text-white/80 text-sm font-bold">{initial}</span>
                          </div>
                        </div>
                      </div>
                      {/* 进度条 */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                        <div className="h-full bg-white/90" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="mt-1.5 text-center">
                      <div className="text-[10px] text-gray-700 truncate group-hover:text-orange-500">{cleanName}</div>
                      <div className="text-[9px] text-orange-500 font-medium">{progress}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 书架分组 */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600">我的书架</h2>
            <button className="text-xs text-gray-400 hover:text-gray-600">管理</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {tags.map((tag) => (
              <button 
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`flex-shrink-0 px-4 py-2 text-xs font-medium rounded-full transition-all ${
                  activeTag === tag 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                {tagLabels[tag]}
              </button>
            ))}
          </div>
        </div>

        {/* 书籍网格 */}
        <div className="px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-400">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-gray-600">连接失败: {error}</p>
              <button onClick={loadFiles} className="mt-4 px-4 py-2 bg-amber-500 text-white text-sm rounded-full">重试</button>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {filteredBooks.map((book) => {
                const coverColor = getColorByName(book.name);
                const cleanName = cleanBookName(book.name);
                const initial = getBookInitial(book.name);
                const coverStyle = getCoverStyle(book.name);
                
                return (
                  <button
                    key={book.path}
                    onClick={() => onBookClick(book)}
                    className="flex flex-col items-center group"
                  >
                    <div 
                      className={`w-full aspect-[3/4] bg-gradient-to-br ${coverColor} rounded-lg shadow relative overflow-hidden mb-1 group-hover:shadow-md group-active:scale-95 transition-all`}
                    >
                      {/* 书脊 */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>
                      {/* 装饰光效 */}
                      <div className="absolute inset-0" style={{ background: coverStyle.pattern }}></div>
                      {/* 内容 */}
                      <div className="absolute inset-0 p-1.5 flex flex-col">
                        <div className="text-white/90 text-[8px] font-medium leading-tight line-clamp-2">{cleanName}</div>
                        <div className="flex-1"></div>
                        {/* 首字装饰 */}
                        <div className="flex justify-end">
                          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                            <span className="text-white/70 text-[10px] font-bold">{initial}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 truncate w-full text-center group-hover:text-orange-500 transition-colors">{cleanName}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">书架空空如也</p>
              <p className="text-xs text-gray-400 mt-1">去文件管理添加电子书吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== 书城 Tab ====================
  const renderStoreTab = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="sticky top-0 z-20 bg-white">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-800">书城</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="bg-gray-100 rounded-full py-2.5 px-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" placeholder="搜索书城" className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">
        {/* 分类入口 */}
        <div className="px-4 mb-4">
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => (
              <button key={cat.id} className="flex flex-col items-center gap-2 py-2 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg ${cat.shadow} transition-all group-hover:-translate-y-1 group-active:scale-95`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
                  </svg>
                </div>
                <span className="text-xs text-gray-700 font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-2 bg-gray-100"></div>

        {/* 书籍列表 */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">全部书籍</h2>
            <span className="text-xs text-gray-400">共 {filteredBooks.length} 本</span>
          </div>
          
          <div className="space-y-3">
            {filteredBooks.map((book) => {
              const coverColor = getColorByName(book.name);
              const cleanName = cleanBookName(book.name);
              const initial = getBookInitial(book.name);
              const coverStyle = getCoverStyle(book.name);
              
              return (
                <button 
                  key={book.path}
                  onClick={() => onBookClick(book)}
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors w-full group"
                >
                  <div className={`w-14 h-[72px] bg-gradient-to-br ${coverColor} rounded-lg shadow flex-shrink-0 relative overflow-hidden`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>
                    <div className="absolute inset-0" style={{ background: coverStyle.pattern }}></div>
                    <div className="absolute inset-0 p-1.5 flex flex-col">
                      <div className="text-white/90 text-[7px] font-medium leading-tight line-clamp-2">{cleanName}</div>
                      <div className="flex-1"></div>
                      <div className="flex justify-end">
                        <span className="text-white/60 text-lg font-bold">{initial}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-medium text-gray-800 text-sm truncate group-hover:text-orange-500 transition-colors">{cleanName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">电子书</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-gray-400">{(book.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== 统计 Tab ====================
  const renderStatsTab = () => (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500">
        <div className="px-4 pt-4 pb-6">
          <h1 className="text-white text-2xl font-bold mb-4">阅读统计</h1>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5">
            <div className="text-center mb-5">
              <div className="text-5xl font-bold text-white">0</div>
              <div className="text-white/80 text-sm mt-1">本周阅读时长 (小时)</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{files.length}</div>
                <div className="text-white/70 text-xs">总书籍</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-white/70 text-xs">已读完</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-white/70 text-xs">阅读中</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 bg-white rounded-t-3xl -mt-4 relative z-10 hide-scrollbar">
        <div className="px-4 py-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">本周阅读</h2>
          <div className="flex justify-between items-end h-36 px-2 bg-gray-50 rounded-xl py-4">
            {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div 
                  className={`w-full max-w-8 ${i === 4 ? 'bg-gradient-to-t from-orange-500 to-red-400 shadow-md' : 'bg-gradient-to-t from-amber-400 to-orange-300'} rounded-t-lg transition-all hover:from-amber-500 hover:to-orange-400`} 
                  style={{ height: `${[40, 60, 85, 55, 100, 70, 30][i]}px` }}
                ></div>
                <span className={`text-[11px] ${i === 4 ? 'text-orange-500 font-semibold' : 'text-gray-500'} font-medium`}>{day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">阅读成就</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 text-center border border-orange-100">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-lg font-bold text-orange-500">0</div>
              <div className="text-[10px] text-gray-500">连续阅读天数</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center border border-purple-100">
              <div className="text-2xl mb-1">📚</div>
              <div className="text-lg font-bold text-purple-500">{files.length}</div>
              <div className="text-[10px] text-gray-500">书籍总数</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100">
              <div className="text-2xl mb-1">⏱️</div>
              <div className="text-lg font-bold text-blue-500">0h</div>
              <div className="text-[10px] text-gray-500">总阅读时长</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== 我的 Tab ====================
  const renderProfileTab = () => (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-2xl font-bold text-white">J</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Jiangking</h1>
              <p className="text-sm text-gray-400 mt-0.5">已收藏 {files.length} 本书</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 bg-white rounded-t-3xl -mt-4 relative z-10 hide-scrollbar">
        <div className="px-4 py-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-emerald-800">已连接</h3>
              <p className="text-xs text-emerald-600">文件源（待自建接口）</p>
            </div>
            <button onClick={loadFiles} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">
              刷新
            </button>
          </div>
        </div>

        <div className="px-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">设置</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {[
              { icon: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01', label: '服务器设置', gradient: 'from-amber-400 to-orange-500' },
              { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', label: '数据备份', gradient: 'from-blue-400 to-indigo-500' },
              { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', label: '主题设置', gradient: 'from-purple-400 to-pink-500' },
              { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: '关于', gradient: 'from-gray-400 to-gray-500' },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <span className="flex-1 text-left text-sm text-gray-700">{item.label}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Tab 配置
  const tabItems = [
    { id: 'shelf' as LibraryTab, label: '书架', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'store' as LibraryTab, label: '书城', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
    { id: 'stats' as LibraryTab, label: '统计', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'profile' as LibraryTab, label: '我的', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="relative bg-white min-h-[calc(100vh-120px)] flex flex-col pb-20 md:pb-0">
      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'shelf' && renderShelfTab()}
        {activeTab === 'store' && renderStoreTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      {/* 桌面端底部 Tab 导航 - 相对定位 */}
      <div className="hidden md:block bg-white/98 backdrop-blur-xl border-t border-gray-100">
        <div className="flex items-center justify-around px-2 py-1">
          {tabItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all ${isActive ? 'text-transparent' : 'text-gray-400'}`}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <svg 
                    className="w-6 h-6" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={isActive ? 'url(#tab-gradient)' : 'currentColor'} 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className={`text-[11px] font-semibold ${isActive ? 'bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="tab-gradient-desktop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFB347' }} />
              <stop offset="100%" style={{ stopColor: '#FF6B6B' }} />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 移动端底部 Tab 导航 - 使用 Portal 渲染到 body 避免 transform 影响 */}
      {createPortal(
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-100 z-50">
          <div className="flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
            {tabItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl transition-all ${isActive ? 'text-transparent' : 'text-gray-400'}`}
                >
                  <div className="w-7 h-7 flex items-center justify-center">
                    <svg 
                      className="w-6 h-6" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke={isActive ? 'url(#tab-gradient-mobile)' : 'currentColor'} 
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </div>
                  <span className={`text-[11px] font-semibold ${isActive ? 'bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <defs>
              <linearGradient id="tab-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFB347' }} />
                <stop offset="100%" style={{ stopColor: '#FF6B6B' }} />
              </linearGradient>
            </defs>
          </svg>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BookShelf;

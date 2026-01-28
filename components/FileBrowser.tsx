import React, { useState, useEffect } from 'react';
import { FileItem, FileCategory } from '../types';
import { listFiles, getFileCategory, formatFileSize, formatDate, AlistFile } from '@/src/api/alist';
import { SearchIcon, GridIcon, ListIcon } from './Icons';

interface FileBrowserProps {
  path: string;
  filter?: FileCategory[];
  title?: string;
  emptyMessage?: string;
  onFileClick: (file: FileItem) => void;
  onNavigateUp: () => void;
  onNavigateTo: (path: string) => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({
  path,
  filter,
  title = '文件',
  emptyMessage = '这里还没有文件',
  onFileClick,
  onNavigateUp,
  onNavigateTo,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载文件列表
  useEffect(() => {
    loadFiles();
  }, [path]);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const alistFiles = await listFiles(path);
      
      // 转换为 FileItem 格式
      const items: FileItem[] = alistFiles.map((f: AlistFile) => ({
        name: f.name,
        path: `${path === '/' ? '' : path}/${f.name}`,
        size: f.size,
        isDir: f.is_dir,
        modified: f.modified,
        category: getFileCategory(f.name, f.is_dir),
        thumb: f.thumb,
      }));

      // 按类型过滤
      let filteredItems = items;
      if (filter && filter.length > 0) {
        filteredItems = items.filter(f => 
          f.isDir || filter.includes(f.category)
        );
      }

      // 文件夹排在前面
      filteredItems.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      // 使用 Mock 数据作为演示
      setFiles(MOCK_FILES);
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 解析面包屑路径
  const breadcrumbs = path === '/' 
    ? [{ name: '根目录', path: '/' }]
    : [
        { name: '根目录', path: '/' },
        ...path.split('/').filter(Boolean).map((segment, index, arr) => ({
          name: segment,
          path: '/' + arr.slice(0, index + 1).join('/'),
        })),
      ];

  // 获取文件图标
  const getFileIcon = (category: FileCategory) => {
    switch (category) {
      case 'folder':
        return (
          <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
      case 'ebook':
        return (
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <section className="animate-fade-in pb-32">
      {/* 顶部工具栏 */}
      <div className="sticky top-[110px] z-20 px-6 py-4 bg-slate-50/95 backdrop-blur-xl border-b border-slate-100">
        {/* 标题和搜索 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <input 
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <SearchIcon className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-x-auto hide-scrollbar">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span className="text-slate-300">/</span>}
              <button
                onClick={() => onNavigateTo(crumb.path)}
                className={`whitespace-nowrap hover:text-indigo-600 transition-colors ${
                  index === breadcrumbs.length - 1 ? 'text-slate-800 font-semibold' : ''
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 文件列表 */}
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-slate-400">加载中...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-slate-600 font-medium">连接失败</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
            <button 
              onClick={loadFiles}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              重试
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => onFileClick(file)}
                className="group flex flex-col bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all active:scale-95"
              >
                {/* 图标/缩略图 */}
                <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center mb-3 overflow-hidden">
                  {file.thumb ? (
                    <img src={file.thumb} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(file.category)
                  )}
                </div>
                
                {/* 文件名 */}
                <h3 className="text-sm font-medium text-slate-700 truncate w-full text-left group-hover:text-indigo-600 transition-colors">
                  {file.name}
                </h3>
                
                {/* 文件信息 */}
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-xs text-slate-400">
                    {file.isDir ? '文件夹' : formatFileSize(file.size)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => onFileClick(file)}
                className="group flex items-center gap-4 bg-white rounded-xl p-3 border border-slate-100 hover:shadow-sm hover:border-indigo-100 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(file.category)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {formatDate(file.modified)}
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {file.isDir ? '--' : formatFileSize(file.size)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Mock 数据 (Alist 未连接时使用)
const MOCK_FILES: FileItem[] = [
  { name: '我的图书', path: '/我的图书', size: 0, isDir: true, modified: '2024-01-15', category: 'folder' },
  { name: '电影收藏', path: '/电影收藏', size: 0, isDir: true, modified: '2024-01-14', category: 'folder' },
  { name: '代码整洁之道.pdf', path: '/代码整洁之道.pdf', size: 15728640, isDir: false, modified: '2024-01-10', category: 'document' },
  { name: '星际穿越.mkv', path: '/星际穿越.mkv', size: 4294967296, isDir: false, modified: '2024-01-08', category: 'video' },
  { name: 'React进阶.epub', path: '/React进阶.epub', size: 5242880, isDir: false, modified: '2024-01-05', category: 'ebook' },
];

export default FileBrowser;

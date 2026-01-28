import React from 'react';
import { AppEntry, RecentItem, NavTab } from './types';

// ==================== 功能入口图标 ====================

const BookIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const FilmIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

// ==================== 应用入口 ====================

export const APP_ENTRIES: AppEntry[] = [
  {
    id: 'library',
    name: '图书馆',
    icon: <BookIcon />,
    color: 'bg-gradient-to-br from-amber-400 to-orange-500',
    tab: NavTab.LIBRARY,
    description: '阅读 PDF、EPUB、Markdown 文档',
  },
  {
    id: 'cinema',
    name: '电影院',
    icon: <FilmIcon />,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    tab: NavTab.CINEMA,
    description: '观看视频，支持进度记忆',
  },
  {
    id: 'files',
    name: '文件管理',
    icon: <FolderIcon />,
    color: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    tab: NavTab.FILES,
    description: '浏览和管理网盘文件',
  },
];

// ==================== 最近访问 (Mock 数据，后续从本地存储读取) ====================

export const RECENT_ITEMS: RecentItem[] = [
  {
    id: '1',
    name: '代码整洁之道.pdf',
    path: '/Books/代码整洁之道.pdf',
    type: 'book',
    progress: 45,
    lastAccess: '2小时前',
    thumbnailUrl: 'https://picsum.photos/200/300?random=1',
  },
  {
    id: '2',
    name: '星际穿越.mkv',
    path: '/Movies/星际穿越.mkv',
    type: 'video',
    progress: 72,
    lastAccess: '昨天',
    thumbnailUrl: 'https://picsum.photos/300/200?random=2',
  },
  {
    id: '3',
    name: 'React 进阶指南.epub',
    path: '/Books/React 进阶指南.epub',
    type: 'book',
    progress: 30,
    lastAccess: '3天前',
    thumbnailUrl: 'https://picsum.photos/200/300?random=3',
  },
];

// ==================== 文件类型图标颜色 ====================

export const FILE_CATEGORY_COLORS: Record<string, string> = {
  video: 'from-purple-500 to-pink-500',
  audio: 'from-green-400 to-emerald-500',
  image: 'from-cyan-400 to-blue-500',
  document: 'from-amber-400 to-orange-500',
  ebook: 'from-rose-400 to-red-500',
  folder: 'from-indigo-400 to-purple-500',
  other: 'from-slate-400 to-slate-500',
};

// ==================== 旧的 Mock 数据 (保留兼容) ====================

import { WidgetItem, LearningItem, FileSystemItem } from './types';
import { CalculatorIcon, BookOpenIcon, AtomIcon, BrainIcon } from './components/Icons';

export const AI_WIDGETS: WidgetItem[] = [
  {
    id: '1',
    name: '计算器',
    icon: <CalculatorIcon className="w-8 h-8 text-white" />,
    color: 'bg-gradient-to-br from-orange-400 to-red-500',
    route: '/calc',
  },
];

export const LEARNING_ITEMS: LearningItem[] = [];

export const MOCK_FILES: FileSystemItem[] = [];

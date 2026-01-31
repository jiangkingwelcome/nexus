import React from 'react';

// ==================== 主题相关 ====================

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  // 文字色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // 边框
  border: string;
  borderLight: string;
  // 强调色
  accent: string;
  accentLight: string;
}

// ==================== 导航相关 ====================

export enum NavTab {
  HOME = 'home',
  LIBRARY = 'library',     // 图书馆
  CINEMA = 'cinema',       // 电影院
  FILES = 'files',         // 文件管理
  SETTINGS = 'settings'
}

// ==================== 网盘提供者 ====================

export type StorageProviderId = 'baidu' | 'aliyun' | 'local' | 'onedrive' | '115';

export interface StorageProvider {
  id: StorageProviderId;
  name: string;
  icon: string;           // emoji 或图标名
  connected: boolean;     // 是否已连接
  description?: string;
}

// ==================== 文件系统 ====================

export type FileCategory = 'video' | 'audio' | 'image' | 'document' | 'ebook' | 'folder' | 'other';

export interface FileItem {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modified: string;
  category: FileCategory;
  thumb?: string;
  rawUrl?: string;
  // 网盘来源
  provider?: StorageProviderId;
  // 百度网盘特有字段
  fs_id?: number;
  // 115网盘特有字段
  fid?: string;        // 文件/目录ID
  cid?: string;        // 父目录ID
  pick_code?: string;  // 提取码（下载用）
}

// ==================== 功能入口 ====================

export interface AppEntry {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  tab: NavTab;
  description: string;
  basePath: string;  // 该功能的根目录路径
}

// ==================== 最近访问 ====================

export interface RecentItem {
  id: string;
  name: string;
  path: string;
  type: 'book' | 'video' | 'file';
  progress: number;       // 0-100
  lastAccess: string;
  thumbnailUrl?: string;
}

// ==================== 阅读器 ====================

export interface ReaderState {
  filePath: string;
  progress: number;
  currentPage?: number;
  totalPages?: number;
  currentTime?: number;   // 视频用
  duration?: number;      // 视频用
}

// ==================== 旧类型 (兼容) ====================

export interface WidgetItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  route: string;
}

export interface LearningItem {
  id: string;
  title: string;
  type: 'Book' | 'Video' | 'Course';
  progress: number;
  total: number;
  current: number;
  unit: string;
  thumbnailUrl: string;
}

export type FileType = 'folder' | 'pdf' | 'video' | 'image' | 'app' | 'html' | 'doc' | 'book' | 'course';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  modified: string;
  thumbnailUrl?: string;
  appBadge?: string;
  path?: string;
}

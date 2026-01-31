/**
 * 文件 API - 统一接口层
 * 支持多网盘切换：百度网盘、阿里云盘、115等
 */

import type { FileCategory, StorageProviderId, StorageProvider } from '../../types';
import * as baidu from './baidu';
import * as pan115 from './115';

// ==================== 网盘提供者管理 ====================

// 当前选中的网盘
let currentProviderId: StorageProviderId = 'baidu';

// 本地存储 Key
const STORAGE_KEY_PROVIDER = 'nexus_current_provider';

// 从 localStorage 恢复
const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER);
if (savedProvider) {
  currentProviderId = savedProvider as StorageProviderId;
}

/**
 * 获取所有支持的网盘提供者
 */
export function getStorageProviders(): StorageProvider[] {
  return [
    {
      id: 'baidu',
      name: '百度网盘',
      icon: '☁️',
      connected: baidu.isLoggedIn(),
      description: '已连接百度网盘',
    },
    {
      id: 'aliyun',
      name: '阿里云盘',
      icon: '📦',
      connected: false,
      description: '敬请期待',
    },
    {
      id: '115',
      name: '115网盘',
      icon: '🗄️',
      connected: pan115.isLoggedIn(),
      description: pan115.isLoggedIn() ? '已连接115网盘' : '点击连接',
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: '💼',
      connected: false,
      description: '敬请期待',
    },
    {
      id: 'local',
      name: '本地文件',
      icon: '💻',
      connected: false, // 暂不支持
      description: '敬请期待',
    },
  ];
}

/**
 * 获取当前选中的网盘 ID
 */
export function getCurrentProviderId(): StorageProviderId {
  return currentProviderId;
}

/**
 * 获取当前选中的网盘信息
 */
export function getCurrentProvider(): StorageProvider | undefined {
  return getStorageProviders().find(p => p.id === currentProviderId);
}

/**
 * 切换网盘
 */
export function setCurrentProvider(providerId: StorageProviderId): void {
  currentProviderId = providerId;
  localStorage.setItem(STORAGE_KEY_PROVIDER, providerId);
  console.log('📁 切换网盘到:', providerId);
}

/**
 * 检查指定网盘是否已连接
 */
export function isProviderConnected(providerId: StorageProviderId): boolean {
  switch (providerId) {
    case 'baidu':
      return baidu.isLoggedIn();
    case '115':
      return pan115.isLoggedIn();
    default:
      return false;
  }
}

// ==================== 文件列表接口 ====================

export interface FileListItem {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  thumb?: string;
  // 百度网盘特有字段
  fs_id?: number;
  path?: string;
  // 115网盘特有字段
  fid?: string;        // 文件ID
  pick_code?: string;  // 提取码（用于下载）
  cid?: string;        // 父目录ID
  // 网盘来源
  provider?: StorageProviderId;
}

/** 列目录 */
export async function listFiles(path: string = '/', cid?: string): Promise<FileListItem[]> {
  console.log('📂 listFiles 调用:', { path, cid, provider: currentProviderId });

  // 根据当前网盘调用不同的 API
  switch (currentProviderId) {
    case 'baidu':
      return listFilesBaidu(path);
    case '115':
      return listFiles115(cid || '0');
    case 'aliyun':
    case 'onedrive':
    case 'local':
    default:
      console.warn(`⚠️ 网盘 ${currentProviderId} 暂不支持`);
      return [];
  }
}

/** 百度网盘列目录 */
async function listFilesBaidu(path: string): Promise<FileListItem[]> {
  const loggedIn = baidu.isLoggedIn();
  
  if (!loggedIn) {
    console.warn('⚠️ 百度网盘未登录，返回空列表');
    return [];
  }

  try {
    console.log('🔄 正在请求百度网盘文件列表...');
    const files = await baidu.listFiles(path);
    console.log('✅ 获取到文件:', files.length, '个');
    return files.map((f) => ({
      name: f.server_filename,
      size: f.size,
      is_dir: f.isdir === 1,
      modified: baidu.formatDate(f.server_mtime),
      thumb: f.thumbs?.url3 || f.thumbs?.url2 || f.thumbs?.url1,
      fs_id: f.fs_id,
      path: f.path,
      provider: 'baidu' as StorageProviderId,
    }));
  } catch (error) {
    console.error('❌ 获取文件列表失败:', error);
    return [];
  }
}

/** 115网盘列目录 */
async function listFiles115(cid: string): Promise<FileListItem[]> {
  const loggedIn = pan115.isLoggedIn();
  
  if (!loggedIn) {
    console.warn('⚠️ 115网盘未登录，返回空列表');
    return [];
  }

  try {
    console.log('🔄 正在请求115网盘文件列表...');
    const files = await pan115.listFiles(cid);
    console.log('✅ 获取到文件:', files.length, '个');
    // 打印原始数据以便调试
    if (files.length > 0) {
      console.log('📋 115原始文件数据示例:', files[0]);
    }
    return files.map((f: any) => ({
      name: f.fn || f.n || f.name || '未知文件',  // fn是115实际返回的字段名
      size: f.s || f.size || 0,
      is_dir: pan115.isDirectory(f),
      modified: pan115.formatDate(f.te || f.tp || f.t),
      thumb: f.u || undefined,
      // 115特有字段
      fid: f.fid || f.cid,
      pick_code: f.pc,
      cid: f.cid,
      pid: f.pid,  // 父目录ID
      provider: '115' as StorageProviderId,
    }));
  } catch (error) {
    console.error('❌ 获取115文件列表失败:', error);
    return [];
  }
}

/** 获取文件下载 URL */
export async function getFileUrl(
  path: string, 
  options?: { fsId?: number; pickCode?: string }
): Promise<string> {
  const { fsId, pickCode } = options || {};

  switch (currentProviderId) {
    case 'baidu':
      return getFileUrlBaidu(path, fsId);
    case '115':
      return getFileUrl115(pickCode);
    default:
      throw new Error(`网盘 ${currentProviderId} 暂不支持下载`);
  }
}

/** 百度网盘获取下载链接 */
async function getFileUrlBaidu(path: string, fsId?: number): Promise<string> {
  if (!baidu.isLoggedIn()) {
    throw new Error('请先连接百度网盘');
  }

  if (!fsId) {
    // 如果没有 fsId，需要先获取文件信息
    const files = await baidu.listFiles(path.substring(0, path.lastIndexOf('/')));
    const fileName = path.split('/').pop();
    const file = files.find((f) => f.server_filename === fileName);
    if (!file) {
      throw new Error('文件不存在');
    }
    fsId = file.fs_id;
  }

  return baidu.getDownloadUrl(fsId);
}

/** 115网盘获取下载链接 */
async function getFileUrl115(pickCode?: string): Promise<string> {
  if (!pan115.isLoggedIn()) {
    throw new Error('请先连接115网盘');
  }

  if (!pickCode) {
    throw new Error('缺少 pick_code 参数');
  }

  return pan115.getDownloadUrl(pickCode);
}

/** 获取代理下载 URL */
export async function getProxyUrl(
  path: string, 
  options?: { fsId?: number; pickCode?: string }
): Promise<string> {
  return getFileUrl(path, options);
}

/** 获取预览页 URL（暂不支持） */
export function getPreviewUrl(_path: string): string {
  return '';
}

/** 根据文件名判断文件类型 */
export function getFileCategory(filename: string, isDir: boolean): FileCategory {
  if (isDir) return 'folder';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const categoryMap: Record<string, FileCategory> = {
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video',
    mp3: 'audio', flac: 'audio', wav: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document', md: 'document',
    epub: 'ebook', mobi: 'ebook', azw3: 'ebook',
  };
  return categoryMap[ext] || 'other';
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/** 格式化日期 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

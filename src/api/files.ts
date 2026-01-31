/**
 * 文件 API - 统一接口层
 * 当前实现：百度网盘
 * 后续可扩展：阿里云盘、115 等
 */

import type { FileCategory } from '../../types';
import * as baidu from './baidu';

export interface FileListItem {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  thumb?: string;
  // 百度网盘特有字段
  fs_id?: number;
  path?: string;
}

/** 列目录 */
export async function listFiles(path: string = '/'): Promise<FileListItem[]> {
  // 检查是否已连接百度网盘
  if (!baidu.isLoggedIn()) {
    return [];
  }

  try {
    const files = await baidu.listFiles(path);
    return files.map((f) => ({
      name: f.server_filename,
      size: f.size,
      is_dir: f.isdir === 1,
      modified: baidu.formatDate(f.server_mtime),
      thumb: f.thumbs?.url3 || f.thumbs?.url2 || f.thumbs?.url1,
      fs_id: f.fs_id,
      path: f.path,
    }));
  } catch (error) {
    console.error('获取文件列表失败:', error);
    return [];
  }
}

/** 获取文件下载 URL */
export async function getFileUrl(path: string, fsId?: number): Promise<string> {
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

/** 获取代理下载 URL（百度网盘使用 dlink） */
export async function getProxyUrl(path: string, fsId?: number): Promise<string> {
  return getFileUrl(path, fsId);
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

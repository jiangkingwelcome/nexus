/**
 * Alist API 客户端
 * 文档: https://alist.nn.ci/guide/api/
 */

// Alist 服务器配置
// 开发环境使用代理（避免 CORS），生产环境直接访问
const isDev = import.meta.env.DEV;
const ALIST_CONFIG = {
  baseUrl: isDev ? '' : (import.meta.env.VITE_ALIST_URL || 'http://localhost:5244'),
  remoteUrl: import.meta.env.VITE_ALIST_URL || 'https://jiangking.v3cu.com:3004',
  token: import.meta.env.VITE_ALIST_TOKEN || '', // 优先使用环境变量中的 Token
};

// Token 存储 Key
const TOKEN_KEY = 'alist_token';

// 初始化：如果环境变量有 Token，保存到本地
if (ALIST_CONFIG.token) {
  localStorage.setItem(TOKEN_KEY, ALIST_CONFIG.token);
}

// ==================== 认证相关 ====================

export interface AlistLoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
  };
}

export interface AlistUserInfo {
  code: number;
  message: string;
  data: {
    id: number;
    username: string;
    role: number;
    base_path: string;
    permission: number;
  };
}

/**
 * 从本地存储加载 Token
 */
export function loadToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    ALIST_CONFIG.token = token;
  }
  return token;
}

/**
 * 保存 Token 到本地存储
 */
export function saveToken(token: string): void {
  ALIST_CONFIG.token = token;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 清除 Token
 */
export function clearToken(): void {
  ALIST_CONFIG.token = '';
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 用户登录
 */
export async function login(username: string, password: string): Promise<string> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data: AlistLoginResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(data.message || '登录失败');
    }

    // 保存 Token
    saveToken(data.data.token);
    return data.data.token;
  } catch (error) {
    console.error('Alist login error:', error);
    throw error;
  }
}

/**
 * 获取当前用户信息 (用于验证 Token 是否有效)
 */
export async function getCurrentUser(): Promise<AlistUserInfo['data'] | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data: AlistUserInfo = await response.json();
    
    if (data.code !== 200) {
      return null;
    }

    return data.data;
  } catch (error) {
    return null;
  }
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  loadToken();
  if (!ALIST_CONFIG.token) {
    return false;
  }
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 登出
 */
export function logout(): void {
  clearToken();
}

// 文件类型定义
export interface AlistFile {
  name: string;
  size: number;
  is_dir: boolean;
  modified: string;
  sign: string;
  thumb: string;
  type: number;
  raw_url?: string;
}

export interface AlistListResponse {
  code: number;
  message: string;
  data: {
    content: AlistFile[] | null;
    total: number;
    readme: string;
    write: boolean;
    provider: string;
  };
}

export interface AlistGetResponse {
  code: number;
  message: string;
  data: {
    name: string;
    size: number;
    is_dir: boolean;
    modified: string;
    sign: string;
    thumb: string;
    type: number;
    raw_url: string;
    readme: string;
    provider: string;
    related: AlistFile[] | null;
  };
}

// 创建请求头
function getHeaders(): HeadersInit {
  // 确保 Token 已加载
  if (!ALIST_CONFIG.token) {
    loadToken();
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (ALIST_CONFIG.token) {
    headers['Authorization'] = ALIST_CONFIG.token;
  }
  return headers;
}

/**
 * 设置 Alist 服务器地址
 */
export function setBaseUrl(url: string): void {
  ALIST_CONFIG.baseUrl = url;
  localStorage.setItem('alist_url', url);
}

/**
 * 获取 Alist 服务器地址
 * 开发环境返回空字符串（使用 Vite 代理）
 */
export function getBaseUrl(): string {
  if (isDev) {
    return ''; // 开发环境使用代理
  }
  const saved = localStorage.getItem('alist_url');
  if (saved) {
    ALIST_CONFIG.baseUrl = saved;
  }
  return ALIST_CONFIG.baseUrl;
}

/**
 * 获取目录列表
 */
export async function listFiles(path: string = '/'): Promise<AlistFile[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/fs/list`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        path,
        password: '',
        page: 1,
        per_page: 0, // 0 表示获取全部
        refresh: false,
      }),
    });

    const data: AlistListResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(data.message || '获取文件列表失败');
    }

    return data.data.content || [];
  } catch (error) {
    console.error('Alist listFiles error:', error);
    throw error;
  }
}

/**
 * 获取文件详情和直链
 */
export async function getFileInfo(path: string): Promise<AlistGetResponse['data']> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/fs/get`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        path,
        password: '',
      }),
    });

    const data: AlistGetResponse = await response.json();
    
    if (data.code !== 200) {
      throw new Error(data.message || '获取文件信息失败');
    }

    return data.data;
  } catch (error) {
    console.error('Alist getFileInfo error:', error);
    throw error;
  }
}

/**
 * 获取文件直链 URL
 * 对于需要授权的存储（如百度网盘），使用 Alist 代理下载
 */
export async function getFileUrl(path: string, useProxy: boolean = true): Promise<string> {
  // 获取文件信息（包含 sign）
  const fileInfo = await getFileInfo(path);
  
  if (useProxy) {
    // 使用 Alist 代理下载（更可靠，支持百度网盘等需要授权的存储）
    const baseUrl = getBaseUrl();
    // 编码路径，但保留斜杠
    const encodedPath = path.split('/').map(p => encodeURIComponent(p)).join('/');
    // 如果有签名，添加 sign 参数
    const signParam = fileInfo.sign ? `?sign=${fileInfo.sign}` : '';
    return `${baseUrl}/d${encodedPath}${signParam}`;
  }
  
  // 直接获取 raw_url（某些存储可能不支持）
  return fileInfo.raw_url;
}

/**
 * 获取文件代理下载 URL（用于读取文件内容）
 * 对于百度网盘等需要授权的存储，使用 /d/ 代理下载
 */
export async function getProxyUrl(path: string): Promise<string> {
  const fileInfo = await getFileInfo(path);
  const baseUrl = getBaseUrl();
  const encodedPath = path.split('/').map(p => encodeURIComponent(p)).join('/');
  const signParam = fileInfo.sign ? `?sign=${fileInfo.sign}` : '';
  // 使用 /d/ 路径代理下载（支持百度网盘）
  return `${baseUrl}/d${encodedPath}${signParam}`;
}

/**
 * 获取 Alist 预览页面 URL（用于嵌入 iframe）
 */
export function getPreviewUrl(path: string): string {
  // 使用远程 URL（Alist 自带的预览界面）
  const remoteUrl = ALIST_CONFIG.remoteUrl;
  const encodedPath = path.split('/').map(p => encodeURIComponent(p)).join('/');
  return `${remoteUrl}${encodedPath}`;
}

/**
 * 根据文件名判断文件类型
 */
export type FileCategory = 'video' | 'audio' | 'image' | 'document' | 'ebook' | 'folder' | 'other';

export function getFileCategory(filename: string, isDir: boolean): FileCategory {
  if (isDir) return 'folder';
  
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const categoryMap: Record<string, FileCategory> = {
    // 视频
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video',
    // 音频
    mp3: 'audio', flac: 'audio', wav: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio',
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
    // 文档
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document', md: 'document',
    // 电子书
    epub: 'ebook', mobi: 'ebook', azw3: 'ebook',
  };

  return categoryMap[ext] || 'other';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '--';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default {
  // 认证
  login,
  logout,
  isLoggedIn,
  getCurrentUser,
  loadToken,
  saveToken,
  clearToken,
  setBaseUrl,
  getBaseUrl,
  // 文件操作
  listFiles,
  getFileInfo,
  getFileUrl,
  getFileCategory,
  formatFileSize,
  formatDate,
};

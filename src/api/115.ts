/**
 * 115网盘 API 客户端
 * 基于官方 Open API
 * 文档: https://www.yuque.com/115yun/open/
 */

// ==================== 配置 ====================

// API 基础地址（通过 Vite 代理解决 CORS）
const API_BASE = {
  qrcode: '/115-qrcode',  // 代理到 https://qrcodeapi.115.com
  api: '/115-api',        // 代理到 https://proapi.115.com
};

// 从环境变量读取配置
const CONFIG_115 = {
  // 预置的 refresh_token（从环境变量加载）
  refreshToken: import.meta.env.VITE_115_REFRESH_TOKEN || '',
  // 预置的 access_token（可选，直接使用无需刷新）
  accessToken: import.meta.env.VITE_115_ACCESS_TOKEN || '',
};

// 本地存储 Key
const STORAGE_KEYS = {
  accessToken: '115_access_token',
  refreshToken: '115_refresh_token',
  expiresAt: '115_expires_at',
  userInfo: '115_user_info',
};

// ==================== 类型定义 ====================

export interface Tokens115 {
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒，通常是 7200
}

export interface UserInfo115 {
  user_id: number;
  user_name: string;
  face: string;      // 头像URL
  vip: number;       // VIP等级
}

export interface File115 {
  fid: string;       // 文件ID (字符串形式的大整数)
  uid: number;       // 用户ID
  aid: number;       // 区域ID
  cid: string;       // 目录ID (目录自身的ID)
  pid: string;       // 父目录ID
  fn: string;        // 文件名 (115 Open API 实际字段)
  n?: string;        // 文件名 (备选字段)
  name?: string;     // 文件名 (备选字段)
  s: number;         // 文件大小
  size?: number;     // 文件大小 (备选字段)
  fc: number;        // 子文件数量（目录用）
  t?: string;        // 时间 (备选字段)
  sta: number;       // 状态
  pt: string;        // 创建时间
  te: string;        // 修改时间
  tp: string;        // 上传时间
  d: number;         // 是否被删除
  m: number;         // 是否标记
  issct: number;     // 快捷方式
  sha: string;       // SHA1
  pc: string;        // pick_code 提取码
  fl: Array<{id: number; name: string}>; // 标签
  u: string;         // 缩略图URL
  ico: string;       // 图标
  class: string;     // 分类
  c: number;         // 子项数量（目录）
  fc: number;        // 文件数量
  ns: number;        // 名称排序
}

export interface ListResponse115 {
  state: boolean;
  errno?: number;
  error?: string;
  path: Array<{cid: string; name: string; pid: string}>;
  data: File115[];
  count: number;
  cid: string;
  order: string;
  is_asc: number;
  folder_count?: number;
  file_count?: number;
}

export interface DownloadResponse115 {
  state: boolean;
  errno?: number;
  error?: string;
  data: {
    [fid: string]: {
      pick_code: string;
      file_name: string;
      file_size: string;
      sha1: string;
      url: { url: string } | false;
    }
  };
}

// ==================== Token 管理 ====================

/**
 * 保存 Token 到本地存储
 */
export function saveTokens(tokens: Tokens115): void {
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
  localStorage.setItem(STORAGE_KEYS.expiresAt, expiresAt.toString());
}

/**
 * 从本地存储加载 Token
 */
export function loadTokens(): { accessToken: string | null; refreshToken: string | null; expiresAt: number } {
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
    expiresAt: parseInt(localStorage.getItem(STORAGE_KEYS.expiresAt) || '0', 10),
  };
}

/**
 * 清除所有 Token
 */
export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
  localStorage.removeItem(STORAGE_KEYS.userInfo);
}

/**
 * 检查 Token 是否快过期（提前 10 分钟刷新，因为115的token有效期只有2小时）
 */
function isTokenExpiringSoon(): boolean {
  const { expiresAt } = loadTokens();
  const buffer = 10 * 60 * 1000; // 10 分钟
  return Date.now() > expiresAt - buffer;
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  const { refreshToken, accessToken } = loadTokens();
  return !!(refreshToken || accessToken);
}

// ==================== OAuth 授权流程 ====================

/**
 * 使用 refresh_token 刷新 access_token
 * 注意：115的refresh_token是一次性的，刷新后会获得新的refresh_token
 */
export async function refreshAccessToken(): Promise<Tokens115> {
  const { refreshToken } = loadTokens();

  if (!refreshToken) {
    throw new Error('没有 refresh_token，请重新授权');
  }

  const response = await fetch(`${API_BASE.qrcode}/open/refreshToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `refresh_token=${encodeURIComponent(refreshToken)}`,
  });

  const data = await response.json();

  if (!data.state) {
    // 常见错误码
    // 40140116: refresh_token 无效（已解除授权）
    // 40140117: access_token 刷新太频繁
    // 40140119: refresh_token 已过期
    if (data.errno === 40140116 || data.errno === 40140119) {
      clearTokens();
      throw new Error('授权已过期，请重新连接115网盘');
    }
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  const tokens: Tokens115 = {
    access_token: data.data.access_token,
    refresh_token: data.data.refresh_token,
    expires_in: data.data.expires_in || 7200,
  };

  saveTokens(tokens);
  return tokens;
}

/**
 * 确保有有效的 access_token（自动刷新）
 */
async function ensureValidToken(): Promise<string> {
  const { accessToken, refreshToken } = loadTokens();

  // 如果有有效的 access_token 且未过期，直接使用
  if (accessToken && !isTokenExpiringSoon()) {
    return accessToken;
  }

  // 如果没有 refresh_token，无法刷新
  if (!refreshToken) {
    if (accessToken) {
      console.warn('⚠️ 115 access_token 可能快过期，但没有 refresh_token 无法刷新');
      return accessToken;
    }
    throw new Error('请先连接115网盘');
  }

  // 尝试刷新 token
  try {
    console.log('🔄 115网盘 Token 即将过期，自动刷新中...');
    const newTokens = await refreshAccessToken();
    return newTokens.access_token;
  } catch (error) {
    if (accessToken) {
      console.warn('⚠️ 刷新 token 失败，使用现有 access_token:', error);
      return accessToken;
    }
    throw error;
  }
}

/**
 * 获取带授权头的请求选项
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await ensureValidToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
}

// ==================== 用户信息 ====================

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<UserInfo115> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE.api}/open/user/info`, {
    headers,
  });

  const data = await response.json();

  if (!data.state) {
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  const userInfo: UserInfo115 = {
    user_id: data.data.user_id,
    user_name: data.data.user_name,
    face: data.data.face,
    vip: data.data.vip,
  };

  // 缓存用户信息
  localStorage.setItem(STORAGE_KEYS.userInfo, JSON.stringify(userInfo));

  return userInfo;
}

/**
 * 获取缓存的用户信息
 */
export function getCachedUserInfo(): UserInfo115 | null {
  const cached = localStorage.getItem(STORAGE_KEYS.userInfo);
  return cached ? JSON.parse(cached) : null;
}

// ==================== 文件操作 ====================

/**
 * 获取文件列表
 * @param cid 目录ID，0为根目录
 * @param offset 分页偏移
 * @param limit 每页数量
 */
export async function listFiles(
  cid: string | number = '0',
  offset: number = 0,
  limit: number = 1000
): Promise<File115[]> {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams({
    cid: String(cid),
    offset: String(offset),
    limit: String(limit),
    aid: '1',
    show_dir: '1',
    count_folders: '1',
    record_open_time: '1',
  });

  console.log('🔍 115 API 请求:', `${API_BASE.api}/open/ufile/files?${params.toString()}`);
  
  const response = await fetch(`${API_BASE.api}/open/ufile/files?${params.toString()}`, {
    headers,
  });

  const data = await response.json();
  console.log('📦 115 API 原始响应:', data);

  if (!data.state) {
    console.error('❌ 115 API 错误:', data);
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  console.log('✅ 115 文件列表:', data.data?.length || 0, '个文件');
  return data.data || [];
}

/**
 * 获取文件下载链接
 * @param pickCode 文件的 pick_code
 */
export async function getDownloadUrl(pickCode: string): Promise<string> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE.api}/open/ufile/downurl`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `pick_code=${encodeURIComponent(pickCode)}`,
  });

  const data: DownloadResponse115 = await response.json();

  if (!data.state) {
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  // 获取第一个文件的下载链接
  const fileData = Object.values(data.data)[0];
  if (!fileData || !fileData.url || fileData.url === false) {
    throw new Error('获取下载链接失败，可能是目录');
  }

  return fileData.url.url;
}

/**
 * 获取文件/目录详情
 * @param fileId 文件或目录ID
 */
export async function getFileInfo(fileId: string | number): Promise<any> {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams({
    file_id: String(fileId),
  });

  const response = await fetch(`${API_BASE.api}/open/folder/get_info?${params.toString()}`, {
    headers,
  });

  const data = await response.json();

  if (!data.state) {
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  return data.data;
}

/**
 * 搜索文件
 * @param keyword 搜索关键词
 * @param cid 在哪个目录下搜索，0为全盘
 */
export async function searchFiles(
  keyword: string,
  cid: string | number = '0',
  offset: number = 0,
  limit: number = 100
): Promise<File115[]> {
  const headers = await getAuthHeaders();

  const params = new URLSearchParams({
    search_value: keyword,
    cid: String(cid),
    offset: String(offset),
    limit: String(limit),
    aid: '1',
  });

  const response = await fetch(`${API_BASE.api}/open/ufile/search?${params.toString()}`, {
    headers,
  });

  const data = await response.json();

  if (!data.state) {
    throw new Error(data.error || `115 API 错误: ${data.errno}`);
  }

  return data.data || [];
}

// ==================== 工具函数 ====================

/**
 * 判断是否为目录
 */
export function isDirectory(file: any): boolean {
  // 115的文件对象中，目录有 fc 字段（子文件数），文件则没有或有 sha/pc
  // 目录: 有 fc 字段，没有 sha 字段
  // 文件: 有 sha 字段
  if (file.sha) return false;  // 有SHA说明是文件
  if (file.fc !== undefined) return true;  // 有fc说明是目录
  if (file.ico === 'folder') return true;
  return false;
}

/**
 * 判断文件类型
 */
export type FileCategory115 = 'video' | 'audio' | 'image' | 'document' | 'ebook' | 'folder' | 'other';

export function getFileCategory(file: File115): FileCategory115 {
  if (isDirectory(file)) return 'folder';

  const ext = file.n.split('.').pop()?.toLowerCase() || '';

  const extMap: Record<string, FileCategory115> = {
    // 视频
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', 
    flv: 'video', webm: 'video', m4v: 'video', rmvb: 'video', rm: 'video',
    // 音频
    mp3: 'audio', flac: 'audio', wav: 'audio', aac: 'audio', ogg: 'audio', 
    m4a: 'audio', ape: 'audio', wma: 'audio',
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', 
    svg: 'image', bmp: 'image', tiff: 'image',
    // 文档
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document', 
    md: 'document', xls: 'document', xlsx: 'document', ppt: 'document', pptx: 'document',
    // 电子书
    epub: 'ebook', mobi: 'ebook', azw3: 'ebook', azw: 'ebook',
  };

  return extMap[ext] || 'other';
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
 * 格式化时间戳
 */
export function formatDate(timestamp: string | undefined): string {
  if (!timestamp) {
    return '-';
  }
  // 115返回的时间格式是 "YYYY-MM-DD HH:MM:SS" 或 unix timestamp
  const date = timestamp.includes('-') 
    ? new Date(timestamp) 
    : new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ==================== 配置管理 ====================

/**
 * 手动设置 refresh_token
 */
export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  // 清除旧的 access_token，强制下次使用时刷新
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

/**
 * 手动设置 access_token（同时设置过期时间）
 */
export function setAccessToken(accessToken: string, expiresIn: number = 7200): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.expiresAt, expiresAt.toString());
}

/**
 * 初始化：智能加载 token
 * 
 * 策略：
 * 1. 优先使用 localStorage 中的 token（可能是刷新后的新 token）
 * 2. 只有当 localStorage 为空时，才从环境变量加载初始 token
 * 3. 这样可以确保自动刷新后的 token 不会被环境变量覆盖
 */
function initializeFromEnv(): void {
  console.log('🚀 115网盘 API 初始化...');
  
  const { refreshToken: localRefresh, accessToken: localAccess } = loadTokens();
  
  console.log('   本地存储 refresh_token:', localRefresh ? '已存在' : '无');
  console.log('   本地存储 access_token:', localAccess ? '已存在' : '无');
  console.log('   环境变量 refresh_token:', CONFIG_115.refreshToken ? '已配置' : '未配置');

  // 只有当本地没有 token 时，才从环境变量导入
  // 这样可以保护自动刷新后的新 token 不被覆盖
  if (!localRefresh && !localAccess) {
    if (CONFIG_115.refreshToken) {
      console.log('🔧 首次从环境变量导入115网盘 refresh_token');
      setRefreshToken(CONFIG_115.refreshToken);
    }
    if (CONFIG_115.accessToken) {
      console.log('🔧 首次从环境变量导入115网盘 access_token');
      setAccessToken(CONFIG_115.accessToken, 7200);
    }
  } else {
    console.log('✅ 使用本地存储的 token（可能是刷新后的新 token）');
  }

  const { refreshToken, accessToken } = loadTokens();
  console.log('   登录状态:', (refreshToken || accessToken) ? '已登录' : '未登录');
}

// 初始化
initializeFromEnv();

// ==================== 导出 ====================

export default {
  // Token 管理
  isLoggedIn,
  clearTokens,
  refreshAccessToken,
  setRefreshToken,
  setAccessToken,
  // 用户
  getUserInfo,
  getCachedUserInfo,
  // 文件
  listFiles,
  getDownloadUrl,
  getFileInfo,
  searchFiles,
  // 工具
  isDirectory,
  getFileCategory,
  formatFileSize,
  formatDate,
};

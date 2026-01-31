/**
 * 百度网盘 API 客户端
 * 基于官方 OAuth 2.0 开放平台 API
 * 文档: https://pan.baidu.com/union/doc/
 */

// ==================== 配置 ====================

// API 基础地址（通过 Vite 代理解决 CORS）
const API_BASE = {
  oauth: '/baidu-oauth',  // 代理到 https://openapi.baidu.com
  pan: '/baidu-pan',      // 代理到 https://pan.baidu.com
};

// 从环境变量读取，或在设置页配置
const BAIDU_CONFIG = {
  appKey: import.meta.env.VITE_BAIDU_APP_KEY || '',
  secretKey: import.meta.env.VITE_BAIDU_SECRET_KEY || '',
  // 回调地址（需与百度开放平台设置一致）
  redirectUri: import.meta.env.VITE_BAIDU_REDIRECT_URI || `${window.location.origin}/baidu/callback`,
  // 预置的 refresh_token（从环境变量加载，免去授权流程）
  refreshToken: import.meta.env.VITE_BAIDU_REFRESH_TOKEN || '',
};

// 本地存储 Key
const STORAGE_KEYS = {
  accessToken: 'baidu_access_token',
  refreshToken: 'baidu_refresh_token',
  expiresAt: 'baidu_expires_at',
  userInfo: 'baidu_user_info',
};

// ==================== 类型定义 ====================

export interface BaiduTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // 秒
  scope: string;
}

export interface BaiduUserInfo {
  baidu_name: string;
  netdisk_name: string;
  avatar_url: string;
  vip_type: number;
  uk: number;
}

export interface BaiduFile {
  fs_id: number;
  path: string;
  server_filename: string;
  size: number;
  isdir: number;
  category: number;
  server_mtime: number;
  server_ctime: number;
  thumbs?: {
    url1?: string;
    url2?: string;
    url3?: string;
  };
  dlink?: string;
}

export interface BaiduListResponse {
  errno: number;
  errmsg?: string;
  list: BaiduFile[];
  has_more: number;
  cursor: number;
}

export interface BaiduFileMetaResponse {
  errno: number;
  errmsg?: string;
  list: BaiduFile[];
}

// ==================== Token 管理 ====================

/**
 * 保存 Token 到本地存储
 */
export function saveTokens(tokens: BaiduTokens): void {
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
 * 检查 Token 是否快过期（提前 1 小时刷新）
 */
function isTokenExpiringSoon(): boolean {
  const { expiresAt } = loadTokens();
  const buffer = 60 * 60 * 1000; // 1 小时
  return Date.now() > expiresAt - buffer;
}

/**
 * 检查是否已登录（有有效的 refresh_token）
 */
export function isLoggedIn(): boolean {
  const { refreshToken } = loadTokens();
  return !!refreshToken;
}

// ==================== OAuth 授权流程 ====================

/**
 * 获取授权 URL（用户点击后跳转百度授权页面）
 */
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: BAIDU_CONFIG.appKey,
    redirect_uri: BAIDU_CONFIG.redirectUri,
    scope: 'basic,netdisk',
    display: 'popup',
    qrcode: '1',
    force_login: '0',
  });
  return `https://openapi.baidu.com/oauth/2.0/authorize?${params.toString()}`;
}

/**
 * 用授权码换取 Token
 */
export async function exchangeCodeForTokens(code: string): Promise<BaiduTokens> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: BAIDU_CONFIG.appKey,
    client_secret: BAIDU_CONFIG.secretKey,
    redirect_uri: BAIDU_CONFIG.redirectUri,
  });

  const response = await fetch(`${API_BASE.oauth}/oauth/2.0/token?${params.toString()}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  saveTokens(data);
  return data;
}

/**
 * 使用 refresh_token 刷新 access_token
 */
export async function refreshAccessToken(): Promise<BaiduTokens> {
  const { refreshToken } = loadTokens();

  if (!refreshToken) {
    throw new Error('没有 refresh_token，请重新授权');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: BAIDU_CONFIG.appKey,
    client_secret: BAIDU_CONFIG.secretKey,
  });

  const response = await fetch(`${API_BASE.oauth}/oauth/2.0/token?${params.toString()}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (data.error) {
    // refresh_token 失效，需要重新授权
    if (data.error === 'expired_token' || data.error === 'invalid_grant') {
      clearTokens();
      throw new Error('授权已过期，请重新连接百度网盘');
    }
    throw new Error(data.error_description || data.error);
  }

  saveTokens(data);
  return data;
}

/**
 * 确保有有效的 access_token（自动刷新）
 */
async function ensureValidToken(): Promise<string> {
  const { accessToken, refreshToken } = loadTokens();

  if (!refreshToken) {
    throw new Error('请先连接百度网盘');
  }

  if (!accessToken || isTokenExpiringSoon()) {
    console.log('🔄 百度网盘 Token 即将过期，自动刷新中...');
    const newTokens = await refreshAccessToken();
    return newTokens.access_token;
  }

  return accessToken;
}

// ==================== 用户信息 ====================

/**
 * 获取用户信息
 */
export async function getUserInfo(): Promise<BaiduUserInfo> {
  const accessToken = await ensureValidToken();

  const response = await fetch(
    `${API_BASE.pan}/rest/2.0/xpan/nas?method=uinfo&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.errno !== 0) {
    throw new Error(data.errmsg || `百度 API 错误: ${data.errno}`);
  }

  // 缓存用户信息
  localStorage.setItem(STORAGE_KEYS.userInfo, JSON.stringify(data));

  return data;
}

/**
 * 获取缓存的用户信息
 */
export function getCachedUserInfo(): BaiduUserInfo | null {
  const cached = localStorage.getItem(STORAGE_KEYS.userInfo);
  return cached ? JSON.parse(cached) : null;
}

// ==================== 文件操作 ====================

/**
 * 获取文件列表
 */
export async function listFiles(dir: string = '/'): Promise<BaiduFile[]> {
  const accessToken = await ensureValidToken();

  const params = new URLSearchParams({
    method: 'list',
    access_token: accessToken,
    dir,
    order: 'name',
    desc: '0',
    start: '0',
    limit: '1000',
    web: 'web',
    folder: '0',
    showempty: '1',
  });

  const response = await fetch(`${API_BASE.pan}/rest/2.0/xpan/file?${params.toString()}`);
  const data: BaiduListResponse = await response.json();

  if (data.errno !== 0) {
    throw new Error(data.errmsg || `百度 API 错误: ${data.errno}`);
  }

  return data.list || [];
}

/**
 * 获取文件元信息（含下载链接）
 */
export async function getFileMeta(fsIds: number[]): Promise<BaiduFile[]> {
  const accessToken = await ensureValidToken();

  const params = new URLSearchParams({
    method: 'filemetas',
    access_token: accessToken,
    fsids: JSON.stringify(fsIds),
    dlink: '1', // 请求下载链接
    thumb: '1', // 请求缩略图
  });

  const response = await fetch(`${API_BASE.pan}/rest/2.0/xpan/multimedia?${params.toString()}`);
  const data: BaiduFileMetaResponse = await response.json();

  if (data.errno !== 0) {
    throw new Error(data.errmsg || `百度 API 错误: ${data.errno}`);
  }

  return data.list || [];
}

/**
 * 获取文件下载链接
 * 注意：dlink 有时效性（约 8 小时），且需要在请求时带上 access_token
 */
export async function getDownloadUrl(fsId: number): Promise<string> {
  const accessToken = await ensureValidToken();
  const metas = await getFileMeta([fsId]);

  if (metas.length === 0 || !metas[0].dlink) {
    throw new Error('获取下载链接失败');
  }

  // dlink 需要附加 access_token 才能下载
  return `${metas[0].dlink}&access_token=${accessToken}`;
}

/**
 * 搜索文件
 */
export async function searchFiles(keyword: string, dir: string = '/'): Promise<BaiduFile[]> {
  const accessToken = await ensureValidToken();

  const params = new URLSearchParams({
    method: 'search',
    access_token: accessToken,
    key: keyword,
    dir,
    recursion: '1', // 递归搜索
    web: '1',
  });

  const response = await fetch(`${API_BASE.pan}/rest/2.0/xpan/file?${params.toString()}`);
  const data: BaiduListResponse = await response.json();

  if (data.errno !== 0) {
    throw new Error(data.errmsg || `百度 API 错误: ${data.errno}`);
  }

  return data.list || [];
}

// ==================== 容量信息 ====================

export interface BaiduQuota {
  total: number;  // 总容量（字节）
  used: number;   // 已用（字节）
  free: number;   // 可用（字节）
}

/**
 * 获取网盘容量
 */
export async function getQuota(): Promise<BaiduQuota> {
  const accessToken = await ensureValidToken();

  const params = new URLSearchParams({
    method: 'quota',
    access_token: accessToken,
    checkfree: '1',
    checkexpire: '1',
  });

  const response = await fetch(`${API_BASE.pan}/api/quota?${params.toString()}`);
  const data = await response.json();

  if (data.errno !== 0) {
    throw new Error(data.errmsg || `百度 API 错误: ${data.errno}`);
  }

  return {
    total: data.total,
    used: data.used,
    free: data.total - data.used,
  };
}

// ==================== 工具函数 ====================

/**
 * 根据百度文件 category 判断文件类型
 * 1-视频 2-音频 3-图片 4-文档 5-应用 6-其他 7-种子
 */
export type FileCategory = 'video' | 'audio' | 'image' | 'document' | 'ebook' | 'folder' | 'other';

export function getFileCategory(file: BaiduFile): FileCategory {
  if (file.isdir === 1) return 'folder';

  const ext = file.server_filename.split('.').pop()?.toLowerCase() || '';

  // 先按扩展名判断
  const extMap: Record<string, FileCategory> = {
    // 视频
    mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', wmv: 'video', flv: 'video', webm: 'video', m4v: 'video',
    // 音频
    mp3: 'audio', flac: 'audio', wav: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio',
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image',
    // 文档
    pdf: 'document', doc: 'document', docx: 'document', txt: 'document', md: 'document',
    // 电子书
    epub: 'ebook', mobi: 'ebook', azw3: 'ebook',
  };

  if (extMap[ext]) return extMap[ext];

  // 再按百度 category 判断
  switch (file.category) {
    case 1: return 'video';
    case 2: return 'audio';
    case 3: return 'image';
    case 4: return 'document';
    default: return 'other';
  }
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
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ==================== 配置管理 ====================

/**
 * 设置百度应用配置（用于设置页动态配置）
 */
export function setBaiduConfig(appKey: string, secretKey: string, redirectUri?: string): void {
  BAIDU_CONFIG.appKey = appKey;
  BAIDU_CONFIG.secretKey = secretKey;
  if (redirectUri) {
    BAIDU_CONFIG.redirectUri = redirectUri;
  }
  // 持久化到 localStorage
  localStorage.setItem('baidu_app_key', appKey);
  localStorage.setItem('baidu_secret_key', secretKey);
  if (redirectUri) {
    localStorage.setItem('baidu_redirect_uri', redirectUri);
  }
}

/**
 * 从本地存储加载配置
 */
export function loadBaiduConfig(): void {
  const appKey = localStorage.getItem('baidu_app_key');
  const secretKey = localStorage.getItem('baidu_secret_key');
  const redirectUri = localStorage.getItem('baidu_redirect_uri');

  if (appKey) BAIDU_CONFIG.appKey = appKey;
  if (secretKey) BAIDU_CONFIG.secretKey = secretKey;
  if (redirectUri) BAIDU_CONFIG.redirectUri = redirectUri;
}

/**
 * 检查是否已配置百度应用
 */
export function isBaiduConfigured(): boolean {
  loadBaiduConfig();
  return !!(BAIDU_CONFIG.appKey && BAIDU_CONFIG.secretKey);
}

/**
 * 手动设置 refresh_token（用于直接导入已有的 token）
 */
export function setRefreshToken(refreshToken: string): void {
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  // 清除旧的 access_token，强制下次使用时刷新
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

/**
 * 初始化：从环境变量导入 token（如果配置了的话）
 */
function initializeFromEnv(): void {
  // 如果环境变量配置了 refresh_token，始终使用它（覆盖本地缓存）
  if (BAIDU_CONFIG.refreshToken) {
    const { refreshToken: localToken } = loadTokens();
    // 如果环境变量的 token 和本地不同，更新本地
    if (localToken !== BAIDU_CONFIG.refreshToken) {
      console.log('🔧 从环境变量更新百度网盘 refresh_token');
      setRefreshToken(BAIDU_CONFIG.refreshToken);
    }
  }
}

// 初始化时加载配置并导入 token
loadBaiduConfig();
initializeFromEnv();

// ==================== 导出 ====================

export default {
  // 配置
  setBaiduConfig,
  loadBaiduConfig,
  isBaiduConfigured,
  // 授权
  getAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  isLoggedIn,
  clearTokens,
  // 用户
  getUserInfo,
  getCachedUserInfo,
  // 文件
  listFiles,
  getFileMeta,
  getDownloadUrl,
  searchFiles,
  // 容量
  getQuota,
  // 工具
  getFileCategory,
  formatFileSize,
  formatDate,
};

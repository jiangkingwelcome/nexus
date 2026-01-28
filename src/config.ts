/**
 * Nexus OS 应用配置
 * 可根据实际网盘目录结构修改
 */

// ==================== 路径配置 ====================

export const PATH_CONFIG = {
  // 图书馆
  library: {
    basePath: '/百度网盘/电子书',      // 图书馆入口路径
    bookShelfPath: '/百度网盘/电子书/书城',  // 书城路径（微信读书风格展示）
  },
  
  // 电影院
  cinema: {
    basePath: '/百度网盘/电影',        // 电影院入口路径
  },
  
  // 文件管理
  files: {
    basePath: '/百度网盘',             // 文件管理入口路径
  },
};

// ==================== API 配置 ====================

export const API_CONFIG = {
  // Alist 服务器（从环境变量读取）
  alist: {
    baseUrl: import.meta.env.VITE_ALIST_URL || 'http://localhost:5244',
    token: import.meta.env.VITE_ALIST_TOKEN || '',
  },
  
  // PocketBase 服务器（从环境变量读取）
  pocketbase: {
    baseUrl: import.meta.env.VITE_PB_URL || 'http://localhost:8090',
  },
};

// ==================== 应用配置 ====================

export const APP_CONFIG = {
  // 应用名称
  appName: 'Nexus',
  
  // 用户名（后续可从 PocketBase 登录获取）
  userName: 'Jiangking',
  
  // 支持的电子书格式
  bookFormats: ['pdf', 'epub', 'mobi', 'azw3', 'txt', 'md'],
  
  // 支持的视频格式
  videoFormats: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v'],
};

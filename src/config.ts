/**
 * Nexus OS 应用配置
 * 可根据实际网盘目录结构修改
 */

// ==================== 路径配置 ====================

export const PATH_CONFIG = {
  // 图书馆（阿里云盘）
  library: {
    basePath: '/阿里云盘/电子书',           // 图书馆入口路径
    bookShelfPath: '/阿里云盘/电子书',      // 书城路径（目录即分类）
  },
  
  // 电影院（百度网盘）
  cinema: {
    basePath: '/百度网盘/电影',             // 电影院入口路径
  },
  
  // 文件管理
  files: {
    basePath: '/',                          // 文件管理入口路径（根目录，可看所有网盘）
  },
};

// ==================== API 配置 ====================

export const API_CONFIG = {
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

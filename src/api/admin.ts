/**
 * 后台管理 API 服务
 * 负责：统计数据、系统设置、用户管理
 */

import { pb } from './pocketbase';

// ==================== 类型定义 ====================

// 统计数据
export interface Statistics {
  users: {
    total: number;
    activeToday: number;
    newThisWeek: number;
  };
  content: {
    totalProgress: number;
    totalNotes: number;
    totalBookmarks: number;
    totalFavorites: number;
  };
  activity: {
    readsToday: number;
    readsThisWeek: number;
    readsThisMonth: number;
  };
  topContent: {
    path: string;
    name: string;
    accessCount: number;
  }[];
  recentActivity: {
    id: string;
    userName: string;
    action: string;
    target: string;
    time: string;
  }[];
}

// 系统设置
export interface SystemSettings {
  id?: string;
  // 路径配置
  library_base_path: string;
  library_bookshelf_path: string;
  cinema_base_path: string;
  files_base_path: string;
  // 应用配置
  app_name: string;
  default_user_name: string;
  book_formats: string;
  video_formats: string;
  // 其他设置
  enable_registration: boolean;
  max_recent_items: number;
  auto_save_interval: number;
  created?: string;
  updated?: string;
}

// 用户信息
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  created: string;
  lastLogin?: string;
  progressCount: number;
  notesCount: number;
  bookmarksCount: number;
}

// ==================== 管理员认证服务 ====================

export const adminAuthService = {
  /**
   * 检查是否为管理员
   */
  isAdmin(): boolean {
    const user = pb.authStore.model;
    // PocketBase 管理员或者有 admin 角色的用户
    return user?.admin === true || user?.role === 'admin';
  },

  /**
   * 管理员登录
   */
  async login(email: string, password: string) {
    const auth = await pb.collection('users').authWithPassword(email, password);
    // 检查是否有管理员权限
    if (!auth.record?.admin && auth.record?.role !== 'admin') {
      pb.authStore.clear();
      throw new Error('没有管理员权限');
    }
    return auth;
  },

  /**
   * 登出
   */
  logout() {
    pb.authStore.clear();
  },
};

// ==================== 统计数据服务 ====================

export const statisticsService = {
  /**
   * 获取综合统计数据
   */
  async getStatistics(): Promise<Statistics> {
    try {
      // 并行获取各项统计
      const [users, progress, notes, bookmarks] = await Promise.all([
        this.getUserStats(),
        this.getProgressStats(),
        this.getNotesStats(),
        this.getBookmarkStats(),
      ]);

      const topContent = await this.getTopContent();
      const recentActivity = await this.getRecentActivity();

      return {
        users,
        content: {
          totalProgress: progress.total,
          totalNotes: notes.total,
          totalBookmarks: bookmarks.total,
          totalFavorites: bookmarks.favorites,
        },
        activity: {
          readsToday: progress.today,
          readsThisWeek: progress.thisWeek,
          readsThisMonth: progress.thisMonth,
        },
        topContent,
        recentActivity,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      throw error;
    }
  },

  /**
   * 获取用户统计
   */
  async getUserStats() {
    try {
      const allUsers = await pb.collection('users').getList(1, 1, {
        requestKey: null,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // 获取今日活跃用户（有阅读记录的）
      let activeToday = 0;
      let newThisWeek = 0;
      
      try {
        const activeResult = await pb.collection('reading_progress').getList(1, 1, {
          filter: `last_read >= "${today.toISOString()}"`,
          requestKey: null,
        });
        activeToday = activeResult.totalItems;
      } catch {}

      try {
        const newResult = await pb.collection('users').getList(1, 1, {
          filter: `created >= "${weekAgo.toISOString()}"`,
          requestKey: null,
        });
        newThisWeek = newResult.totalItems;
      } catch {}

      return {
        total: allUsers.totalItems,
        activeToday,
        newThisWeek,
      };
    } catch (error) {
      return { total: 0, activeToday: 0, newThisWeek: 0 };
    }
  },

  /**
   * 获取进度统计
   */
  async getProgressStats() {
    try {
      const all = await pb.collection('reading_progress').getList(1, 1, {
        requestKey: null,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      try {
        const todayResult = await pb.collection('reading_progress').getList(1, 1, {
          filter: `last_read >= "${today.toISOString()}"`,
          requestKey: null,
        });
        todayCount = todayResult.totalItems;
      } catch {}

      try {
        const weekResult = await pb.collection('reading_progress').getList(1, 1, {
          filter: `last_read >= "${weekAgo.toISOString()}"`,
          requestKey: null,
        });
        weekCount = weekResult.totalItems;
      } catch {}

      try {
        const monthResult = await pb.collection('reading_progress').getList(1, 1, {
          filter: `last_read >= "${monthAgo.toISOString()}"`,
          requestKey: null,
        });
        monthCount = monthResult.totalItems;
      } catch {}

      return {
        total: all.totalItems,
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
      };
    } catch (error) {
      return { total: 0, today: 0, thisWeek: 0, thisMonth: 0 };
    }
  },

  /**
   * 获取笔记统计
   */
  async getNotesStats() {
    try {
      const all = await pb.collection('notes').getList(1, 1, {
        requestKey: null,
      });
      return { total: all.totalItems };
    } catch (error) {
      return { total: 0 };
    }
  },

  /**
   * 获取收藏统计
   */
  async getBookmarkStats() {
    try {
      const all = await pb.collection('bookmarks').getList(1, 1, {
        requestKey: null,
      });
      
      let favorites = 0;
      try {
        const favResult = await pb.collection('bookmarks').getList(1, 1, {
          filter: 'is_favorite = true',
          requestKey: null,
        });
        favorites = favResult.totalItems;
      } catch {}

      return { total: all.totalItems, favorites };
    } catch (error) {
      return { total: 0, favorites: 0 };
    }
  },

  /**
   * 获取热门内容
   */
  async getTopContent() {
    try {
      const records = await pb.collection('reading_progress').getList(1, 10, {
        sort: '-last_read',
        requestKey: null,
      });

      // 统计访问次数
      const contentMap = new Map<string, { name: string; count: number }>();
      records.items.forEach((item: any) => {
        const key = item.file_path;
        const existing = contentMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          contentMap.set(key, { name: item.file_name, count: 1 });
        }
      });

      return Array.from(contentMap.entries())
        .map(([path, data]) => ({
          path,
          name: data.name,
          accessCount: data.count,
        }))
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 5);
    } catch (error) {
      return [];
    }
  },

  /**
   * 获取最近活动
   */
  async getRecentActivity() {
    try {
      const records = await pb.collection('reading_progress').getList(1, 10, {
        sort: '-last_read',
        expand: 'user_id',
        requestKey: null,
      });

      return records.items.map((item: any) => ({
        id: item.id,
        userName: item.expand?.user_id?.name || '未知用户',
        action: item.file_type === 'video' ? '观看' : '阅读',
        target: item.file_name,
        time: item.last_read,
      }));
    } catch (error) {
      return [];
    }
  },
};

// ==================== 设置管理服务 ====================

export const settingsService = {
  /**
   * 获取系统设置
   */
  async getSettings(): Promise<SystemSettings> {
    try {
      const record = await pb.collection('system_settings').getFirstListItem('', {
        requestKey: null,
      });
      return record as unknown as SystemSettings;
    } catch (error) {
      // 如果没有设置记录，返回默认值
      return this.getDefaultSettings();
    }
  },

  /**
   * 保存系统设置
   */
  async saveSettings(settings: SystemSettings): Promise<SystemSettings> {
    try {
      if (settings.id) {
        // 更新现有设置
        const updated = await pb.collection('system_settings').update(settings.id, settings);
        return updated as unknown as SystemSettings;
      } else {
        // 创建新设置
        const created = await pb.collection('system_settings').create(settings);
        return created as unknown as SystemSettings;
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  },

  /**
   * 获取默认设置
   */
  getDefaultSettings(): SystemSettings {
    return {
      library_base_path: '/百度网盘/电子书',
      library_bookshelf_path: '/百度网盘/电子书/书城',
      cinema_base_path: '/百度网盘/电影',
      files_base_path: '/百度网盘',
      app_name: 'Nexus',
      default_user_name: 'Jiangking',
      book_formats: 'pdf,epub,mobi,azw3,txt,md',
      video_formats: 'mp4,mkv,avi,mov,webm,flv,m4v',
      enable_registration: true,
      max_recent_items: 10,
      auto_save_interval: 30,
    };
  },
};

// ==================== 用户管理服务 ====================

export const userManageService = {
  /**
   * 获取所有用户列表
   */
  async getUsers(page: number = 1, perPage: number = 20): Promise<{
    items: UserInfo[];
    totalItems: number;
    totalPages: number;
  }> {
    try {
      const users = await pb.collection('users').getList(page, perPage, {
        sort: '-created',
        requestKey: null,
      });

      // 获取每个用户的统计信息
      const userInfos = await Promise.all(
        users.items.map(async (user: any) => {
          let progressCount = 0;
          let notesCount = 0;
          let bookmarksCount = 0;

          try {
            const progress = await pb.collection('reading_progress').getList(1, 1, {
              filter: `user_id = "${user.id}"`,
              requestKey: null,
            });
            progressCount = progress.totalItems;
          } catch {}

          try {
            const notes = await pb.collection('notes').getList(1, 1, {
              filter: `user_id = "${user.id}"`,
              requestKey: null,
            });
            notesCount = notes.totalItems;
          } catch {}

          try {
            const bookmarks = await pb.collection('bookmarks').getList(1, 1, {
              filter: `user_id = "${user.id}"`,
              requestKey: null,
            });
            bookmarksCount = bookmarks.totalItems;
          } catch {}

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
            created: user.created,
            lastLogin: user.lastLogin,
            progressCount,
            notesCount,
            bookmarksCount,
          };
        })
      );

      return {
        items: userInfos,
        totalItems: users.totalItems,
        totalPages: users.totalPages,
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return { items: [], totalItems: 0, totalPages: 0 };
    }
  },

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<void> {
    await pb.collection('users').delete(userId);
  },

  /**
   * 设置用户角色
   */
  async setUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    await pb.collection('users').update(userId, { role });
  },
};

// ==================== 导出 ====================

export default {
  adminAuth: adminAuthService,
  statistics: statisticsService,
  settings: settingsService,
  userManage: userManageService,
};

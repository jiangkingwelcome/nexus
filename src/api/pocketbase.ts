/**
 * PocketBase 数据中心客户端
 * 负责：用户数据、阅读进度、笔记、多端同步
 */

import PocketBase from 'pocketbase';

// PocketBase 配置
const PB_URL = import.meta.env.VITE_PB_URL || 'http://localhost:8090';

// 创建 PocketBase 实例
export const pb = new PocketBase(PB_URL);

// ==================== 类型定义 ====================

// 阅读进度
export interface ReadingProgress {
  id?: string;
  user_id?: string;
  file_path: string;
  file_name: string;
  file_type: 'book' | 'video' | 'audio' | 'document';
  progress: number;           // 进度百分比 0-100
  current_position: string;   // 当前位置 (页码/时间戳)
  total_length: string;       // 总长度 (总页数/总时长)
  last_read: string;          // 最后阅读时间
  created?: string;
  updated?: string;
}

// 笔记
export interface Note {
  id?: string;
  user_id?: string;
  file_path: string;
  file_name: string;
  content: string;
  position?: string;          // 笔记关联的位置
  created?: string;
  updated?: string;
}

// 收藏/标签
export interface Bookmark {
  id?: string;
  user_id?: string;
  file_path: string;
  file_name: string;
  tags: string[];
  is_favorite: boolean;
  created?: string;
}

// ==================== 阅读进度服务 ====================

export const progressService = {
  /**
   * 获取文件的阅读进度
   */
  async get(filePath: string): Promise<ReadingProgress | null> {
    try {
      const record = await pb.collection('reading_progress').getFirstListItem(
        `file_path = "${filePath}"`,
        { requestKey: null }
      );
      return record as unknown as ReadingProgress;
    } catch (error) {
      // 404 表示没有记录
      return null;
    }
  },

  /**
   * 保存/更新阅读进度
   */
  async save(progress: ReadingProgress): Promise<ReadingProgress> {
    try {
      // 检查是否已存在
      const existing = await this.get(progress.file_path);
      
      if (existing?.id) {
        // 更新现有记录
        const updated = await pb.collection('reading_progress').update(existing.id, {
          ...progress,
          last_read: new Date().toISOString(),
        });
        return updated as unknown as ReadingProgress;
      } else {
        // 创建新记录
        const created = await pb.collection('reading_progress').create({
          ...progress,
          last_read: new Date().toISOString(),
        });
        return created as unknown as ReadingProgress;
      }
    } catch (error) {
      console.error('保存进度失败:', error);
      throw error;
    }
  },

  /**
   * 获取最近阅读列表
   */
  async getRecent(limit: number = 10): Promise<ReadingProgress[]> {
    try {
      const records = await pb.collection('reading_progress').getList(1, limit, {
        sort: '-last_read',
        requestKey: null,
      });
      return records.items as unknown as ReadingProgress[];
    } catch (error) {
      console.error('获取最近阅读失败:', error);
      return [];
    }
  },

  /**
   * 实时订阅进度变化 (多端同步)
   */
  subscribe(callback: (data: ReadingProgress) => void): () => void {
    pb.collection('reading_progress').subscribe('*', (e) => {
      callback(e.record as unknown as ReadingProgress);
    });
    
    // 返回取消订阅函数
    return () => {
      pb.collection('reading_progress').unsubscribe('*');
    };
  },
};

// ==================== 笔记服务 ====================

export const noteService = {
  /**
   * 获取文件的所有笔记
   */
  async getByFile(filePath: string): Promise<Note[]> {
    try {
      const records = await pb.collection('notes').getList(1, 100, {
        filter: `file_path = "${filePath}"`,
        sort: '-created',
        requestKey: null,
      });
      return records.items as unknown as Note[];
    } catch (error) {
      console.error('获取笔记失败:', error);
      return [];
    }
  },

  /**
   * 创建笔记
   */
  async create(note: Note): Promise<Note> {
    const created = await pb.collection('notes').create(note);
    return created as unknown as Note;
  },

  /**
   * 更新笔记
   */
  async update(id: string, content: string): Promise<Note> {
    const updated = await pb.collection('notes').update(id, { content });
    return updated as unknown as Note;
  },

  /**
   * 删除笔记
   */
  async delete(id: string): Promise<void> {
    await pb.collection('notes').delete(id);
  },
};

// ==================== 收藏/标签服务 ====================

export const bookmarkService = {
  /**
   * 获取文件的收藏状态
   */
  async get(filePath: string): Promise<Bookmark | null> {
    try {
      const record = await pb.collection('bookmarks').getFirstListItem(
        `file_path = "${filePath}"`,
        { requestKey: null }
      );
      return record as unknown as Bookmark;
    } catch (error) {
      return null;
    }
  },

  /**
   * 切换收藏状态
   */
  async toggleFavorite(filePath: string, fileName: string): Promise<boolean> {
    const existing = await this.get(filePath);
    
    if (existing?.id) {
      const updated = await pb.collection('bookmarks').update(existing.id, {
        is_favorite: !existing.is_favorite,
      });
      return (updated as unknown as Bookmark).is_favorite;
    } else {
      await pb.collection('bookmarks').create({
        file_path: filePath,
        file_name: fileName,
        is_favorite: true,
        tags: [],
      });
      return true;
    }
  },

  /**
   * 获取所有收藏
   */
  async getFavorites(): Promise<Bookmark[]> {
    try {
      const records = await pb.collection('bookmarks').getList(1, 100, {
        filter: 'is_favorite = true',
        sort: '-created',
        requestKey: null,
      });
      return records.items as unknown as Bookmark[];
    } catch (error) {
      console.error('获取收藏失败:', error);
      return [];
    }
  },

  /**
   * 添加标签
   */
  async addTag(filePath: string, fileName: string, tag: string): Promise<void> {
    const existing = await this.get(filePath);
    
    if (existing?.id) {
      const tags = [...new Set([...existing.tags, tag])];
      await pb.collection('bookmarks').update(existing.id, { tags });
    } else {
      await pb.collection('bookmarks').create({
        file_path: filePath,
        file_name: fileName,
        is_favorite: false,
        tags: [tag],
      });
    }
  },

  /**
   * 移除标签
   */
  async removeTag(filePath: string, tag: string): Promise<void> {
    const existing = await this.get(filePath);
    
    if (existing?.id) {
      const tags = existing.tags.filter(t => t !== tag);
      await pb.collection('bookmarks').update(existing.id, { tags });
    }
  },
};

// ==================== 用户认证服务 ====================

export const authService = {
  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return pb.authStore.isValid;
  },

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return pb.authStore.model;
  },

  /**
   * 邮箱密码登录
   */
  async login(email: string, password: string) {
    return await pb.collection('users').authWithPassword(email, password);
  },

  /**
   * 注册
   */
  async register(email: string, password: string, name: string) {
    return await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
  },

  /**
   * 登出
   */
  logout() {
    pb.authStore.clear();
  },

  /**
   * 监听认证状态变化
   */
  onAuthChange(callback: (token: string, model: any) => void) {
    return pb.authStore.onChange(callback);
  },
};

// ==================== 导出 ====================

export default {
  pb,
  progress: progressService,
  notes: noteService,
  bookmarks: bookmarkService,
  auth: authService,
};

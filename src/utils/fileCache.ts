/**
 * 文件缓存服务 - 简化存储策略
 * 
 * 策略：
 * - 视频文件：必须设置本地文件夹才能下载（文件太大）
 * - 其他文件（书籍、文本等）：直接使用 IndexedDB（足够大）
 * - 本地文件夹：可选，用于视频下载和大文件缓存
 */

const DB_NAME = 'NexusFileCache';
const DB_VERSION = 1;
const STORE_NAME = 'textFiles';
const SETTINGS_STORE = 'settings';

// 视频格式列表
const VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv', 'rmvb', 'rm', '3gp', 'ts'];

interface CachedFile {
  path: string;
  content: string;
  size: number;
  cachedAt: number;
  lastAccessed: number;
}

interface CacheSettings {
  id: string;
  storageMode: 'auto' | 'local' | 'indexeddb';
  localFolderName?: string;
}

// 最大缓存大小
const MAX_LOCAL_CACHE_SIZE = 10 * 1024 * 1024 * 1024;  // 本地文件夹 10GB（用于视频）
const MAX_IDB_CACHE_SIZE = 2 * 1024 * 1024 * 1024;     // IndexedDB 2GB（足够存书籍等）

class FileCacheService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private localFolderHandle: FileSystemDirectoryHandle | null = null;
  private settings: CacheSettings = { id: 'main', storageMode: 'auto' };
  private initialized = false;

  /**
   * 初始化缓存系统
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    await this.getDB(); // 加载设置
    this.initialized = true;
    console.log('✅ 缓存系统已初始化 (IndexedDB)');
  }

  /**
   * 检查文件是否是视频
   */
  isVideoFile(path: string): boolean {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    return VIDEO_FORMATS.includes(ext);
  }

  /**
   * 检查是否可以缓存视频（需要设置本地文件夹）
   */
  canCacheVideo(): boolean {
    return this.localFolderHandle !== null;
  }

  /**
   * 检查是否已设置本地文件夹
   */
  hasLocalFolder(): boolean {
    return this.localFolderHandle !== null;
  }

  /**
   * 检查是否支持用户选择本地文件夹
   */
  isLocalFolderSupported(): boolean {
    return 'showDirectoryPicker' in window;
  }

  /**
   * 选择本地缓存文件夹
   * @param suggestPath 建议的起始位置: 'downloads' | 'documents' | 'desktop' | 'music' | 'pictures' | 'videos'
   */
  async selectLocalFolder(suggestPath: string = 'downloads'): Promise<boolean> {
    if (!this.isLocalFolderSupported()) {
      console.warn('当前浏览器不支持本地文件夹缓存');
      return false;
    }

    try {
      // 让用户选择文件夹，默认从下载目录开始（通常在非 C 盘）
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: suggestPath,
        id: 'nexus-cache-folder', // 记住上次选择的位置
      });

      // 创建 NexusCache 子文件夹
      this.localFolderHandle = await handle.getDirectoryHandle('NexusCache', { create: true });
      
      // 保存设置和句柄引用
      this.settings.storageMode = 'local';
      this.settings.localFolderName = handle.name;
      await this.saveSettings();
      
      // 尝试保存句柄到 IndexedDB 以便下次恢复（需要用户重新授权）
      await this.saveFolderHandle(handle);

      console.log('✅ 本地缓存文件夹已设置:', handle.name + '/NexusCache');
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('用户取消了文件夹选择');
      } else {
        console.error('选择文件夹失败:', err);
      }
      return false;
    }
  }

  /**
   * 保存文件夹句柄（用于下次恢复）
   */
  private async saveFolderHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        store.put({ id: 'folderHandle', handle });
        transaction.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  /**
   * 尝试恢复之前选择的文件夹（需要用户重新授权）
   */
  async tryRestoreFolder(): Promise<boolean> {
    await this.init();
    
    if (!this.isLocalFolderSupported()) {
      return false;
    }
    
    // 如果没有保存过本地文件夹设置，直接返回
    if (this.settings.storageMode !== 'local' && !this.settings.localFolderName) {
      return false;
    }

    try {
      const db = await this.getDB();
      
      return new Promise(async (resolve) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('folderHandle');
        
        request.onsuccess = async () => {
          const result = request.result;
          if (result?.handle) {
            try {
              // 检查是否有权限
              const permission = await result.handle.queryPermission({ mode: 'readwrite' });
              
              if (permission === 'granted') {
                // 已有权限，直接使用
                this.localFolderHandle = await result.handle.getDirectoryHandle('NexusCache', { create: true });
                console.log('✅ 已恢复本地缓存文件夹');
                resolve(true);
                return;
              } else if (permission === 'prompt') {
                // 需要用户重新授权
                const newPermission = await result.handle.requestPermission({ mode: 'readwrite' });
                if (newPermission === 'granted') {
                  this.localFolderHandle = await result.handle.getDirectoryHandle('NexusCache', { create: true });
                  console.log('✅ 用户重新授权，已恢复本地缓存文件夹');
                  resolve(true);
                  return;
                }
              }
            } catch (err) {
              console.warn('恢复文件夹句柄失败:', err);
            }
          }
          resolve(false);
        };
        
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * 获取当前缓存模式
   */
  getCacheMode(): { mode: 'local' | 'indexeddb'; folderName?: string; location?: string; videoSupported: boolean } {
    if (this.localFolderHandle) {
      return { 
        mode: 'local', 
        folderName: this.settings.localFolderName,
        location: `${this.settings.localFolderName}/NexusCache/`,
        videoSupported: true
      };
    }
    return { 
      mode: 'indexeddb',
      location: '浏览器 IndexedDB (2GB)',
      videoSupported: false
    };
  }

  /**
   * 断开本地文件夹连接（回到纯 IndexedDB 模式）
   */
  async disconnectLocalFolder(): Promise<void> {
    this.localFolderHandle = null;
    this.settings.storageMode = 'auto';
    this.settings.localFolderName = undefined;
    await this.saveSettings();
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        this.loadSettings();
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'id' });
        }
      };
    });

    return this.dbPromise;
  }

  private async loadSettings(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE);
        const request = store.get('main');
        
        request.onsuccess = () => {
          if (request.result) {
            this.settings = request.result;
          }
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE);
        store.put(this.settings);
        transaction.oncomplete = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  /**
   * 将文件路径转换为安全的文件名
   */
  private pathToFileName(path: string): string {
    return path.replace(/[/\\:*?"<>|]/g, '_').substring(0, 200) + '.txt';
  }

  /**
   * 异步更新文件访问时间（不阻塞主流程）
   */
  private async updateAccessTime(path: string): Promise<void> {
    // 延迟执行，避免影响主流程
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const db = await this.getDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);
      
      request.onsuccess = () => {
        const result = request.result as CachedFile | undefined;
        if (result) {
          result.lastAccessed = Date.now();
          store.put(result);
        }
      };
    } catch {
      // ignore
    }
  }

  /**
   * 获取缓存的文件内容
   */
  async get(path: string): Promise<string | null> {
    await this.init();
    
    const fileName = this.pathToFileName(path);
    const isVideo = this.isVideoFile(path);
    
    // 视频文件只从本地文件夹读取
    if (isVideo) {
      if (!this.localFolderHandle) {
        return null; // 视频没有本地文件夹，无法读取缓存
      }
      try {
        const fileHandle = await this.localFolderHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
      } catch {
        return null;
      }
    }

    // 非视频文件：先检查本地文件夹，再检查 IndexedDB
    if (this.localFolderHandle) {
      try {
        const fileHandle = await this.localFolderHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
      } catch {
        // 文件不存在，继续检查 IndexedDB
      }
    }

    // 从 IndexedDB 读取（使用只读事务，更快）
    try {
      const db = await this.getDB();
      
      return new Promise((resolve) => {
        // 使用只读事务提高读取速度
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(path);

        request.onsuccess = () => {
          const result = request.result as CachedFile | undefined;
          if (result) {
            // 异步更新访问时间，不阻塞读取
            this.updateAccessTime(path).catch(() => {});
            resolve(result.content);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * 缓存文件内容
   * @returns 'success' | 'need_local_folder' | 'error'
   */
  async set(path: string, content: string): Promise<'success' | 'need_local_folder' | 'error'> {
    await this.init();
    
    const fileName = this.pathToFileName(path);
    const isVideo = this.isVideoFile(path);
    
    // 视频文件必须使用本地文件夹
    if (isVideo) {
      if (!this.localFolderHandle) {
        console.warn('❌ 视频文件需要先设置本地文件夹才能下载');
        return 'need_local_folder';
      }
      try {
        const fileHandle = await this.localFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log('💾 视频已缓存到本地文件夹:', fileName);
        return 'success';
      } catch (err) {
        console.error('视频缓存失败:', err);
        return 'error';
      }
    }

    // 非视频文件：如果设置了本地文件夹则使用，否则用 IndexedDB
    if (this.localFolderHandle) {
      try {
        const fileHandle = await this.localFolderHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        console.log('💾 已缓存到本地文件夹:', fileName);
        return 'success';
      } catch (err) {
        console.warn('本地文件夹缓存失败，尝试 IndexedDB:', err);
      }
    }

    // 保存到 IndexedDB
    try {
      const db = await this.getDB();
      const size = new Blob([content]).size;

      await this.ensureSpace(size);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const cachedFile: CachedFile = {
          path,
          content,
          size,
          cachedAt: Date.now(),
          lastAccessed: Date.now(),
        };

        const request = store.put(cachedFile);
        request.onsuccess = () => {
          console.log('💾 已缓存到 IndexedDB:', path);
          resolve('success');
        };
        request.onerror = () => {
          console.error('IndexedDB 缓存失败:', request.error);
          resolve('error');
        };
      });
    } catch (err) {
      console.error('缓存文件失败:', err);
      return 'error';
    }
  }

  /**
   * 缓存视频文件（二进制数据）到本地文件夹
   * @returns 'success' | 'need_local_folder' | 'error'
   */
  async setVideoBlob(path: string, blob: Blob): Promise<'success' | 'need_local_folder' | 'error'> {
    await this.init();
    
    if (!this.localFolderHandle) {
      console.warn('❌ 视频文件需要先设置本地文件夹才能下载');
      return 'need_local_folder';
    }

    try {
      // 使用原始文件名
      const fileName = path.split('/').pop() || 'video.mp4';
      const fileHandle = await this.localFolderHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      console.log('💾 视频已下载到本地:', fileName);
      return 'success';
    } catch (err) {
      console.error('视频下载失败:', err);
      return 'error';
    }
  }

  /**
   * 获取本地缓存的视频文件 URL
   */
  async getVideoUrl(path: string): Promise<string | null> {
    if (!this.localFolderHandle) return null;

    try {
      const fileName = path.split('/').pop() || '';
      const fileHandle = await this.localFolderHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }

  private async ensureSpace(neededSize: number): Promise<void> {
    const db = await this.getDB();
    const maxSize = this.localFolderHandle ? MAX_LOCAL_CACHE_SIZE : MAX_IDB_CACHE_SIZE;
    
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('lastAccessed');
      
      let totalSize = 0;
      const toDelete: string[] = [];

      const request = index.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        
        if (cursor) {
          const file = cursor.value as CachedFile;
          totalSize += file.size;
          
          if (totalSize + neededSize > maxSize) {
            toDelete.push(file.path);
          }
          
          cursor.continue();
        } else {
          toDelete.forEach(p => store.delete(p));
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{ 
    count: number; 
    totalSize: number; 
    mode: string; 
    folderName?: string; 
    location?: string;
    videoSupported: boolean;
    localCount?: number;
    localSize?: number;
    idbCount?: number;
    idbSize?: number;
  }> {
    await this.init();
    const modeInfo = this.getCacheMode();
    
    let localCount = 0;
    let localSize = 0;
    let idbCount = 0;
    let idbSize = 0;

    // 统计本地文件夹
    if (this.localFolderHandle) {
      try {
        for await (const entry of (this.localFolderHandle as any).values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            localCount++;
            localSize += file.size;
          }
        }
      } catch {
        // ignore
      }
    }

    // 统计 IndexedDB
    try {
      const db = await this.getDB();
      
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.openCursor();
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
          
          if (cursor) {
            const file = cursor.value as CachedFile;
            idbCount++;
            idbSize += file.size;
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      });
    } catch {
      // ignore
    }

    return { 
      count: localCount + idbCount, 
      totalSize: localSize + idbSize, 
      mode: modeInfo.mode, 
      folderName: modeInfo.folderName, 
      location: modeInfo.location,
      videoSupported: modeInfo.videoSupported,
      localCount,
      localSize,
      idbCount,
      idbSize
    };
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    // 清空本地文件夹
    if (this.localFolderHandle) {
      try {
        for await (const entry of (this.localFolderHandle as any).values()) {
          if (entry.kind === 'file') {
            await this.localFolderHandle.removeEntry(entry.name);
          }
        }
        console.log('✅ 本地文件夹缓存已清空');
      } catch (err) {
        console.warn('清空本地文件夹失败:', err);
      }
    }

    // 清空 IndexedDB
    try {
      const db = await this.getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('✅ IndexedDB 缓存已清空');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('清空缓存失败:', err);
    }
  }

  /**
   * 只清空 IndexedDB 缓存
   */
  async clearIndexedDB(): Promise<void> {
    try {
      const db = await this.getDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('✅ IndexedDB 缓存已清空');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.error('清空 IndexedDB 失败:', err);
    }
  }

  /**
   * 只清空本地文件夹缓存
   */
  async clearLocalFolder(): Promise<void> {
    if (!this.localFolderHandle) return;
    
    try {
      for await (const entry of (this.localFolderHandle as any).values()) {
        if (entry.kind === 'file') {
          await this.localFolderHandle.removeEntry(entry.name);
        }
      }
      console.log('✅ 本地文件夹缓存已清空');
    } catch (err) {
      console.warn('清空本地文件夹失败:', err);
    }
  }
}

export const fileCache = new FileCacheService();

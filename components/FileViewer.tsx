import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { getFileUrl, getProxyUrl } from '@/src/api/files';
import { progressService, ReadingProgress } from '@/src/api/pocketbase';
import { fileCache } from '@/src/utils/fileCache';
import { ArrowLeftIcon, MoreHorizontalIcon } from './Icons';

interface FileViewerProps {
  file: FileItem;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, onClose }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [savedProgress, setSavedProgress] = useState<ReadingProgress | null>(null);
  const hideControlsTimer = useRef<number | null>(null);

  // 获取文件直链和已保存的进度（并行执行）
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      
      // 并行加载文件URL和进度
      const loadUrlPromise = (async () => {
        try {
          // 对于文档和电子书，使用代理 URL
          if (file.category === 'document' || file.category === 'ebook') {
            return await getProxyUrl(file.path, file.fs_id);
          } else {
            return await getFileUrl(file.path, file.fs_id);
          }
        } catch (err) {
          throw err;
        }
      })();
      
      const loadProgressPromise = progressService.get(file.path).catch(() => null);
      
      try {
        const [url, progress] = await Promise.all([loadUrlPromise, loadProgressPromise]);
        setFileUrl(url);
        if (progress) setSavedProgress(progress);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取文件失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadAll();
  }, [file.path]);

  // 保存进度
  const saveProgress = async (progress: number, position: string, total: string) => {
    try {
      const fileType = file.category === 'video' ? 'video' 
        : file.category === 'audio' ? 'audio'
        : file.category === 'ebook' ? 'book'
        : 'document';
      
      await progressService.save({
        file_path: file.path,
        file_name: file.name,
        file_type: fileType,
        progress,
        current_position: position,
        total_length: total,
        last_read: new Date().toISOString(),
      });
    } catch (err) {
      console.log('保存进度失败');
    }
  };

  const loadFileUrl = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (file.category === 'document' || file.category === 'ebook') {
        const url = await getProxyUrl(file.path);
        setFileUrl(url);
      } else {
        const url = await getFileUrl(file.path);
        setFileUrl(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件失败');
      if (file.category === 'video') {
        setFileUrl('https://www.w3schools.com/html/mov_bbb.mp4');
      }
    } finally {
      setLoading(false);
    }
  };

  // Escape 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 控制条自动隐藏
  useEffect(() => {
    const handleActivity = () => {
      setControlsVisible(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = window.setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    handleActivity();

    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // 渲染不同类型的内容
  const renderContent = () => {
    // 文本文件：直接渲染 TextViewer，让它自己处理所有加载
    if (file.category === 'document' && !file.name.endsWith('.pdf')) {
      return <TextViewer filePath={file.path} filename={file.name} fileSize={file.size} onClose={onClose} />;
    }

    // 其他类型需要等待 URL
    if (loading) {
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-white/20"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
          </div>
          <p className="mt-6 text-sm text-white/70">正在加载...</p>
        </div>
      );
    }

    if (error && !fileUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-800">无法加载文件</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">{error}</p>
          <button 
            onClick={loadFileUrl}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all"
          >
            重试
          </button>
        </div>
      );
    }

    switch (file.category) {
      case 'video':
        return (
          <VideoPlayer 
            url={fileUrl!} 
            filename={file.name} 
            initialProgress={savedProgress}
            onProgressChange={saveProgress}
            onClose={onClose}
          />
        );
      
      case 'document':
        // PDF
        return <PdfViewer url={fileUrl!} />;
      
      case 'ebook':
        return <EbookViewer url={fileUrl!} filename={file.name} />;
      
      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img 
              src={fileUrl!} 
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>
        );
      
      case 'audio':
        return <AudioPlayer url={fileUrl!} filename={file.name} />;
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white/70">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">不支持的文件类型</p>
            <p className="text-sm mt-1">{file.name}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
      {/* 内容区域 - 占满全屏 */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* 顶部返回按钮 - 仅在音频/图片时显示（视频播放器自带控制栏） */}
      {(file.category === 'audio' || file.category === 'image') && (
        <button 
          onClick={onClose}
          className={`fixed top-6 left-6 z-50 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-black/50 active:scale-95 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="返回"
          aria-label="返回"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* 底部文件名 - 仅在音频/图片时显示（视频播放器自带控制栏） */}
      {(file.category === 'audio' || file.category === 'image') && (
        <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <h2 className="text-white font-semibold text-lg truncate">{file.name}</h2>
          <p className="text-white/60 text-sm mt-1">{file.path}</p>
        </div>
      )}
    </div>
  );
};

// ==================== 视频播放器 ====================
interface VideoPlayerProps {
  url: string;
  filename: string;
  initialProgress?: ReadingProgress | null;
  onProgressChange?: (progress: number, position: string, total: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps & { onClose?: () => void }> = ({ url, filename, initialProgress, onProgressChange, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const saveTimerRef = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  // 控制栏自动隐藏
  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  // 恢复上次播放位置
  useEffect(() => {
    if (videoRef.current && initialProgress?.current_position) {
      const savedTime = parseFloat(initialProgress.current_position);
      if (!isNaN(savedTime) && savedTime > 0) {
        videoRef.current.currentTime = savedTime;
      }
    }
  }, [initialProgress, url]);

  // 定时保存进度 (每5秒)
  useEffect(() => {
    if (isPlaying && onProgressChange) {
      saveTimerRef.current = window.setInterval(() => {
        if (videoRef.current && duration > 0) {
          const progressPercent = Math.round((currentTime / duration) * 100);
          onProgressChange(
            progressPercent,
            currentTime.toString(),
            duration.toString()
          );
        }
      }, 5000);
    }
    
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [isPlaying, currentTime, duration, onProgressChange]);

  // 关闭时保存最终进度
  useEffect(() => {
    return () => {
      if (onProgressChange && videoRef.current && duration > 0) {
        const progressPercent = Math.round((videoRef.current.currentTime / duration) * 100);
        onProgressChange(
          progressPercent,
          videoRef.current.currentTime.toString(),
          duration.toString()
        );
      }
    };
  }, [duration, onProgressChange]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center bg-black"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={url}
        className="max-w-full max-h-full"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => { setIsPlaying(true); resetHideTimer(); }}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {/* 顶部控制栏 - 返回按钮和标题 */}
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent transition-all duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all"
              title="返回"
              aria-label="返回"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h3 className="text-white font-medium truncate flex-1">{filename}</h3>
        </div>
      </div>
      
      {/* 播放按钮覆盖 */}
      {!isPlaying && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          title="播放"
          aria-label="播放视频"
        >
          <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40 hover:bg-white/40 transition-colors">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* 底部控制栏 - 进度条 */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent transition-all duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div 
          className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-white/70 text-xs">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== 阅读主题配置 ====================
const READING_THEMES = {
  // 经典主题
  paper: { bg: '#F5F5DC', text: '#3D3D3D', name: '羊皮纸', category: 'classic' },
  green: { bg: '#C7EDCC', text: '#2D4A2D', name: '护眼绿', category: 'classic' },
  night: { bg: '#1A1A2E', text: '#E8E8E8', name: '夜间', category: 'dark' },
  white: { bg: '#FFFFFF', text: '#333333', name: '纯白', category: 'classic' },
  sepia: { bg: '#FBF0D9', text: '#5B4636', name: '怀旧', category: 'classic' },
  
  // 清新主题
  sky: { bg: '#E3F2FD', text: '#1565C0', name: '天空蓝', category: 'fresh' },
  lavender: { bg: '#F3E5F5', text: '#6A1B9A', name: '薰衣草', category: 'fresh' },
  sakura: { bg: '#FCE4EC', text: '#AD1457', name: '樱花粉', category: 'fresh' },
  mint: { bg: '#E0F2F1', text: '#00695C', name: '薄荷', category: 'fresh' },
  lemon: { bg: '#FFFDE7', text: '#F57F17', name: '柠檬', category: 'fresh' },
  
  // 深色主题
  abyss: { bg: '#0D1117', text: '#C9D1D9', name: '深邃黑', category: 'dark' },
  darkPurple: { bg: '#1E1E2F', text: '#B794F6', name: '暗夜紫', category: 'dark' },
  midnight: { bg: '#0F1624', text: '#7DD3FC', name: '午夜蓝', category: 'dark' },
  darkGreen: { bg: '#1A2F1A', text: '#90EE90', name: '墨绿', category: 'dark' },
  warmNight: { bg: '#1F1510', text: '#FBBF24', name: '暖夜', category: 'dark' },
  
  // 特色主题
  ink: { bg: '#F5F5F0', text: '#2C2C2C', name: '墨香', category: 'special' },
  ancient: { bg: '#E8DCC4', text: '#4A3728', name: '古籍', category: 'special' },
  mocha: { bg: '#3E2723', text: '#D7CCC8', name: '摩卡', category: 'dark' },
  forest: { bg: '#E8F5E9', text: '#1B5E20', name: '森林', category: 'fresh' },
  ocean: { bg: '#E1F5FE', text: '#01579B', name: '海洋', category: 'fresh' },
};

type ThemeKey = keyof typeof READING_THEMES;

// 主题分类
const THEME_CATEGORIES = {
  classic: { name: '经典', icon: '📖' },
  fresh: { name: '清新', icon: '🌸' },
  dark: { name: '深色', icon: '🌙' },
  special: { name: '特色', icon: '✨' },
};

// 判断是否为深色主题
const isDarkTheme = (key: ThemeKey) => {
  return READING_THEMES[key].category === 'dark';
};

// ==================== 文本阅读器 ====================
// 章节标题正则
const CHAPTER_REGEX = /^(第[一二三四五六七八九十百千万\d]+[章节卷部篇回集幕]|Chapter\s*\d+|卷[一二三四五六七八九十\d]+|序[章言]?|楔子|尾声|后记|前言|引子)/im;

// 按章节分割文本
function splitByChapters(text: string): string[] {
  // 按行分割
  const lines = text.split('\n');
  const chapters: string[] = [];
  let currentChapter: string[] = [];
  let foundFirstChapter = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // 检测是否是章节标题
    const isChapterTitle = CHAPTER_REGEX.test(trimmedLine) && trimmedLine.length < 50;
    
    if (isChapterTitle) {
      foundFirstChapter = true;
      // 如果当前章节有内容，保存它
      if (currentChapter.length > 0 && currentChapter.some(l => l.trim())) {
        chapters.push(currentChapter.join('\n'));
      }
      // 开始新章节
      currentChapter = [line];
    } else {
      // 如果还没找到第一个章节，把内容加到第一章
      currentChapter.push(line);
    }
  }
  
  // 保存最后一章
  if (currentChapter.length > 0 && currentChapter.some(l => l.trim())) {
    chapters.push(currentChapter.join('\n'));
  }
  
  // 如果没有检测到章节，把整个文本作为一章
  if (chapters.length === 0) {
    chapters.push(text);
  }
  
  // 如果第一章内容太少（可能只是书名），合并到第二章
  if (chapters.length > 1 && chapters[0].length < 200) {
    chapters[1] = chapters[0] + '\n\n' + chapters[1];
    chapters.shift();
  }
  
  return chapters;
}

const TextViewer: React.FC<{ filePath: string; filename: string; fileSize?: number; onClose?: () => void }> = ({ filePath, filename, fileSize, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<ThemeKey>('paper');
  const [brightness, setBrightness] = useState(100); // 亮度 50-150
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);
  const [statusText, setStatusText] = useState('准备中...');
  const [fromCache, setFromCache] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [activePanel, setActivePanel] = useState<'none' | 'settings' | 'themes'>('none');
  
  // 分页相关 - 按章节分页
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageContent, setPageContent] = useState(''); // 当前章节内容
  const chaptersRef = useRef<string[]>([]); // 用 ref 存储章节数组
  const fullTextRef = useRef<string>(''); // 用于缓存的完整文本
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 当前主题是否为深色
  const isCurrentDark = isDarkTheme(theme);

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    setLoadProgress(0);
    setLoadedSize(0);
    setFromCache(false);
    setStatusText('准备中...');
    
    const loadFile = async () => {
      const timings: Record<string, number> = {};
      const startTime = performance.now();
      
      try {
        // 1. 先检查缓存
        timings.cacheCheckStart = performance.now() - startTime;
        console.log(`🔍 [检查缓存] 路径: ${filePath}`);
        const cachedContent = await fileCache.get(filePath);
        timings.cacheCheckEnd = performance.now() - startTime;
        
        if (cachedContent && !cancelled) {
          console.log(`📚 [缓存命中!] 耗时: ${(timings.cacheCheckEnd - timings.cacheCheckStart).toFixed(0)}ms, 大小: ${(cachedContent.length / 1024 / 1024).toFixed(2)}MB`);
          const chapters = splitByChapters(cachedContent);
          chaptersRef.current = chapters;
          fullTextRef.current = cachedContent;
          setPageContent(chapters[0] || '');
          setTotalPages(chapters.length);
          setCurrentPage(0);
          setFromCache(true);
          setLoadProgress(100);
          setLoading(false);
          console.log(`📖 [章节分割] 共 ${chapters.length} 章`);
          return;
        }
        
        console.log(`❌ [缓存未命中] 开始下载...`);
        
        // 2. 获取文件 URL
        setStatusText('正在连接...');
        timings.urlStart = performance.now() - startTime;
        const url = await getProxyUrl(filePath);
        timings.urlEnd = performance.now() - startTime;
        console.log(`🔗 [获取URL] 耗时: ${(timings.urlEnd - timings.urlStart).toFixed(0)}ms`);
        if (cancelled) return;
        
        // 3. 下载文件
        timings.downloadStart = performance.now() - startTime;
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) throw new Error('加载失败');
        
        const contentLength = response.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength) : fileSize || 0;
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应');
        
        setStatusText('正在下载...');
        const chunks: Uint8Array[] = [];
        let receivedSize = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (cancelled) return;
          if (done) break;
          
          chunks.push(value);
          receivedSize += value.length;
          setLoadedSize(receivedSize);
          if (totalSize > 0) {
            setLoadProgress(Math.round((receivedSize / totalSize) * 100));
          }
        }
        
        timings.downloadEnd = performance.now() - startTime;
        console.log(`⬇️ [下载完成] 耗时: ${(timings.downloadEnd - timings.downloadStart).toFixed(0)}ms, 大小: ${(receivedSize / 1024 / 1024).toFixed(2)}MB`);
        
        if (cancelled) return;
        
        // 4. 合并数据 - 使用 requestIdleCallback 避免阻塞
        setStatusText('正在处理...');
        timings.mergeStart = performance.now() - startTime;
        
        // 合并 chunks
        const allChunks = new Uint8Array(receivedSize);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        timings.mergeEnd = performance.now() - startTime;
        console.log(`🔧 [合并数据] 耗时: ${(timings.mergeEnd - timings.mergeStart).toFixed(0)}ms`);
        
        // 5. 解码文本
        timings.decodeStart = performance.now() - startTime;
        let text = new TextDecoder('utf-8').decode(allChunks);
        
        // 简单检测：如果有大量乱码字符，尝试 GBK
        const badCharCount = (text.match(/\ufffd/g) || []).length;
        if (badCharCount > text.length * 0.01) {
          try {
            text = new TextDecoder('gbk').decode(allChunks);
          } catch {
            // 保持 UTF-8 结果
          }
        }
        timings.decodeEnd = performance.now() - startTime;
        console.log(`📝 [解码文本] 耗时: ${(timings.decodeEnd - timings.decodeStart).toFixed(0)}ms`);
        
        if (!cancelled) {
          // 6. 按章节分割并显示
          timings.renderStart = performance.now() - startTime;
          const chapters = splitByChapters(text);
          chaptersRef.current = chapters;
          fullTextRef.current = text;
          setPageContent(chapters[0] || '');
          setTotalPages(chapters.length);
          setCurrentPage(0);
          setLoading(false);
          timings.renderEnd = performance.now() - startTime;
          console.log(`🎨 [显示内容] 耗时: ${(timings.renderEnd - timings.renderStart).toFixed(0)}ms, 总章数: ${chapters.length}`);
          
          // 7. 延迟缓存 - 使用 setTimeout 确保 UI 先更新
          setTimeout(() => {
            timings.cacheStart = performance.now() - startTime;
            console.log(`💾 [开始缓存] 路径: ${filePath}, 大小: ${(text.length / 1024 / 1024).toFixed(2)}MB`);
            fileCache.set(filePath, text).then((result) => {
              timings.cacheEnd = performance.now() - startTime;
              console.log(`💾 [缓存结果] ${result}, 耗时: ${(timings.cacheEnd - timings.cacheStart).toFixed(0)}ms`);
            }).catch((err) => {
              console.error('💾 [缓存失败]', err);
            });
          }, 100);
          
          console.log(`✅ [总耗时] ${(performance.now() - startTime).toFixed(0)}ms`);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('TextViewer error:', err);
        setError(err instanceof Error ? err.message : '加载失败');
        setLoading(false);
      }
    };
    
    loadFile();
    return () => { cancelled = true; };
  }, [filePath, fileSize]);

  // 加载界面
  if (loading) {
    const progress = loadProgress || 0;
    const loadedMB = (loadedSize / 1024 / 1024).toFixed(1);
    const totalMB = fileSize ? (fileSize / 1024 / 1024).toFixed(1) : '?';
    const isProcessing = statusText === '正在处理...';
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center px-8">
          {/* 书籍图标 */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg transform rotate-6 opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg transform -rotate-3 opacity-80"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg shadow-lg flex items-center justify-center">
              {isProcessing ? (
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
              )}
            </div>
          </div>
          
          {/* 书名 */}
          <h3 className="text-base font-medium text-gray-700 mb-4 max-w-xs mx-auto truncate">
            {filename.replace(/\.(txt|md)$/i, '')}
          </h3>
          
          {/* 进度条 */}
          <div className="w-56 mx-auto">
            <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  isProcessing 
                    ? 'bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400 animate-pulse' 
                    : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`}
                style={{ width: `${Math.max(progress, 3)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{statusText}</span>
              {progress > 0 && !isProcessing && <span>{loadedMB} / {totalMB} MB</span>}
              {isProcessing && <span>即将完成</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误界面
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">加载失败</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const currentTheme = READING_THEMES[theme];
  const progressPercent = totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0;

  // 阅读界面 - 起点读书风格
  return (
    <div 
      className="w-full h-full flex flex-col transition-colors duration-300 relative"
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* 顶部状态栏 */}
      <div 
        className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ backgroundColor: isCurrentDark ? '#16162a' : 'rgba(255,255,255,0.95)' }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 返回按钮 */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 -ml-1 rounded-lg transition-colors hover:bg-white/10"
                title="返回"
              >
                <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.7)' : '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* 书名 */}
            <span 
              className="text-sm font-medium truncate max-w-[180px]"
              style={{ color: isCurrentDark ? 'rgba(255,255,255,0.9)' : '#333' }}
            >
              {filename.replace(/\.(txt|md)$/i, '')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* 缓存标识 */}
            {fromCache && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#ff6b6b]/20 text-[#ff6b6b]">
                ⚡ 缓存
              </span>
            )}
            {/* 目录按钮 */}
            <button 
              className="p-1 rounded-lg transition-colors hover:bg-white/10"
              title="目录"
            >
              <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.7)' : '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* 更多按钮 */}
            <button 
              className="p-1 rounded-lg transition-colors hover:bg-white/10"
              title="更多"
            >
              <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.7)' : '#666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* 内容区域 - 点击显示/隐藏工具栏 */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-auto hide-scrollbar pt-14"
        style={{
          filter: brightness !== 100 ? `brightness(${brightness / 100})` : undefined,
        }}
        onClick={() => {
          if (activePanel !== 'none') {
            setActivePanel('none');
          } else {
            setShowToolbar(!showToolbar);
          }
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-4 pb-44 md:px-10">
          <article 
            className="font-serif"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              color: currentTheme.text,
            }}
          >
            {/* 传统排版：标题居中、正文首行缩进 */}
            {pageContent.split(/\n+/).filter(p => p.trim()).map((paragraph, idx) => {
              const text = paragraph.trim();
              
              // 检测书名和作者（如：《斗破苍穹》 天蚕土豆）
              const isBookTitle = /^《.+》/.test(text) && text.length < 50;
              
              // 检测是否是章节标题
              const isChapterTitle = /^(第[一二三四五六七八九十百千万\d]+[章节卷部篇回集幕]|Chapter\s*\d+|卷[一二三四五六七八九十\d]+|序[章言]?|楔子|尾声|后记|前言|引子)/i.test(text) 
                && text.length < 50;
              
              if (isBookTitle) {
                return (
                  <h2 
                    key={idx}
                    style={{ 
                      textAlign: 'center',
                      margin: '1em 0 1.5em 0',
                      fontWeight: 600,
                      fontSize: `${fontSize + 4}px`,
                    }}
                  >
                    {text}
                  </h2>
                );
              }
              
              if (isChapterTitle) {
                return (
                  <h3 
                    key={idx}
                    style={{ 
                      textAlign: 'center',
                      margin: '1.5em 0 1em 0',
                      fontWeight: 500,
                      fontSize: `${fontSize + 2}px`,
                    }}
                  >
                    {text}
                  </h3>
                );
              }
              
              return (
                <p 
                  key={idx}
                  style={{ 
                    textIndent: '2em',
                    textAlign: 'justify',
                    margin: 0,
                  }}
                >
                  {text}
                </p>
              );
            })}
          </article>
        </div>
      </div>
      
      {/* 底部工具栏 - 起点风格 */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
          showToolbar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ backgroundColor: isCurrentDark ? '#16162a' : '#fff' }}
      >
        {/* 设置面板 */}
        {activePanel === 'settings' && (
          <div 
            className="px-5 py-5 border-t"
            style={{ 
              backgroundColor: isCurrentDark ? '#16162a' : '#fff',
              borderColor: isCurrentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 亮度调节 */}
            <div className="flex items-center gap-4 mb-5">
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: isCurrentDark ? '#666' : '#999' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ff6b6b 0%, #ffc371 ${(brightness - 50)}%, ${isCurrentDark ? '#333' : '#e5e7eb'} ${(brightness - 50)}%, ${isCurrentDark ? '#333' : '#e5e7eb'} 100%)`
                }}
                title="亮度调节"
              />
              <span className="text-xs w-8 text-right" style={{ color: isCurrentDark ? '#888' : '#666' }}>{brightness}%</span>
            </div>
            
            {/* 字号调节 */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-xs w-4 flex-shrink-0" style={{ color: isCurrentDark ? '#666' : '#999' }}>A</span>
              <div className="flex-1 flex items-center justify-between gap-2">
                {[14, 16, 18, 20, 22, 24].map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: fontSize === size ? 'linear-gradient(135deg, #ff6b6b, #ffc371)' : (isCurrentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                      color: fontSize === size ? '#fff' : (isCurrentDark ? '#888' : '#666')
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <span className="text-sm w-4 flex-shrink-0 font-bold" style={{ color: isCurrentDark ? '#666' : '#999' }}>A</span>
            </div>
            
            {/* 行距调节 */}
            <div className="flex items-center gap-4">
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: isCurrentDark ? '#666' : '#999' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <div className="flex-1 flex items-center justify-between gap-2">
                {[1.5, 1.8, 2.0, 2.2, 2.5].map(h => (
                  <button
                    key={h}
                    onClick={() => setLineHeight(h)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: lineHeight === h ? 'linear-gradient(135deg, #ff6b6b, #ffc371)' : (isCurrentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                      color: lineHeight === h ? '#fff' : (isCurrentDark ? '#888' : '#666')
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div className="w-4" />
            </div>
          </div>
        )}
        
        {/* 主题选择面板 */}
        {activePanel === 'themes' && (
          <div 
            className="px-5 py-5 border-t max-h-72 overflow-y-auto"
            style={{ 
              backgroundColor: isCurrentDark ? '#16162a' : '#fff',
              borderColor: isCurrentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.entries(THEME_CATEGORIES).map(([catKey, catInfo]) => {
              const themesInCategory = (Object.keys(READING_THEMES) as ThemeKey[]).filter(
                k => READING_THEMES[k].category === catKey
              );
              if (themesInCategory.length === 0) return null;
              
              return (
                <div key={catKey} className="mb-4 last:mb-0">
                  <div className="text-[10px] font-medium mb-2 uppercase tracking-wider" style={{ color: isCurrentDark ? '#555' : '#aaa' }}>
                    {catInfo.icon} {catInfo.name}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {themesInCategory.map(key => (
                      <button
                        key={key}
                        onClick={() => setTheme(key)}
                        className="relative p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ 
                          backgroundColor: READING_THEMES[key].bg,
                          boxShadow: isDarkTheme(key) 
                            ? 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)' 
                            : '0 2px 8px rgba(0,0,0,0.08)',
                          outline: theme === key ? '2px solid #ff6b6b' : 'none',
                          outlineOffset: '2px'
                        }}
                      >
                        <div 
                          className="text-[10px] font-medium text-center"
                          style={{ color: READING_THEMES[key].text }}
                        >
                          {READING_THEMES[key].name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 进度条 */}
        <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop: `1px solid ${isCurrentDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: isCurrentDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #ff6b6b, #ffc371)'
              }}
            />
          </div>
          <span className="text-xs" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{progressPercent}%</span>
        </div>
        
        {/* 底部功能按钮 */}
        <div className="px-4 pb-3 flex items-center justify-around">
          {/* 上一章 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentPage > 0) {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                setPageContent(chaptersRef.current[newPage] || '');
                scrollRef.current?.scrollTo(0, 0);
              }
            }}
            disabled={currentPage === 0}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              currentPage === 0 ? 'opacity-30' : 'hover:bg-white/5'
            }`}
            title="上一章"
          >
            <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px]" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>上一章</span>
          </button>
          
          {/* 夜间模式切换 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTheme(isCurrentDark ? 'paper' : 'night');
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-white/5"
            title={isCurrentDark ? '日间模式' : '夜间模式'}
          >
            <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCurrentDark ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            <span className="text-[10px]" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{isCurrentDark ? '日间' : '夜间'}</span>
          </button>
          
          {/* 主题 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActivePanel(activePanel === 'themes' ? 'none' : 'themes');
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-white/5"
            title="主题"
          >
            <div 
              className="w-5 h-5 rounded-full border-2"
              style={{ 
                backgroundColor: currentTheme.bg,
                borderColor: isCurrentDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
              }}
            />
            <span className="text-[10px]" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>主题</span>
          </button>
          
          {/* 设置 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActivePanel(activePanel === 'settings' ? 'none' : 'settings');
            }}
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-white/5"
            title="设置"
          >
            <svg className="w-5 h-5" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px]" style={{ color: isCurrentDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>设置</span>
          </button>
          
          {/* 下一章按钮 - 渐变样式 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentPage < totalPages - 1) {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                setPageContent(chaptersRef.current[newPage] || '');
                scrollRef.current?.scrollTo(0, 0);
              }
            }}
            disabled={currentPage >= totalPages - 1}
            className={`px-4 py-2 rounded-full transition-all ${
              currentPage >= totalPages - 1 ? 'opacity-30' : 'hover:opacity-90 active:scale-95'
            }`}
            style={{ background: 'linear-gradient(135deg, #ff6b6b, #ffc371)' }}
            title="下一章"
          >
            <span className="text-white text-xs font-medium">下一章</span>
          </button>
        </div>
      </div>
      
    </div>
  );
};

// ==================== PDF 查看器 ====================
const PdfViewer: React.FC<{ url: string }> = ({ url }) => {
  return (
    <div className="w-full h-full bg-white">
      <iframe 
        src={`${url}#toolbar=0`}
        className="w-full h-full border-0"
        title="PDF Viewer"
      />
    </div>
  );
};

// ==================== 文档查看器 ====================
const DocumentViewer: React.FC<{ url: string; filename: string }> = ({ url, filename }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 尝试通过代理获取文本内容
    setLoading(true);
    setError(false);
    
    fetch(url)
      .then(res => {
        const contentType = res.headers.get('content-type') || '';
        // 检查是否是文本类型
        if (contentType.includes('text') || contentType.includes('json') || res.ok) {
          return res.text();
        }
        throw new Error('Not text');
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    // 加载失败时提供在新窗口打开的选项
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">{filename}</h3>
          <p className="text-sm text-gray-500 mb-4">无法在应用内加载，请在新窗口打开</p>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium rounded-xl"
          >
            在新窗口打开
          </a>
        </div>
      </div>
    );
  }

  // 成功加载，显示内容
  return (
    <div className="w-full h-full bg-amber-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed break-words">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ==================== 电子书查看器 ====================
const EbookViewer: React.FC<{ url: string; filename: string }> = ({ url, filename }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  // EPUB 可以尝试用 iframe 加载（部分浏览器支持）
  // 其他格式显示提示
  if (ext === 'epub') {
    return (
      <div className="w-full h-full bg-amber-50">
        <iframe 
          src={url}
          className="w-full h-full border-0 bg-white"
          title={filename}
        />
      </div>
    );
  }
  
  // MOBI/AZW3 等格式浏览器不支持直接阅读
  return (
    <div className="w-full h-full bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2">{filename}</h3>
        <p className="text-sm text-gray-500 mb-2">{ext?.toUpperCase()} 格式暂不支持在线阅读</p>
        <p className="text-xs text-gray-400">后续版本将支持更多格式</p>
      </div>
    </div>
  );
};

// ==================== 音频播放器 ====================
const AudioPlayer: React.FC<{ url: string; filename: string }> = ({ url, filename }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl mb-8">
        <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <h3 className="text-white text-xl font-semibold mb-4">{filename}</h3>
      <audio src={url} controls className="w-full max-w-md" />
    </div>
  );
};

export default FileViewer;

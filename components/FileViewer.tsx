import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { getFileUrl, getPreviewUrl, getProxyUrl } from '@/src/api/alist';
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
            return await getProxyUrl(file.path);
          } else {
            return await getFileUrl(file.path);
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
        if (file.category === 'video') {
          setFileUrl('https://www.w3schools.com/html/mov_bbb.mp4');
        }
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

      {/* 顶部返回按钮 - 仅在视频/音频等全屏内容时显示 */}
      {(file.category === 'video' || file.category === 'audio' || file.category === 'image') && (
        <button 
          onClick={onClose}
          className={`fixed top-6 left-6 z-50 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-black/50 active:scale-95 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      )}

      {/* 底部文件名 - 仅在视频/音频等全屏内容时显示 */}
      {(file.category === 'video' || file.category === 'audio' || file.category === 'image') && (
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

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, filename, initialProgress, onProgressChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const saveTimerRef = useRef<number | null>(null);

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
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={url}
        className="max-w-full max-h-full"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {/* 播放按钮覆盖 */}
      {!isPlaying && (
        <button 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/40 hover:bg-white/40 transition-colors">
            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* 进度条 */}
      <div className="absolute bottom-20 left-6 right-6">
        <div 
          className="h-1 bg-white/30 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/70 text-xs">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== 阅读主题配置 ====================
const READING_THEMES = {
  paper: { bg: '#F5F5DC', text: '#3D3D3D', name: '羊皮纸' },
  green: { bg: '#C7EDCC', text: '#2D4A2D', name: '护眼绿' },
  night: { bg: '#1A1A2E', text: '#E8E8E8', name: '夜间' },
  white: { bg: '#FFFFFF', text: '#333333', name: '白色' },
  sepia: { bg: '#FBF0D9', text: '#5B4636', name: '怀旧' },
};

type ThemeKey = keyof typeof READING_THEMES;

// ==================== 文本阅读器 ====================
// 每页字符数（约 3-5 屏内容）
const CHARS_PER_PAGE = 8000;

const TextViewer: React.FC<{ filePath: string; filename: string; fileSize?: number; onClose?: () => void }> = ({ filePath, filename, fileSize, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<ThemeKey>('paper');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [statusText, setStatusText] = useState('准备中...');
  const [fromCache, setFromCache] = useState(false);
  
  // 分页相关 - 使用 ref 存储大文本，避免 React state 处理大数据
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageContent, setPageContent] = useState(''); // 只存当前页内容
  const fullTextRef = useRef<string>(''); // 用 ref 存储完整文本
  const scrollRef = useRef<HTMLDivElement>(null);

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
        const cachedContent = await fileCache.get(filePath);
        timings.cacheCheckEnd = performance.now() - startTime;
        
        if (cachedContent && !cancelled) {
          console.log(`📚 [缓存命中] 耗时: ${(timings.cacheCheckEnd - timings.cacheCheckStart).toFixed(0)}ms, 大小: ${(cachedContent.length / 1024 / 1024).toFixed(2)}MB`);
          const pages = Math.ceil(cachedContent.length / CHARS_PER_PAGE);
          fullTextRef.current = cachedContent; // 存到 ref
          setPageContent(cachedContent.slice(0, CHARS_PER_PAGE)); // 只设置第一页
          setTotalPages(pages);
          setCurrentPage(0);
          setFromCache(true);
          setLoadProgress(100);
          setLoading(false);
          return;
        }
        
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
          // 6. 计算分页并显示（只设置第一页内容，避免卡顿）
          timings.renderStart = performance.now() - startTime;
          const pages = Math.ceil(text.length / CHARS_PER_PAGE);
          fullTextRef.current = text; // 存到 ref，不触发渲染
          setPageContent(text.slice(0, CHARS_PER_PAGE)); // 只设置第一页
          setTotalPages(pages);
          setCurrentPage(0);
          setLoading(false);
          timings.renderEnd = performance.now() - startTime;
          console.log(`🎨 [显示内容] 耗时: ${(timings.renderEnd - timings.renderStart).toFixed(0)}ms, 总页数: ${pages}`);
          
          // 7. 延迟缓存 - 使用 setTimeout 确保 UI 先更新
          setTimeout(() => {
            timings.cacheStart = performance.now() - startTime;
            fileCache.set(filePath, text).then(() => {
              timings.cacheEnd = performance.now() - startTime;
              console.log(`💾 [缓存完成] 耗时: ${(timings.cacheEnd - timings.cacheStart).toFixed(0)}ms`);
            }).catch(() => {});
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

  // 阅读界面
  return (
    <div 
      className="w-full h-full flex flex-col transition-colors duration-300"
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* 顶部工具栏 */}
      <div 
        className="flex-shrink-0 px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
        style={{ 
          backgroundColor: theme === 'night' ? 'rgba(30,30,50,0.9)' : 'rgba(255,255,255,0.9)',
          borderBottom: `1px solid ${theme === 'night' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}` 
        }}
      >
        {/* 返回按钮 */}
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 -ml-2 rounded-xl transition-colors ${
              theme === 'night' 
                ? 'hover:bg-white/10 text-gray-400' 
                : 'hover:bg-black/5 text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* 标题 + 缓存标识 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <h1 
            className="text-sm font-medium truncate"
            style={{ color: theme === 'night' ? '#ccc' : '#666' }}
          >
            {filename.replace(/\.(txt|md)$/i, '')}
          </h1>
          {fromCache && (
            <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
              theme === 'night' ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              已缓存
            </span>
          )}
        </div>
        
        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl transition-colors ${
            theme === 'night' 
              ? 'hover:bg-white/10 text-gray-400' 
              : 'hover:bg-black/5 text-gray-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div 
          className="flex-shrink-0 px-4 py-4 border-b"
          style={{ 
            backgroundColor: theme === 'night' ? 'rgba(30,30,50,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: theme === 'night' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }}
        >
          {/* 字体大小 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: theme === 'night' ? '#aaa' : '#666' }}>字号</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setFontSize(s => Math.max(14, s - 2))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                  theme === 'night' ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-600'
                }`}
              >
                A-
              </button>
              <span className="w-8 text-center text-sm" style={{ color: theme === 'night' ? '#ccc' : '#666' }}>{fontSize}</span>
              <button 
                onClick={() => setFontSize(s => Math.min(28, s + 2))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                  theme === 'night' ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-600'
                }`}
              >
                A+
              </button>
            </div>
          </div>
          
          {/* 行距 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: theme === 'night' ? '#aaa' : '#666' }}>行距</span>
            <div className="flex items-center gap-2">
              {[1.5, 1.8, 2.0, 2.2].map(h => (
                <button
                  key={h}
                  onClick={() => setLineHeight(h)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    lineHeight === h 
                      ? 'bg-orange-500 text-white' 
                      : theme === 'night' ? 'bg-white/10 text-gray-400' : 'bg-black/5 text-gray-500'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          
          {/* 主题 */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm" style={{ color: theme === 'night' ? '#aaa' : '#666' }}>主题</span>
            <div className="flex items-center gap-2">
              {(Object.keys(READING_THEMES) as ThemeKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    theme === key ? 'scale-110 border-orange-500' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: READING_THEMES[key].bg }}
                  title={READING_THEMES[key].name}
                />
              ))}
            </div>
          </div>
          
          {/* 缓存设置 */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm" style={{ color: theme === 'night' ? '#aaa' : '#666' }}>缓存</span>
              <p className="text-xs mt-0.5" style={{ color: theme === 'night' ? '#666' : '#999' }}>
                {(() => {
                  const mode = fileCache.getCacheMode();
                  if (mode.mode === 'local') return `📁 ${mode.folderName}`;
                  return '🗃️ IndexedDB (2GB)';
                })()}
              </p>
            </div>
            {fileCache.isLocalFolderSupported() && (
              <button
                onClick={async () => {
                  await fileCache.selectLocalFolder();
                  // 触发重新渲染
                  setShowSettings(false);
                  setTimeout(() => setShowSettings(true), 0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  theme === 'night' ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-600'
                }`}
              >
                {fileCache.getCacheMode().mode === 'local' ? '更换文件夹' : '设置文件夹'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* 内容区域 */}
      <div ref={scrollRef} className="flex-1 overflow-auto hide-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-8 md:px-12 md:py-12">
          <article 
            className="font-serif whitespace-pre-wrap break-words"
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              color: currentTheme.text,
              textAlign: 'justify',
            }}
          >
            {pageContent}
          </article>
        </div>
      </div>
      
      {/* 分页导航 - 只在多页时显示 */}
      {totalPages > 1 && (
        <div 
          className="flex-shrink-0 px-4 py-3 flex items-center justify-between border-t"
          style={{ 
            backgroundColor: theme === 'night' ? 'rgba(30,30,50,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: theme === 'night' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
          }}
        >
          {/* 上一页 */}
          <button
            onClick={() => {
              const newPage = Math.max(0, currentPage - 1);
              setCurrentPage(newPage);
              setPageContent(fullTextRef.current.slice(newPage * CHARS_PER_PAGE, (newPage + 1) * CHARS_PER_PAGE));
              scrollRef.current?.scrollTo(0, 0);
            }}
            disabled={currentPage === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 0
                ? 'opacity-30 cursor-not-allowed'
                : theme === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-gray-600 hover:bg-black/10'
            }`}
          >
            ← 上一页
          </button>
          
          {/* 页码显示 + 跳转 */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: theme === 'night' ? '#aaa' : '#666' }}>
              {currentPage + 1} / {totalPages}
            </span>
            {totalPages > 10 && (
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage + 1}
                onChange={(e) => {
                  const newPage = Math.max(0, Math.min(totalPages - 1, (parseInt(e.target.value) || 1) - 1));
                  setCurrentPage(newPage);
                  setPageContent(fullTextRef.current.slice(newPage * CHARS_PER_PAGE, (newPage + 1) * CHARS_PER_PAGE));
                  scrollRef.current?.scrollTo(0, 0);
                }}
                className={`w-16 px-2 py-1 rounded text-center text-sm ${
                  theme === 'night' ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-700'
                }`}
              />
            )}
          </div>
          
          {/* 下一页 */}
          <button
            onClick={() => {
              const newPage = Math.min(totalPages - 1, currentPage + 1);
              setCurrentPage(newPage);
              setPageContent(fullTextRef.current.slice(newPage * CHARS_PER_PAGE, (newPage + 1) * CHARS_PER_PAGE));
              scrollRef.current?.scrollTo(0, 0);
            }}
            disabled={currentPage >= totalPages - 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage >= totalPages - 1
                ? 'opacity-30 cursor-not-allowed'
                : theme === 'night' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-gray-600 hover:bg-black/10'
            }`}
          >
            下一页 →
          </button>
        </div>
      )}
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

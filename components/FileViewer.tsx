import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { getFileUrl, getPreviewUrl, getProxyUrl } from '@/src/api/alist';
import { progressService, ReadingProgress } from '@/src/api/pocketbase';
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

  // 获取文件直链和已保存的进度
  useEffect(() => {
    loadFileUrl();
    loadSavedProgress();
  }, [file.path]);

  const loadSavedProgress = async () => {
    try {
      const progress = await progressService.get(file.path);
      setSavedProgress(progress);
    } catch (err) {
      console.log('获取进度失败 (可能未连接 PocketBase)');
    }
  };

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
      console.log('保存进度失败 (可能未连接 PocketBase)');
    }
  };

  const loadFileUrl = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 对于文档和电子书，使用代理 URL（直接返回内容）
      if (file.category === 'document' || file.category === 'ebook') {
        const url = await getProxyUrl(file.path);
        setFileUrl(url);
      } else {
        const url = await getFileUrl(file.path);
        setFileUrl(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件失败');
      // 使用 Mock URL
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
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-white/70">加载中...</p>
        </div>
      );
    }

    if (error && !fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/70">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium">无法加载文件</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={loadFileUrl}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
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
        if (file.name.endsWith('.pdf')) {
          return <PdfViewer url={fileUrl!} />;
        }
        return <TextViewer url={fileUrl!} filename={file.name} fileSize={file.size} />;
      
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
      {/* 内容区域 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {renderContent()}
      </div>

      {/* 顶部返回按钮 */}
      <button 
        onClick={onClose}
        className={`fixed top-6 left-6 z-50 w-11 h-11 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-black/50 active:scale-95 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      {/* 底部文件名 */}
      <div className={`fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${
        controlsVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <h2 className="text-white font-semibold text-lg truncate">{file.name}</h2>
        <p className="text-white/60 text-sm mt-1">{file.path}</p>
      </div>
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

// ==================== 文本阅读器 ====================
const TextViewer: React.FC<{ url: string; filename: string; fileSize?: number }> = ({ url, filename, fileSize }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);

  useEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    setLoadProgress(0);
    setLoadedSize(0);
    
    const loadFile = async () => {
      try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) throw new Error('加载失败');
        
        const contentLength = response.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength) : fileSize || 0;
        
        // 使用流式读取显示进度
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法读取响应');
        }
        
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
        
        if (cancelled) return;
        
        // 合并所有块
        const allChunks = new Uint8Array(receivedSize);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        // 尝试检测编码并解码
        let text = '';
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          text = decoder.decode(allChunks);
          // 检查是否有乱码
          if (text.includes('\ufffd')) {
            throw new Error('UTF-8 decode failed');
          }
        } catch {
          // UTF-8 失败，尝试 GBK
          try {
            const gbkDecoder = new TextDecoder('gbk');
            text = gbkDecoder.decode(allChunks);
          } catch {
            // 最后尝试 gb18030
            const gb18030Decoder = new TextDecoder('gb18030');
            text = gb18030Decoder.decode(allChunks);
          }
        }
        
        if (!cancelled) {
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('TextViewer error:', err);
        setPreviewUrl(url);
        setError('CORS');
        setLoading(false);
      }
    };
    
    loadFile();
    
    return () => { cancelled = true; };
  }, [url, fileSize]);

  if (loading) {
    const sizeText = loadedSize > 0 
      ? `${(loadedSize / 1024 / 1024).toFixed(1)} MB` 
      : '';
    const totalText = fileSize 
      ? ` / ${(fileSize / 1024 / 1024).toFixed(1)} MB`
      : '';
      
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">
            {loadProgress > 0 ? `加载中 ${loadProgress}%` : '加载中...'}
          </p>
          {loadedSize > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {sizeText}{totalText}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    // CORS 错误时显示替代方案
    if (error === 'CORS' && previewUrl) {
      return (
        <div className="w-full h-full bg-amber-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{filename}</h3>
            <p className="text-sm text-gray-500 mb-6">由于网盘限制，请选择以下方式阅读</p>
            <div className="space-y-3">
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all"
              >
                📖 在新窗口打开
              </button>
              <a
                href={previewUrl}
                download={filename}
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all text-center"
              >
                ⬇️ 下载到本地
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              提示：在 Alist 中为存储启用"Web代理"可实现应用内阅读
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">加载失败</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-amber-50 flex flex-col">
      {/* 工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <span className="text-sm text-gray-600 truncate max-w-xs">{filename}</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFontSize(s => Math.max(12, s - 2))}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
          >
            A-
          </button>
          <span className="text-xs text-gray-500 w-8 text-center">{fontSize}</span>
          <button 
            onClick={() => setFontSize(s => Math.min(24, s + 2))}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
          >
            A+
          </button>
        </div>
      </div>
      
      {/* 内容 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8">
          <pre 
            className="whitespace-pre-wrap font-serif text-gray-800 leading-relaxed"
            style={{ fontSize: `${fontSize}px` }}
          >
            {content}
          </pre>
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

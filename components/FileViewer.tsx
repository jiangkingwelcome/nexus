import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { getFileUrl } from '@/src/api/alist';
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
      const url = await getFileUrl(file.path);
      setFileUrl(url);
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
        return <DocumentViewer url={fileUrl!} filename={file.name} />;
      
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
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    if (filename.endsWith('.md') || filename.endsWith('.txt')) {
      fetch(url)
        .then(res => res.text())
        .then(setContent)
        .catch(() => setContent('无法加载文档内容'));
    }
  }, [url, filename]);

  if (filename.endsWith('.md')) {
    return (
      <div className="w-full h-full bg-white overflow-auto p-8">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white overflow-auto p-8">
      <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">{content}</pre>
    </div>
  );
};

// ==================== 电子书查看器 ====================
const EbookViewer: React.FC<{ url: string; filename: string }> = ({ url, filename }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white/70">
      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="text-lg font-medium">EPUB 阅读器</p>
      <p className="text-sm mt-1">{filename}</p>
      <p className="text-xs mt-4 text-white/50">EPUB 支持开发中，敬请期待</p>
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

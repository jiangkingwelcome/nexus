import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import HomeSection from './components/HomeSection';
import FileBrowser from './components/FileBrowser';
import BookShelf from './components/BookShelf';
import BottomDock from './components/BottomDock';
import Sidebar from './components/Sidebar';
import FileViewer from './components/FileViewer';
import SettingsPage from './components/SettingsPage';
import { NavTab, FileItem, FileCategory } from './types';
import { APP_ENTRIES } from './constants';
import { PATH_CONFIG } from './src/config';

// 获取 Tab 对应的基础路径
const getBasePath = (tab: NavTab): string => {
  const entry = APP_ENTRIES.find(e => e.tab === tab);
  return entry?.basePath || '/';
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  // 处理 Tab 切换，同时设置对应的基础路径
  const handleTabChange = useCallback((tab: NavTab) => {
    setActiveTab(tab);
    // 切换到新 Tab 时，重置路径为该功能的基础路径
    const basePath = getBasePath(tab);
    setCurrentPath(basePath);
  }, []);

  // 处理文件点击
  const handleFileClick = (file: FileItem) => {
    if (file.isDir) {
      // 进入文件夹
      setCurrentPath(file.path);
    } else {
      // 打开文件查看器
      setViewingFile(file);
    }
  };

  // 处理返回上级目录
  const handleNavigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  // 处理导航到指定路径
  const handleNavigateTo = (path: string) => {
    setCurrentPath(path);
  };

  // 渲染主内容
  const renderContent = () => {
    switch (activeTab) {
      case NavTab.HOME:
        return <HomeSection onNavigate={handleTabChange} />;
      
      case NavTab.LIBRARY:
        return (
          <BookShelf 
            path={currentPath}
            basePath={PATH_CONFIG.library.basePath}
            bookShelfPath={PATH_CONFIG.library.bookShelfPath}
            onBookClick={(file) => setViewingFile(file)}
            onFolderClick={(path) => setCurrentPath(path)}
          />
        );
      
      case NavTab.CINEMA:
        return (
          <FileBrowser 
            path={currentPath}
            basePath={PATH_CONFIG.cinema.basePath}
            filter={['video', 'folder']}
            title="电影院"
            emptyMessage="还没有视频，去文件管理添加吧"
            onFileClick={handleFileClick}
            onNavigateUp={handleNavigateUp}
            onNavigateTo={handleNavigateTo}
          />
        );
      
      case NavTab.FILES:
        return (
          <FileBrowser 
            path={currentPath}
            basePath={PATH_CONFIG.files.basePath}
            title="文件管理"
            onFileClick={handleFileClick}
            onNavigateUp={handleNavigateUp}
            onNavigateTo={handleNavigateTo}
          />
        );
      
      case NavTab.SETTINGS:
        return <SettingsPage />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* 文件查看器 */}
      {viewingFile && (
        <FileViewer 
          file={viewingFile} 
          onClose={() => setViewingFile(null)} 
        />
      )}

      {/* 背景装饰 */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100 rounded-full blur-[100px] opacity-60 pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[120px] opacity-60 pointer-events-none z-0" />

      {/* 主内容容器 */}
      <div className={`relative z-10 w-full min-h-screen transition-transform duration-300 ${viewingFile ? 'scale-95 opacity-50 pointer-events-none' : 'scale-100 opacity-100'}`}>
        
        {/* 桌面端侧边栏 */}
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* 主内容区域 */}
        <div className="md:ml-64 min-h-screen flex flex-col">
          <div className="w-full max-w-5xl mx-auto md:max-w-none md:mx-0">
            <Header name="Jiangking" />
            
            <main className="animate-fade-in transition-opacity duration-300 min-h-[80vh] w-full max-w-5xl mx-auto md:max-w-none md:mx-0 md:px-6">
              {renderContent()}
            </main>
          </div>
        </div>

        {/* 移动端底部导航 */}
        <BottomDock activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default App;

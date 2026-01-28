import React, { useState } from 'react';
import { MOCK_FILES } from '../constants';
import { FileSystemItem } from '../types';
import { 
  SearchIcon, 
  GridIcon, 
  ListIcon, 
  FolderIcon, 
  FileIcon, 
  VideoIcon, 
  AppWindowIcon,
  FolderOutlineIcon
} from './Icons';

interface ExplorerSectionProps {
  onFileClick?: (file: FileSystemItem) => void;
}

const ExplorerSection: React.FC<ExplorerSectionProps> = ({ onFileClick }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = MOCK_FILES.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (item: FileSystemItem, className: string = "") => {
    switch (item.type) {
      case 'folder': return <FolderOutlineIcon className={className} />;
      case 'video': return <VideoIcon className={className} />;
      case 'app': return <AppWindowIcon className={className} />;
      default: return <FileIcon className={className} />;
    }
  };

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type !== 'folder' && onFileClick) {
      onFileClick(item);
    }
  };

  return (
    <section className="animate-fade-in pb-32">
      {/* Sticky Top Bar - Positioned below the main app Header */}
      <div className="sticky top-[110px] sm:top-[120px] z-20 px-6 py-4 bg-nexus-base/95 backdrop-blur-xl border-b border-nexus-border transition-all">
        {/* Search & Breadcrumbs */}
        <div className="flex flex-col gap-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="搜索文件..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-nexus-plate backdrop-blur-nexus border border-nexus-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-nexus-primary placeholder-nexus-secondary focus:outline-none focus:ring-2 focus:ring-nexus-accent/50 transition-all shadow-sm group-hover:shadow-md"
            />
            <SearchIcon className="absolute left-3.5 top-2.5 w-4 h-4 text-nexus-secondary group-focus-within:text-nexus-accent" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-nexus-secondary overflow-x-auto hide-scrollbar whitespace-nowrap">
              <span className="hover:text-nexus-accent cursor-pointer">首页</span>
              <span className="opacity-40">/</span>
              <span className="hover:text-nexus-accent cursor-pointer">资料库</span>
              <span className="opacity-40">/</span>
              <span className="text-nexus-primary">所有文件</span>
            </div>

            {/* View Toggle */}
            <div className="flex bg-nexus-plate border border-nexus-border rounded-lg p-0.5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-nexus-accent text-white shadow-sm' : 'text-nexus-secondary hover:text-nexus-primary hover:bg-black/5'}`}
                aria-label="Grid View"
              >
                <GridIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-nexus-accent text-white shadow-sm' : 'text-nexus-secondary hover:text-nexus-primary hover:bg-black/5'}`}
                aria-label="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredFiles.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col bg-nexus-plate backdrop-blur-nexus border border-nexus-border rounded-2xl p-2.5 shadow-glass hover:shadow-glow-sm hover:border-nexus-accent/50 transition-all duration-300 cursor-pointer active:scale-95"
              >
                {/* Visual Preview */}
                <div className={`relative w-full aspect-square rounded-xl overflow-hidden mb-3 ${item.type === 'folder' ? 'bg-indigo-50/50 flex items-center justify-center' : 'bg-slate-100'}`}>
                  {item.type === 'folder' ? (
                    <FolderIcon className="w-16 h-16 text-indigo-400 drop-shadow-lg" />
                  ) : item.thumbnailUrl ? (
                    <>
                      <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                           <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/40">
                             <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1"></div>
                           </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      {getFileIcon(item, "w-10 h-10 text-slate-400")}
                    </div>
                  )}

                  {/* App Badge */}
                  {item.type === 'app' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-nexus-accent text-white text-[10px] font-bold rounded-full shadow-lg">
                      APP
                    </div>
                  )}
                  {item.appBadge && item.type !== 'app' && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                      {item.appBadge}
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-nexus-primary truncate leading-tight group-hover:text-nexus-accent transition-colors">{item.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                     <p className="text-[10px] text-nexus-secondary font-medium">{item.size}</p>
                     <p className="text-[10px] text-nexus-secondary/70">{item.modified}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredFiles.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="group flex items-center justify-between bg-nexus-plate/40 backdrop-blur-sm border border-nexus-border rounded-xl p-3 hover:bg-nexus-plate hover:shadow-sm hover:border-nexus-accent/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white/50 border border-white/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {item.type === 'folder' ? <FolderIcon className="w-6 h-6 text-indigo-400" /> : getFileIcon(item, "w-5 h-5 text-nexus-secondary")}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-nexus-primary truncate group-hover:text-nexus-accent transition-colors">{item.name}</span>
                    <span className="text-xs text-nexus-secondary">{item.type.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-nexus-secondary flex-shrink-0">
                   <span className="hidden sm:block">{item.modified}</span>
                   <span className="font-mono w-16 text-right">{item.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExplorerSection;
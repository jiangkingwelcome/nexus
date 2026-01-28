import React, { useState, useEffect, useRef } from 'react';
import { FileSystemItem } from '../types';
import { ArrowLeftIcon, PlusIcon, XIcon, MoreHorizontalIcon } from './Icons';

interface ImmersiveViewerProps {
  file: FileSystemItem;
  onClose: () => void;
}

const ImmersiveViewer: React.FC<ImmersiveViewerProps> = ({ file, onClose }) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hideControlsTimer = useRef<number | null>(null);

  // Handle Escape Key to Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, onClose]);

  // Manage idle detection to fade out controls
  useEffect(() => {
    const handleActivity = () => {
      setControlsVisible(true);
      
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }

      // Hide controls after 3 seconds of inactivity, if drawer is closed
      if (!isDrawerOpen) {
        hideControlsTimer.current = window.setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    };

    // Listen to interactions
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('click', handleActivity);

    // Init timer
    handleActivity();

    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isDrawerOpen]);

  // Prevent controls from hiding if drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      setControlsVisible(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    }
  }, [isDrawerOpen]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in overflow-hidden">
      
      {/* 1. Full Screen Content Area */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-900">
        {file.type === 'image' && file.thumbnailUrl ? (
          <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-contain" />
        ) : file.type === 'video' ? (
          <div className="text-white">Video Player Placeholder</div>
        ) : (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center text-slate-400">
             <div className="text-6xl mb-4 opacity-20">📄</div>
             <p>Viewing {file.name}</p>
             <p className="text-sm mt-2">Content Preview Mockup</p>
          </div>
        )}
      </div>

      {/* 2. Floating Top-Left Back Button */}
      <button 
        onClick={onClose}
        className={`fixed top-6 left-6 z-40 w-11 h-11 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg transition-all duration-500 hover:bg-black/40 active:scale-95 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </button>

      {/* 3. Floating Bottom-Right Action Menu */}
      <div className={`fixed bottom-8 right-6 z-40 flex flex-col gap-4 transition-all duration-500 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        
        <button 
          className="w-12 h-12 rounded-full bg-indigo-600/90 backdrop-blur-md text-white flex items-center justify-center shadow-glow-sm hover:scale-105 active:scale-95 transition-transform"
          onClick={() => setIsDrawerOpen(true)}
        >
          <PlusIcon className="w-6 h-6" />
        </button>

        <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg hover:bg-black/40 active:scale-95 transition-all">
          <MoreHorizontalIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 4. Drawer Component (Notes) */}
      
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-xs z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      ></div>

      {/* Slide-up Panel */}
      <div className={`fixed bottom-0 left-0 right-0 h-[60vh] bg-nexus-plate/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-50 transition-transform duration-300 transform border-t border-nexus-border flex flex-col ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Drawer Handle/Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nexus-border/50">
          <h3 className="text-lg font-bold text-nexus-primary">笔记</h3>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 -mr-2 text-nexus-secondary hover:text-nexus-primary rounded-full hover:bg-black/5 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="h-full rounded-xl bg-nexus-base/50 border border-nexus-border p-4">
             <textarea 
               className="w-full h-full bg-transparent border-none outline-none resize-none text-nexus-primary placeholder-nexus-secondary/70 leading-relaxed"
               placeholder={`Add your thoughts about ${file.name} here...`}
               autoFocus={isDrawerOpen}
             ></textarea>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ImmersiveViewer;
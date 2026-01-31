import React, { useEffect, useState } from 'react';

// 连接状态类型
type ConnectionStatus = 'pending' | 'connecting' | 'success' | 'error';

interface ConnectionState {
  pocketbase: ConnectionStatus;
  message: string;
}

interface LoadingScreenProps {
  onComplete: () => void;
}

// 星座连接动画 Logo 组件
const ConstellationLogo: React.FC<{ isConnecting: boolean }> = ({ isConnecting }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none"
      className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-52 lg:h-52 drop-shadow-2xl"
    >
      <defs>
        <linearGradient id="st1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
          <stop offset="50%" style={{ stopColor: '#f472b6' }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
        </linearGradient>
        <filter id="starglow">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="pulse">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      
      {/* 背景圆 */}
      <circle cx="100" cy="100" r="95" fill="#050510" className="drop-shadow-lg" />
      <circle cx="100" cy="100" r="90" fill="transparent" stroke="url(#st1)" strokeWidth="1" opacity="0.3" />
      
      {/* 连线 - 带动画 */}
      <g 
        stroke="url(#st1)" 
        strokeWidth="2" 
        opacity="0.7"
        className={isConnecting ? 'animate-pulse' : ''}
      >
        <line x1="60" y1="50" x2="100" y2="80">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="80" x2="150" y2="60">
          <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="80" x2="100" y2="130">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="130" x2="50" y2="140">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.2s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="130" x2="160" y2="130">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.6s" repeatCount="indefinite" />
        </line>
        <line x1="150" y1="60" x2="160" y2="130">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2s" repeatCount="indefinite" />
        </line>
      </g>
      
      {/* 星星节点 - 带脉冲动画 */}
      <g filter="url(#starglow)">
        {/* 左上星 */}
        <circle cx="60" cy="50" r="7" fill="url(#st1)">
          <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* 右上星 */}
        <circle cx="150" cy="60" r="6" fill="url(#st1)">
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
        </circle>
        {/* 中心主星 - Nexus 核心 */}
        <circle cx="100" cy="80" r="14" fill="url(#st1)">
          <animate attributeName="r" values="12;16;12" dur="1.5s" repeatCount="indefinite" />
        </circle>
        {/* 中下星 */}
        <circle cx="100" cy="130" r="10" fill="url(#st1)">
          <animate attributeName="r" values="9;12;9" dur="1.7s" repeatCount="indefinite" />
        </circle>
        {/* 左下星 */}
        <circle cx="50" cy="140" r="5" fill="url(#st1)">
          <animate attributeName="r" values="4;6;4" dur="2.2s" repeatCount="indefinite" />
        </circle>
        {/* 右下星 */}
        <circle cx="160" cy="130" r="6" fill="url(#st1)">
          <animate attributeName="r" values="5;7;5" dur="1.9s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* 装饰小星星 */}
      <circle cx="80" cy="60" r="2" fill="#fff" opacity="0.6">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="100" r="1.5" fill="#fff" opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="70" cy="120" r="2" fill="#fff" opacity="0.4">
        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="140" cy="90" r="1.5" fill="#fff" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

// 状态指示器组件
const StatusIndicator: React.FC<{ status: ConnectionStatus; label: string }> = ({ status, label }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending': return 'bg-slate-500';
      case 'connecting': return 'bg-amber-500 animate-pulse';
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-red-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending': return '○';
      case 'connecting': return '◐';
      case 'success': return '✓';
      case 'error': return '✕';
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 text-white/80">
      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${getStatusColor()} transition-all duration-300`} />
      <span className="text-xs sm:text-sm font-medium truncate">{label}</span>
      <span className={`text-xs ml-auto flex-shrink-0 ${
        status === 'success' ? 'text-emerald-400' : 
        status === 'error' ? 'text-red-400' : 
        'text-white/50'
      }`}>
        {getStatusIcon()}
      </span>
    </div>
  );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [state, setState] = useState<ConnectionState>({
    pocketbase: 'pending',
    message: '正在初始化...',
  });

  useEffect(() => {
    const connect = async () => {
      setState(prev => ({ ...prev, pocketbase: 'connecting', message: '正在连接数据中心...' }));

      try {
        const response = await fetch(`${import.meta.env.VITE_PB_URL || 'http://localhost:8090'}/api/health`);
        if (response.ok) {
          setState(prev => ({ ...prev, pocketbase: 'success', message: '数据中心已连接' }));
        } else {
          throw new Error('Service unavailable');
        }
      } catch (error) {
        console.warn('PocketBase 连接失败:', error);
        setState(prev => ({ ...prev, pocketbase: 'error', message: '数据中心连接失败（离线模式）' }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setState(prev => ({ ...prev, message: '准备就绪' }));
      await new Promise(resolve => setTimeout(resolve, 500));
      onComplete();
    };

    connect();
  }, [onComplete]);

  const isConnecting = state.pocketbase === 'connecting';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050510] overflow-hidden px-4">
      {/* 背景星空效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[100px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/10 blur-[80px]" />
        
        {/* 星星背景 */}
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-4 sm:mb-6 md:mb-8 animate-fade-in">
        <ConstellationLogo isConnecting={isConnecting} />
      </div>

      {/* 标题 */}
      <h1 className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 bg-clip-text text-transparent">
        Nexus
      </h1>
      <p className="relative z-10 text-white/50 text-xs sm:text-sm mb-4 sm:mb-6 md:mb-8">知识星辰大海</p>

      {/* 连接状态 */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-xs space-y-2 sm:space-y-3 mb-4 sm:mb-6 md:mb-8">
        <StatusIndicator status={state.pocketbase} label="数据中心 (PocketBase)" />
      </div>

      {/* 状态消息 */}
      <p className="relative z-10 text-white/60 text-xs sm:text-sm animate-pulse text-center">
        {state.message}
      </p>

      {/* 进度条 */}
      <div className="relative z-10 w-full max-w-[280px] sm:max-w-xs h-1 bg-white/10 rounded-full mt-4 sm:mt-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ 
            width: state.pocketbase === 'pending' ? '0%' :
                   state.pocketbase === 'connecting' ? '50%' : '100%'
          }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;

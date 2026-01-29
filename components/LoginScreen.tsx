import React, { useState } from 'react';
import { pb } from '../src/api/pocketbase';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

// 星座 Logo 组件（动画增强版）
const ConstellationLogo: React.FC = () => {
  return (
    <svg width="160" height="160" viewBox="0 0 200 200" fill="none" className="drop-shadow-2xl">
      <defs>
        <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24' }} />
          <stop offset="50%" style={{ stopColor: '#f472b6' }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
        </linearGradient>
        <filter id="loginGlow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      
      {/* 背景圆 */}
      <circle cx="100" cy="100" r="95" fill="#050510" />
      {/* 外圈光环 - 旋转动画 */}
      <circle cx="100" cy="100" r="88" fill="transparent" stroke="url(#loginGrad)" strokeWidth="1.5" strokeDasharray="30 20" opacity="0.4">
        <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="100" r="80" fill="transparent" stroke="url(#loginGrad)" strokeWidth="1" strokeDasharray="15 25" opacity="0.3">
        <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="15s" repeatCount="indefinite" />
      </circle>
      
      {/* 连线 - 更明显的闪烁 */}
      <g stroke="url(#loginGrad)" strokeWidth="2.5">
        <line x1="60" y1="50" x2="100" y2="80">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;3.5;2" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="80" x2="150" y2="60">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;3.5;2" dur="1s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="80" x2="100" y2="130">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2.5;4;2.5" dur="0.8s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="130" x2="50" y2="140">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;3;2" dur="1.4s" repeatCount="indefinite" />
        </line>
        <line x1="100" y1="130" x2="160" y2="130">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;3.5;2" dur="1.1s" repeatCount="indefinite" />
        </line>
        <line x1="150" y1="60" x2="160" y2="130">
          <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.3s" repeatCount="indefinite" />
          <animate attributeName="stroke-width" values="2;3;2" dur="1.3s" repeatCount="indefinite" />
        </line>
      </g>
      
      {/* 星星节点 - 更大的脉冲幅度 */}
      <g filter="url(#loginGlow)">
        {/* 左上星 */}
        <circle cx="60" cy="50" r="7" fill="url(#loginGrad)">
          <animate attributeName="r" values="5;10;5" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.2s" repeatCount="indefinite" />
        </circle>
        {/* 右上星 */}
        <circle cx="150" cy="60" r="6" fill="url(#loginGrad)">
          <animate attributeName="r" values="4;9;4" dur="1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
        </circle>
        {/* 中心主星 - Nexus 核心，最明显 */}
        <circle cx="100" cy="80" r="14" fill="url(#loginGrad)" filter="url(#strongGlow)">
          <animate attributeName="r" values="10;18;10" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;1;0.8" dur="0.8s" repeatCount="indefinite" />
        </circle>
        {/* 中下星 */}
        <circle cx="100" cy="130" r="10" fill="url(#loginGrad)">
          <animate attributeName="r" values="7;13;7" dur="1.1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;1;0.7" dur="1.1s" repeatCount="indefinite" />
        </circle>
        {/* 左下星 */}
        <circle cx="50" cy="140" r="5" fill="url(#loginGrad)">
          <animate attributeName="r" values="3;7;3" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.4s" repeatCount="indefinite" />
        </circle>
        {/* 右下星 */}
        <circle cx="160" cy="130" r="6" fill="url(#loginGrad)">
          <animate attributeName="r" values="4;9;4" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </g>
      
      {/* 装饰小星星 - 更明显的闪烁 */}
      <circle cx="80" cy="60" r="2" fill="#fff">
        <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="r" values="1;3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="100" r="1.5" fill="#fff">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.3s" />
        <animate attributeName="r" values="1;2.5;1" dur="2s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx="70" cy="120" r="2" fill="#fff">
        <animate attributeName="opacity" values="0;0.9;0" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
        <animate attributeName="r" values="1;3;1" dur="1.8s" repeatCount="indefinite" begin="0.6s" />
      </circle>
      <circle cx="140" cy="90" r="1.5" fill="#fff">
        <animate attributeName="opacity" values="0;0.7;0" dur="1.6s" repeatCount="indefinite" begin="0.9s" />
        <animate attributeName="r" values="1;2.5;1" dur="1.6s" repeatCount="indefinite" begin="0.9s" />
      </circle>
      <circle cx="120" cy="60" r="1.5" fill="#fff">
        <animate attributeName="opacity" values="0;0.8;0" dur="1.4s" repeatCount="indefinite" begin="0.5s" />
      </circle>
      <circle cx="85" cy="145" r="1.5" fill="#fff">
        <animate attributeName="opacity" values="0;0.9;0" dur="1.7s" repeatCount="indefinite" begin="0.2s" />
      </circle>
    </svg>
  );
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      onLoginSuccess(authData.record);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.data?.data?.email?.message) {
        setError(err.data.data.email.message);
      } else if (err.data?.data?.password?.message) {
        setError(err.data.data.password.message);
      } else {
        setError('邮箱或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510] overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 渐变光晕 - 带缓慢动画 */}
        <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-900/20 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/10 blur-[80px] animate-pulse" style={{ animationDuration: '6s' }} />
        
        {/* 星星背景 - 带闪烁动画 */}
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

      {/* 登录卡片 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {/* Logo 和标题 */}
          <div className="flex flex-col items-center mb-8">
            <ConstellationLogo />
            <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-amber-400 via-pink-500 to-violet-500 bg-clip-text text-transparent">
              Nexus
            </h1>
            <p className="text-white/40 text-sm mt-1">知识星辰大海</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 邮箱 */}
            <div>
              <label className="block text-white/60 text-sm mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-white/60 text-sm mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-medium text-white transition-all ${
                loading
                  ? 'bg-violet-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : '登录'}
            </button>
          </form>

          {/* 底部提示 */}
          <p className="mt-6 text-center text-white/30 text-xs">
            请使用管理员分配的账号登录
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

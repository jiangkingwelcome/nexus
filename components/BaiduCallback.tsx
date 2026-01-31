/**
 * 百度网盘 OAuth 回调页面
 * 处理授权码换取 Token
 */

import React, { useEffect, useState } from 'react';
import { exchangeCodeForTokens, getUserInfo } from '../src/api/baidu';

interface BaiduCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

const BaiduCallback: React.FC<BaiduCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理授权...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从 URL 获取授权码
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(urlParams.get('error_description') || error);
        }

        if (!code) {
          throw new Error('未获取到授权码');
        }

        setMessage('正在获取访问令牌...');

        // 用授权码换取 Token
        await exchangeCodeForTokens(code);

        setMessage('正在获取用户信息...');

        // 获取用户信息
        await getUserInfo();

        setStatus('success');
        setMessage('授权成功！');

        // 通知父组件
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } catch (err) {
        setStatus('error');
        const errorMsg = err instanceof Error ? err.message : '授权失败';
        setMessage(errorMsg);
        onError(errorMsg);
      }
    };

    handleCallback();
  }, [onSuccess, onError]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      </div>

      {/* 状态指示 */}
      <div className="text-center">
        {status === 'loading' && (
          <div className="mb-4">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        )}
        
        {status === 'success' && (
          <div className="mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-white mb-2">百度网盘授权</h2>
        <p className="text-white/80">{message}</p>

        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            关闭窗口
          </button>
        )}
      </div>
    </div>
  );
};

export default BaiduCallback;

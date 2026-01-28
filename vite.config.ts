import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const alistUrl = env.VITE_ALIST_URL || 'https://jiangking.v3cu.com:3004';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // 代理 Alist API 请求
          '/api': {
            target: alistUrl,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path,
          },
          // 代理 Alist 文件下载
          '/d': {
            target: alistUrl,
            changeOrigin: true,
            secure: false,
          },
          // 代理 Alist 文件预览（直接返回内容，不重定向）
          '/p': {
            target: alistUrl,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@api': path.resolve(__dirname, './src/api'),
        }
      }
    };
});

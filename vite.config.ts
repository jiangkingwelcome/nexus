import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // 百度 OAuth API 代理
          '/baidu-oauth': {
            target: 'https://openapi.baidu.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/baidu-oauth/, ''),
            secure: true,
          },
          // 百度网盘 API 代理
          '/baidu-pan': {
            target: 'https://pan.baidu.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/baidu-pan/, ''),
            secure: true,
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

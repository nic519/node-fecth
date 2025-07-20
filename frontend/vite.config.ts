import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  
  return {
    plugins: [preact()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        // 代理 API 请求到后端服务器，移除 /api 前缀
        '/api': {
          target: 'http://localhost:8787',
          changeOrigin: true,
          secure: false 
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    }
    // 移除 define 配置，让 Vite 自动处理环境变量
    // 这样 Pages 后台设置的环境变量就能正常工作了
  }
}) 
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
      // 代理 API 请求到后端服务器
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    // 确保环境变量在构建时可用
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || '/api'),
  }
}) 
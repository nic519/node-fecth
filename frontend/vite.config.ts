import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')
  
  // 调试环境变量
  console.log('🔍 Vite 配置调试信息:')
  console.log('  Mode:', mode)
  console.log('  VITE_API_BASE_URL from env:', env.VITE_API_BASE_URL)
  console.log('  VITE_API_BASE_URL from process.env:', process.env.VITE_API_BASE_URL)
  
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
    },
    define: {
      // 确保环境变量在构建时可用，包含默认值
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        env.VITE_API_BASE_URL || 'https://node-fetch-pages1.pages.dev'
      ) 
    }
  }
}) 
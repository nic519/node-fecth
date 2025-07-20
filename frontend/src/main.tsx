import { render } from 'preact'
import { App } from './App.tsx'
import './index.css'

// 🚀 动态设置 API 客户端的 baseUrl
import { defaults } from '@/generated/api-client.g'

// 根据环境智能选择 API 地址
const getApiBaseUrl = () => {
  // 1. 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 2. 根据当前域名智能判断
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // 本地开发环境
    return 'http://localhost:8787'
  } else {
    // 生产环境 - 使用相对路径或生产域名
    return 'https://node-fetch-pages.pages.dev'
  }
}

// 设置动态 baseUrl
defaults.baseUrl = getApiBaseUrl()

console.log(`🔗 API Base URL: ${defaults.baseUrl}`)

render(<App />, document.getElementById('app')!) 
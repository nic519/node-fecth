import { render } from 'preact'
import { App } from './App.tsx'
import './index.css'

// 🚀 动态设置 API 客户端的 baseUrl
// import { defaults } from '@/generated/api-client.g'

// 使用环境变量配置 API 地址

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
// defaults.baseUrl = apiBaseUrl

render(<App />, document.getElementById('app')!) 
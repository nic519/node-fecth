import { render } from 'preact'
import { App } from './App.tsx'
import './index.css'

// 🚀 动态设置 API 客户端的 baseUrl
import { defaults } from '@/generated/api-client.g'
defaults.baseUrl = '/'

render(<App />, document.getElementById('app')!) 
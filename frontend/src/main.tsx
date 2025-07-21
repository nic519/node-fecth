import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';

// 🚀 动态设置 API 客户端的 baseUrl
import { defaults } from '@/generated/api-client.g';
defaults.baseUrl = '/';

const container = document.getElementById('app')!;
const root = createRoot(container);
root.render(<App />);

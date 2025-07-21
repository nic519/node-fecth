import preact from '@preact/preset-vite';
import path from 'path';
import { defineConfig } from 'vite';

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
				// 代理 API 请求到 Workers 开发服务器
				'/api': {
					target: 'http://localhost:8787',
					changeOrigin: true,
					secure: false,
					// Workers 开发服务器直接处理 /api 路径，无需重写
				},
				// 代理 OpenAPI 规范请求 (用于 API 客户端生成)
				'/openapi.json': {
					target: 'http://localhost:8787',
					changeOrigin: true,
					secure: false,
				},
			},
		},
		build: {
			outDir: 'dist',
			sourcemap: true,
			// 为 Workers Static Assets 优化构建
			rollupOptions: {
				output: {
					// 确保资源路径正确
					assetFileNames: 'assets/[name]-[hash][extname]',
					chunkFileNames: 'assets/[name]-[hash].js',
					entryFileNames: 'assets/[name]-[hash].js',
				},
			},
		},
		// 优化开发体验
		optimizeDeps: {
			include: ['preact', 'preact/hooks'],
		},
	};
});

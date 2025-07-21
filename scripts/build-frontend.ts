#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

async function buildFrontend() {
	console.log('🚀 开始构建前端 (Workers Static Assets)...');

	try {
		// 1. 构建前端
		console.log('📦 正在构建前端应用...');
		execSync('cd frontend && yarn build', { stdio: 'inherit' });

		// 2. 清理旧的 public 目录
		console.log('🧹 清理构建目录...');
		const publicDir = path.resolve('./public');
		await fs.remove(publicDir);

		// 3. 创建新的 public 目录
		await fs.ensureDir(publicDir);

		// 4. 复制构建产物
		console.log('📂 复制构建产物到 Workers Static Assets 目录...');
		const frontendDistDir = path.resolve('./frontend/dist');
		await fs.copy(frontendDistDir, publicDir);

		// 5. 验证构建产物
		console.log('🔍 验证构建产物...');
		const indexPath = path.resolve('./public/index.html');
		if (!fs.existsSync(indexPath)) {
			throw new Error('构建产物缺少 index.html 文件');
		}

		// 6. 显示构建统计
		const stats = await fs.readdir(publicDir);
		console.log(`📊 构建统计: ${stats.length} 个文件/目录`);
		console.log(
			'📁 主要文件:',
			stats.filter((name) => name.endsWith('.html') || name.endsWith('.js') || name.endsWith('.css')).slice(0, 5)
		);

		console.log('✅ Workers 前端构建完成！');
		console.log('💡 静态资源将通过 Workers Static Assets 托管');
	} catch (error) {
		console.error('❌ 构建失败:', error);
		process.exit(1);
	}
}

// 如果直接运行此脚本
if (require.main === module) {
	buildFrontend();
}

export default buildFrontend;

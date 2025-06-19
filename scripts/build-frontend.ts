import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// 编译 TypeScript 文件
function buildFrontend() {
	try {
		console.log('开始编译前端 TypeScript 文件...');
		const output_name = 'user-modify.d.js';

		// 使用 tsc 编译 public/user-modify.ts
		const tscCommand = `npx tsc public/user-modify.ts --outDir . --target es2021 --module commonjs --lib es2021,dom --strict --skipLibCheck`;
		execSync(tscCommand, { stdio: 'inherit' });

		// 重命名生成的文件
		const originalFile = path.join('public', 'user-modify.js');
		const targetFile = path.join('public', output_name);

		if (fs.existsSync(originalFile)) {
			// 确保 public 目录存在
			if (!fs.existsSync('public')) {
				fs.mkdirSync('public', { recursive: true });
			}

			// 移动并重命名文件
			fs.renameSync(originalFile, targetFile);
			console.log('前端文件编译完成！');
			console.log(`编译后的文件: ${targetFile}`);
		} else {
			console.error('编译失败：输出文件不存在');
			process.exit(1);
		}
	} catch (error) {
		console.error('编译失败:', error);
		process.exit(1);
	}
}

buildFrontend();

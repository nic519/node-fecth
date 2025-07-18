/**
 * ===================================================================
 * 🔧 oazapfts 生成器
 * ===================================================================
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import type { IOazapftsGenerator } from '../core/types';

/**
 * oazapfts 生成器实现
 * 负责使用 oazapfts 生成原始客户端
 */
export class OazapftsGenerator implements IOazapftsGenerator {
	/**
	 * 使用 oazapfts 生成原始客户端
	 */
	async generateClient(openapiPath: string, outputPath: string): Promise<void> {
		console.log('🔧 使用 oazapfts 生成原始客户端...');

		try {
			// 检查 OpenAPI 规范文件是否存在
			if (!fs.existsSync(openapiPath)) {
				throw new Error(`OpenAPI 规范文件不存在: ${openapiPath}`);
			}

			console.log(`📄 使用 OpenAPI 规范: ${openapiPath}`);
			console.log(`📂 输出到: ${outputPath}`);

			// 使用 oazapfts 生成客户端
			const command = `npx oazapfts ${openapiPath} ${outputPath}`;
			console.log(`🚀 执行命令: ${command}`);

			execSync(command, {
				stdio: 'inherit',
				cwd: process.cwd(),
			});

			// 检查文件是否成功生成
			if (!fs.existsSync(outputPath)) {
				throw new Error(`oazapfts 生成失败，文件不存在: ${outputPath}`);
			}

			console.log('✅ oazapfts 客户端生成成功');
		} catch (error) {
			console.error('❌ oazapfts 客户端生成失败:', error);
			throw error;
		}
	}
}

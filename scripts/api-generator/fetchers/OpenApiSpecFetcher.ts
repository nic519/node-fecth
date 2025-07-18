/**
 * ===================================================================
 * 🌐 OpenAPI 规范获取器
 * ===================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IOpenApiSpecFetcher } from '../core/types';

/**
 * OpenAPI 规范获取器实现
 * 负责从服务器动态获取 OpenAPI 规范
 */
export class OpenApiSpecFetcher implements IOpenApiSpecFetcher {
	/**
	 * 动态从服务器获取 OpenAPI 规范
	 */
	async fetchSpec(serverUrl: string, outputPath: string): Promise<void> {
		console.log('🌐 从服务器动态获取 OpenAPI 规范...');
		console.log(`🔗 服务器地址: ${serverUrl}`);

		try {
			const response = await fetch(`${serverUrl}/openapi.json`);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const openApiSpec = (await response.json()) as any;

			// 确保临时目录存在
			const tempDir = path.dirname(outputPath);
			if (!fs.existsSync(tempDir)) {
				fs.mkdirSync(tempDir, { recursive: true });
			}

			// 保存到临时文件
			fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');

			console.log(`✅ OpenAPI 规范获取成功`);
			console.log(`📄 临时保存到: ${outputPath}`);
			console.log(`📊 规范版本: ${openApiSpec.info?.version || '未知'}`);
			console.log(`🔗 API 路径数量: ${Object.keys(openApiSpec.paths || {}).length}`);
		} catch (error) {
			console.error('❌ 获取 OpenAPI 规范失败:', error);
			throw new Error(`无法从服务器获取 OpenAPI 规范: ${serverUrl}/openapi.json\n请确保服务器正在运行并且可以访问。`);
		}
	}
}

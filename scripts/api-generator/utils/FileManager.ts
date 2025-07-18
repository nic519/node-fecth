/**
 * ===================================================================
 * 📁 文件管理器
 * ===================================================================
 */

import * as fs from 'fs';
import type { IFileManager } from '../core/types';

/**
 * 文件管理器实现
 * 负责所有文件操作相关功能
 */
export class FileManager implements IFileManager {
	/**
	 * 确保目录存在
	 */
	ensureDirectoryExists(dirPath: string): void {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
			console.log(`📁 创建输出目录: ${dirPath}`);
		}
	}

	/**
	 * 清理临时文件
	 */
	cleanupTempFile(filePath: string): void {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			console.log(`🧹 清理临时文件: ${filePath}`);
		}
	}

	/**
	 * 添加文件头部配置
	 */
	addBasicConfiguration(filePath: string, apiBaseUrl: string): void {
		let content = fs.readFileSync(filePath, 'utf-8');

		// 修改默认配置
		content = content.replace(':8787', ':3000/api');

		const configComment = `
// ===================================================================
// 🚀 oazapfts 生成的类型安全 API 客户端 (Hono 最佳实践)
// ===================================================================
// 
// 此文件由 oazapfts 基于 OpenAPI 规范自动生成，已自动解包装响应
// 直接返回业务层数据结构，无需手动处理 HTTP 状态码
// 
// 期望的响应结构：
// {
//   code: 0,
//   msg: string,
//   data: { ... }
// }
// 
// 使用方法：
// import { getHealth, defaults } from '@/generated/api-client';
// 
// // 配置基础URL（如果需要）
// defaults.baseUrl = 'https://api.example.com';
// 
// // 直接调用函数，自动解包装响应
// const result = await getHealth(); // 直接得到业务数据
//

`;

		content = configComment + content;
		fs.writeFileSync(filePath, content, 'utf-8');
	}
}

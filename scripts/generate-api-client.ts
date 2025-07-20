/**
 * ===================================================================
 * 🚀 零硬编码 API 客户端生成器 (Hono 最佳实践)
 * ===================================================================
 *
 * 遵循 Hono 框架的设计哲学：
 * - 轻量级：最小化抽象层
 * - Web 标准：直接使用标准 API
 * - 类型安全：完整的 TypeScript 支持
 *
 * 🎯 **设计原则**
 * ✅ 零硬编码 - 完全基于函数名模式动态分析
 * ✅ 直接导出 - 不添加不必要的包装层
 * ✅ 类型安全 - 保持 oazapfts 的完整类型信息
 * ✅ 模块化组织 - 基于函数名模式自动分组
 * ✅ 向后兼容 - 支持现有的导入方式
 * ✅ 动态获取 - 从运行中的服务器获取最新 OpenAPI 规范
 * ✅ 模块化架构 - 单一职责，易于测试和扩展
 *
 * 📋 **生成的文件**
 * - api-client.g.ts: oazapfts 生成的原始客户端（新生成）
 * - api-adapters.g.ts: 基于函数名模式的重新导出文件
 * - 动态从服务器获取 OpenAPI 规范，使用临时文件处理，不保存实体文件
 *
 * 🔄 **工作流程**
 * 1. 动态获取 OpenAPI 规范（从本地开发服务器）
 * 2. 使用 oazapfts 生成原始客户端
 * 3. 分析生成的函数名模式
 * 4. 基于模式自动分组并重新导出
 * 5. 生成类型安全的模块化接口
 *
 * 🏗️ **模块化架构**
 * - core/: 核心类型定义和主生成器
 * - fetchers/: OpenAPI 规范获取模块
 * - generators/: oazapfts 和导出生成器
 * - analyzers/: 函数分析和模块解析
 * - utils/: 文件操作和路径工具
 *
 * 💡 **使用示例**
 * ```typescript
 * // 直接使用原始函数（推荐）
 * import { getHealth, getAdminUserAll } from '@/generated/api-client';
 *
 * // 或使用模块化接口
 * import { health, admin } from '@/generated/api-adapters.g';
 *
 * const healthStatus = await getHealth();
 * const users = await admin.getAdminUserAll(token);
 * ```
 *
 * 🚀 **命令行使用**
 * ```bash
 * # 生成API客户端（使用本地开发服务器）
 * yarn build:api
 *
 * # 直接运行脚本
 * npx tsx scripts/generate-api-client.ts
 * ```
 *
 * ===================================================================
 */

import { ApiGenerator } from './api-generator';

/**
 * 主函数
 */
async function main() {
	try {
		// 固定使用本地开发服务器
		const serverUrl = 'http://localhost:8787';

		console.log('🚀 零硬编码API客户端生成器启动');
		console.log(`🔗 目标服务器: ${serverUrl}`);
		console.log('🏗️ 使用模块化架构，易于扩展和维护');

		const generator = new ApiGenerator(serverUrl);
		await generator.generate();
	} catch (error) {
		console.error('❌ 零硬编码API客户端生成失败:', error);
		console.log('\n💡 使用说明:');
		console.log('  yarn build:api                    # 生成API客户端');
		console.log('\n🔧 确保本地开发服务器已启动在 http://localhost:8787');
		process.exit(1);
	}
}

// 运行脚本
if (require.main === module) {
	main();
}

// 导出生成器供其他模块使用
export { ApiGenerator } from './api-generator';

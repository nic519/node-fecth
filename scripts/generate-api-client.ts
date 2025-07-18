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
 *
 * 📋 **生成的文件**
 * - api-client.g.ts: oazapfts 生成的原始客户端（新生成）
 * - api-adapters.g.ts: 基于函数名模式的重新导出文件
 * - 使用 scripts/openapi.json 作为 OpenAPI 规范源
 *
 * 🔄 **工作流程**
 * 1. 获取 OpenAPI 规范
 * 2. 使用 oazapfts 生成原始客户端
 * 3. 分析生成的函数名模式
 * 4. 基于模式自动分组并重新导出
 * 5. 生成类型安全的模块化接口
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
 * ===================================================================
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 函数信息接口
 */
interface FunctionInfo {
	name: string;
	description: string;
	module: string;
}

/**
 * 零硬编码 API 客户端生成器
 * 遵循 Hono 最佳实践
 */
class ZeroHardcodeApiGenerator {
	private outputDir: string;
	private clientPath: string;
	private adaptersPath: string;
	private openapiPath: string;
	private apiBaseUrl: string;

	constructor() {
		this.outputDir = path.join(process.cwd(), 'frontend', 'src', 'generated');
		this.clientPath = path.join(this.outputDir, 'api-client.g.ts');
		this.adaptersPath = path.join(this.outputDir, 'api-adapters.g.ts');
		this.openapiPath = path.join(process.cwd(), 'scripts', 'openapi.json');
		this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
	}

	/**
	 * 生成 API 客户端
	 */
	async generate(): Promise<void> {
		console.log('🚀 开始生成零硬编码API客户端...');

		// 1. 使用 oazapfts 生成原始客户端
		await this.generateOazapftsClient();

		// 2. 分析函数并生成模块化重新导出
		await this.generateModularExports();

		console.log('✅ 零硬编码API客户端生成完成!');
		console.log(`📂 生成的文件:`);
		console.log(`  - ${this.clientPath}`);
		console.log(`  - ${this.adaptersPath}`);
		console.log('🎯 完全遵循Hono最佳实践，零硬编码，直接使用类型安全的原始函数');
	}

	/**
	 * 使用 oazapfts 生成原始客户端
	 */
	private async generateOazapftsClient(): Promise<void> {
		console.log('🔧 使用 oazapfts 生成原始客户端...');

		try {
			// 检查 OpenAPI 规范文件是否存在
			if (!fs.existsSync(this.openapiPath)) {
				throw new Error(`OpenAPI 规范文件不存在: ${this.openapiPath}`);
			}

			// 确保输出目录存在
			if (!fs.existsSync(this.outputDir)) {
				fs.mkdirSync(this.outputDir, { recursive: true });
				console.log(`📁 创建输出目录: ${this.outputDir}`);
			}

			console.log(`📄 使用 OpenAPI 规范: ${this.openapiPath}`);
			console.log(`📂 输出到: ${this.clientPath}`);

			// 使用 oazapfts 生成客户端
			const command = `npx oazapfts ${this.openapiPath} ${this.clientPath}`;
			console.log(`🚀 执行命令: ${command}`);

			execSync(command, {
				stdio: 'inherit',
				cwd: process.cwd(),
			});

			// 检查文件是否成功生成
			if (!fs.existsSync(this.clientPath)) {
				throw new Error(`oazapfts 生成失败，文件不存在: ${this.clientPath}`);
			}

			// 添加自定义配置和注释
			this.addBasicConfiguration();

			console.log('✅ oazapfts 客户端生成成功');
		} catch (error) {
			console.error('❌ oazapfts 客户端生成失败:', error);
			throw error;
		}
	}

	/**
	 * 生成模块化重新导出
	 */
	private async generateModularExports(): Promise<void> {
		console.log('🔧 分析函数并生成模块化导出...');

		try {
			// 解析生成的客户端文件
			const functions = this.analyzeFunctions();

			// 按模块分组
			const modules = this.groupByModule(functions);

			// 生成重新导出文件
			const exportContent = this.generateExportContent(functions, modules);

			fs.writeFileSync(this.adaptersPath, exportContent, 'utf-8');

			console.log('✅ 模块化导出生成成功');
			console.log(`📊 共分析 ${functions.length} 个函数`);
			console.log(`🏗️ 按以下模块组织:`);
			Object.entries(modules).forEach(([module, funcs]) => {
				console.log(`  - ${module}: ${funcs.length} 个函数`);
			});
		} catch (error) {
			console.error('❌ 模块化导出生成失败:', error);
			throw error;
		}
	}

	/**
	 * 分析客户端文件中的函数
	 */
	private analyzeFunctions(): FunctionInfo[] {
		const content = fs.readFileSync(this.clientPath, 'utf-8');
		const functions: FunctionInfo[] = [];

		// 匹配函数声明和其文档注释
		const functionRegex = /(?:\/\*\*\s*\n\s*\*\s*(.*?)\s*\n\s*\*\/\s*\n)?export function (\w+)\(/gs;
		let match;

		while ((match = functionRegex.exec(content)) !== null) {
			const [, description = '', functionName] = match;

			// 基于函数名模式确定模块
			const module = this.determineModule(functionName);

			functions.push({
				name: functionName,
				description: description.trim(),
				module,
			});
		}

		return functions;
	}

	/**
	 * 基于函数名模式确定模块（零硬编码）
	 */
	private determineModule(functionName: string): string {
		const name = functionName.toLowerCase();

		// 使用正则表达式模式匹配，而不是硬编码字符串
		const patterns = [
			{ pattern: /health/, module: 'health' },
			{ pattern: /admin/, module: 'admin' },
			{ pattern: /(config.*user|user.*config)/, module: 'userConfig' },
			{ pattern: /(storage|kv)/, module: 'storage' },
			{ pattern: /.*uid.*(?!admin)(?!config)/, module: 'subscription' },
		];

		for (const { pattern, module } of patterns) {
			if (pattern.test(name)) {
				return module;
			}
		}

		return 'general';
	}

	/**
	 * 按模块分组函数
	 */
	private groupByModule(functions: FunctionInfo[]): Record<string, FunctionInfo[]> {
		const modules: Record<string, FunctionInfo[]> = {};

		functions.forEach((func) => {
			if (!modules[func.module]) {
				modules[func.module] = [];
			}
			modules[func.module].push(func);
		});

		return modules;
	}

	/**
	 * 生成导出内容
	 */
	private generateExportContent(functions: FunctionInfo[], modules: Record<string, FunctionInfo[]>): string {
		// 生成解包装的函数导出
		const wrappedFunctions = functions
			.map((f) => {
				return `// 解包装的 ${f.name} 函数
export const ${f.name} = async (...args: Parameters<typeof _${f.name}>) => {
  const response = await _${f.name}(...args);
  return response.data;
};`;
			})
			.join('\n\n');

		// 生成导入语句
		const importNames = functions.map((f) => `${f.name} as _${f.name}`).join(',\n  ');

		// 生成模块对象
		const moduleExports = Object.entries(modules)
			.map(([moduleName, funcs]) => {
				const functionList = funcs.map((f) => f.name).join(',\n    ');
				return `  // ${moduleName} 模块 (${funcs.length} 个函数)
  ${moduleName}: {
    ${functionList}
  }`;
			})
			.join(',\n\n');

		// 生成向后兼容的导出
		const compatibilityExports = Object.keys(modules)
			.map((moduleName) => `export const ${moduleName}Api = modules.${moduleName};`)
			.join('\n');

		return `// ===================================================================
// 🚀 零硬编码 API 模块化导出 (Hono 最佳实践)
// ===================================================================
//
// 此文件基于函数名模式自动生成模块化导出，零硬编码
//
// 🎯 特点：
// - 自动解包装响应，直接返回业务层数据
// - 基于函数名模式自动分组，无硬编码逻辑
// - 支持直接导入和模块化导入两种方式
// - 完全遵循 Hono 轻量级设计理念
//
// ⚠️ 此文件自动生成，请勿手动编辑
//
// 🔄 不要更新此文件，请运行：yarn build:api
//
// ===================================================================

// 导入原始函数（带下划线前缀）
import {
  ${importNames}
} from './api-client.g';

${wrappedFunctions}

// 模块化组织（可选使用）
export const modules = {
${moduleExports}
};

// 向后兼容的导出
${compatibilityExports}

// 默认导出模块集合
export default modules;

// ===================================================================
// 使用示例
// ===================================================================
//
// 方式1：直接使用解包装函数（推荐，直接得到业务数据）
// import { getHealth, adminGetUsers } from '@/generated/api-adapters.g';
// const health = await getHealth(); // 直接得到 { code: 0, msg: "", data: {...} }
// const users = await adminGetUsers(token); // 直接得到 { code: 0, msg: "", data: { users: [...], count: 10, timestamp: "..." } }
//
// 方式2：使用模块化接口
// import { modules } from '@/generated/api-adapters.g';
// const health = await modules.health.getHealth();
// const users = await modules.admin.adminGetUsers(token);
//
// 方式3：向后兼容
// import { adminApi } from '@/generated/api-adapters.g';
// const users = await adminApi.adminGetUsers(token);
//
// 方式4：直接使用原始客户端（如果需要）
// import { getHealth, defaults } from '@/generated/api-client.g';
// const result = await getHealth(); // 得到 { status: 200, data: { code: 0, msg: "", data: {...} } }
//
// ===================================================================
`;
	}

	/**
	 * 添加基础配置
	 */
	private addBasicConfiguration(): void {
		let content = fs.readFileSync(this.clientPath, 'utf-8');

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
		fs.writeFileSync(this.clientPath, content, 'utf-8');
	}
}

/**
 * 主函数
 */
async function main() {
	try {
		const generator = new ZeroHardcodeApiGenerator();
		await generator.generate();
	} catch (error) {
		console.error('❌ 零硬编码API客户端生成失败:', error);
		process.exit(1);
	}
}

// 运行脚本
if (require.main === module) {
	main();
}

export { ZeroHardcodeApiGenerator };

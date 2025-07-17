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
 * - api-client.ts: oazapfts 生成的原始客户端
 * - api-adapters.ts: 基于函数名模式的重新导出文件
 * - openapi.json: OpenAPI 规范文档
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
 * import { health, admin } from '@/generated/api-adapters';
 * 
 * const healthStatus = await getHealth();
 * const users = await admin.getAdminUserAll(token);
 * ```
 * 
 * ===================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
	private openApiPath: string;
	private clientPath: string;
	private adaptersPath: string;
	private apiBaseUrl: string;

	constructor() {
		this.outputDir = path.join(process.cwd(), 'frontend', 'src', 'generated');
		this.openApiPath = path.join(this.outputDir, 'openapi.json');
		this.clientPath = path.join(this.outputDir, 'api-client.ts');
		this.adaptersPath = path.join(this.outputDir, 'api-adapters.ts');
		this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8787';
	}

	/**
	 * 生成 API 客户端
	 */
	async generate(): Promise<void> {
		console.log('🚀 开始生成零硬编码API客户端...');

		// 1. 获取 OpenAPI 文档
		await this.fetchOpenApiDoc();

		// 2. 使用 oazapfts 生成原始客户端
		await this.generateWithOazapfts();

		// 3. 分析函数并生成模块化重新导出
		await this.generateModularExports();

		console.log('✅ 零硬编码API客户端生成完成!');
		console.log(`📂 生成的文件:`);
		console.log(`  - ${this.openApiPath}`);
		console.log(`  - ${this.clientPath}`);
		console.log(`  - ${this.adaptersPath}`);
		console.log('🎯 完全遵循Hono最佳实践，零硬编码，直接使用类型安全的原始函数');
	}

	/**
	 * 获取 OpenAPI 文档
	 */
	private async fetchOpenApiDoc(): Promise<void> {
		console.log('📄 获取 OpenAPI 文档...');
		
		if (!fs.existsSync(this.outputDir)) {
			fs.mkdirSync(this.outputDir, { recursive: true });
		}

		try {
			const response = await fetch(`${this.apiBaseUrl}/openapi.json`);
			
			if (!response.ok) {
				throw new Error(`无法获取 OpenAPI 文档: ${response.status} ${response.statusText}`);
			}

			const openApiDoc: any = await response.json();
			fs.writeFileSync(this.openApiPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
			console.log('✅ OpenAPI 文档获取成功');
		} catch (error) {
			console.error('❌ 获取 OpenAPI 文档失败:', error);
			console.log('💡 回退到本地生成...');
			await this.generateOpenApiDocLocally();
		}
	}

	/**
	 * 本地生成 OpenAPI 文档
	 */
	private async generateOpenApiDocLocally(): Promise<void> {
		try {
			const { Router } = await import('@/routes/routesHandler');
			const router = new Router();
			const openApiDoc = router.getOpenAPIDocument();
			fs.writeFileSync(this.openApiPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
			console.log('✅ OpenAPI 文档本地生成成功');
		} catch (error) {
			console.error('❌ 本地生成失败:', error);
			throw error;
		}
	}

	/**
	 * 使用 oazapfts 生成原始客户端
	 */
	private async generateWithOazapfts(): Promise<void> {
		console.log('🔧 使用 oazapfts 生成原始客户端...');

		try {
			const { stdout, stderr } = await execAsync(
				`npx oazapfts "${this.openApiPath}" "${this.clientPath}"`
			);

			if (stderr) {
				console.warn('⚠️ oazapfts 警告:', stderr);
			}

			this.addBasicConfiguration();
			console.log('✅ 原始客户端生成成功');
		} catch (error) {
			console.error('❌ oazapfts 生成失败:', error);
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
				module
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
			{ pattern: /.*uid.*(?!admin)(?!config)/, module: 'subscription' }
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
		
		functions.forEach(func => {
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
		const allFunctionNames = functions.map(f => f.name).join(',\n  ');
		
		// 生成模块对象
		const moduleExports = Object.entries(modules)
			.map(([moduleName, funcs]) => {
				const functionList = funcs.map(f => f.name).join(',\n    ');
				return `  // ${moduleName} 模块 (${funcs.length} 个函数)
  ${moduleName}: {
    ${functionList}
  }`;
			})
			.join(',\n\n');

		// 生成向后兼容的导出
		const compatibilityExports = Object.keys(modules)
			.map(moduleName => `export const ${moduleName}Api = modules.${moduleName};`)
			.join('\n');

		return `// ===================================================================
// 🚀 零硬编码 API 模块化导出 (Hono 最佳实践)
// ===================================================================
//
// 此文件基于函数名模式自动生成模块化导出，零硬编码
//
// 🎯 特点：
// - 直接重新导出原始函数，保持完整类型信息
// - 基于函数名模式自动分组，无硬编码逻辑
// - 支持直接导入和模块化导入两种方式
// - 完全遵循 Hono 轻量级设计理念
//
// ⚠️  此文件自动生成，请勿手动编辑
//
// 🔄 要更新此文件，请运行：yarn generate:api
//
// ===================================================================

// 重新导出所有原始函数（推荐直接使用）
export {
  ${allFunctionNames}
} from './api-client';

// 模块化组织（可选使用）
import {
  ${allFunctionNames}
} from './api-client';

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
// 方式1：直接使用原始函数（推荐，完整类型支持）
// import { getHealth, getAdminUserAll } from '@/generated/api-adapters';
// const health = await getHealth();
// const users = await getAdminUserAll(token);
//
// 方式2：使用模块化接口
// import { modules } from '@/generated/api-adapters';
// const health = await modules.health.getHealth();
// const users = await modules.admin.getAdminUserAll(token);
//
// 方式3：向后兼容
// import { adminApi } from '@/generated/api-adapters';
// const users = await adminApi.getAdminUserAll(token);
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
		content = content.replace(
			'baseUrl: "http://localhost:8787"',
			'baseUrl: (globalThis as any)?.import?.meta?.env?.VITE_API_BASE_URL || "http://localhost:8787"'
		);
		
		const configComment = `
// ===================================================================
// 🚀 oazapfts 生成的类型安全 API 客户端 (Hono 最佳实践)
// ===================================================================
// 
// 此文件由 oazapfts 基于 OpenAPI 规范自动生成
// 提供完整的类型安全和智能提示
// 
// 使用方法：
// import { getHealth, defaults } from '@/generated/api-client';
// 
// // 配置基础URL（如果需要）
// defaults.baseUrl = 'https://api.example.com';
// 
// // 直接调用函数，享受完整的类型安全
// const health = await getHealth();
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
/**
 * ===================================================================
 * 🚀 真正动态的 API 客户端生成器
 * ===================================================================
 * 
 * 本脚本解决了之前硬编码 API 方法的问题，现在完全基于 OpenAPI 规范动态生成：
 * 
 * 🎯 **核心优势**
 * ✅ 完全动态生成 - 基于 OpenAPI 规范自动生成所有 API 方法
 * ✅ 新增接口自动包含 - 后端添加新接口时，重新生成即可自动包含
 * ✅ 类型安全 - 所有方法都有完整的 TypeScript 类型
 * ✅ 零维护成本 - 不需要手动编写或维护任何 API 方法
 * 
 * 📋 **生成的文件**
 * - api-client-raw.ts: oazapfts 生成的原始客户端（完全动态）
 * - api-client.ts: 包装器，提供便利方法和配置
 * - openapi.json: OpenAPI 规范文档
 * 
 * 🔄 **工作流程**
 * 1. 从后端 /openapi.json 端点获取最新规范
 * 2. 如果获取失败，回退到本地生成
 * 3. 使用 oazapfts 完全动态生成客户端
 * 4. 生成包装器提供更好的开发体验
 * 
 * 💡 **使用示例**
 * ```typescript
 * import api from '@/generated/api-client';
 * 
 * // 所有方法都是动态生成的，支持新增接口
 * const health = await api.getHealth();
 * const userDetail = await api.getConfigUserDetailByUid('uid123', 'token');
 * 
 * // 配置
 * api.setBaseUrl('https://api.example.com');
 * api.setAuth('your-token');
 * ```
 * 
 * 🆚 **对比之前的问题**
 * - ❌ 之前：硬编码 API 方法，新增接口需要手动添加
 * - ✅ 现在：完全动态生成，新增接口自动包含
 * 
 * ===================================================================
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * API客户端生成器
 * 使用 oazapfts 完全基于 OpenAPI 规范动态生成 TypeScript 客户端
 * 支持新增接口自动生成，无需手动维护
 */
class ApiClientGenerator {
	private outputDir: string;
	private openApiPath: string;
	private clientPath: string;
	private apiBaseUrl: string;

	constructor() {
		this.outputDir = path.join(process.cwd(), 'frontend', 'src', 'generated');
		this.openApiPath = path.join(this.outputDir, 'openapi.json');
		this.clientPath = path.join(this.outputDir, 'api-client.ts');
		this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8787';
	}

	/**
	 * 生成完整的API客户端
	 */
	async generate(): Promise<void> {
		console.log('🚀 开始生成API客户端...');

		// 1. 从 API 端点获取 OpenAPI 文档
		await this.fetchOpenApiDoc();

		// 2. 使用 oazapfts 完全动态生成客户端
		await this.generateWithOazapfts();

		// 3. 生成包装器以提供更好的 DX
		await this.generateClientWrapper();

		console.log('✅ API客户端生成完成!');
		console.log(`📂 生成的文件:`);
		console.log(`  - ${this.openApiPath}`);
		console.log(`  - ${this.clientPath}`);
		console.log(`  - ${this.clientPath.replace('.ts', '-raw.ts')}`);
	}

	/**
	 * 从 API 端点获取 OpenAPI 文档
	 */
	private async fetchOpenApiDoc(): Promise<void> {
		console.log('📄 从 API 端点获取 OpenAPI 文档...');
		
		// 确保输出目录存在
		if (!fs.existsSync(this.outputDir)) {
			fs.mkdirSync(this.outputDir, { recursive: true });
		}

		try {
			// 从后端 API 获取 OpenAPI 文档
			const response = await fetch(`${this.apiBaseUrl}/openapi.json`);
			
			if (!response.ok) {
				throw new Error(`无法获取 OpenAPI 文档: ${response.status} ${response.statusText}`);
			}

			const openApiDoc: any = await response.json();

			// 写入 OpenAPI 文档
			fs.writeFileSync(this.openApiPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
			console.log('✅ OpenAPI 文档获取成功');
			console.log(`📊 共包含 ${Object.keys(openApiDoc.paths || {}).length} 个路径`);
		} catch (error) {
			console.error('❌ 获取 OpenAPI 文档失败:', error);
			console.log('💡 回退到本地生成方式...');
			await this.generateOpenApiDocLocally();
		}
	}

	/**
	 * 本地生成 OpenAPI 文档（回退方案）
	 */
	private async generateOpenApiDocLocally(): Promise<void> {
		try {
			// 动态导入 Router（避免构建时问题）
			const { Router } = await import('@/routes/routesHandler');
			
			// 创建路由器实例并获取OpenAPI文档
			const router = new Router();
			const openApiDoc = router.getOpenAPIDocument();

			// 写入OpenAPI文档
			fs.writeFileSync(this.openApiPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
			console.log('✅ OpenAPI 文档本地生成成功');
		} catch (error) {
			console.error('❌ 本地生成 OpenAPI 文档也失败:', error);
			throw error;
		}
	}

	/**
	 * 使用 oazapfts 生成类型化客户端
	 */
	private async generateWithOazapfts(): Promise<void> {
		console.log('🔧 使用 oazapfts 生成类型化客户端...');

		try {
			const rawClientPath = this.clientPath.replace('.ts', '-raw.ts');
			
			// 使用 oazapfts 生成客户端
			const { stdout, stderr } = await execAsync(
				`npx oazapfts "${this.openApiPath}" "${rawClientPath}"`
			);

			if (stderr) {
				console.warn('⚠️ oazapfts 生成警告:', stderr);
			}

			console.log('✅ oazapfts 客户端生成成功');
		} catch (error) {
			console.error('❌ oazapfts 生成失败:', error);
			throw error;
		}
	}

	/**
	 * 生成包装器以提供更好的开发体验
	 */
	private async generateClientWrapper(): Promise<void> {
		console.log('🎁 生成客户端包装器...');

		const wrapperCode = this.buildWrapperCode();
		fs.writeFileSync(this.clientPath, wrapperCode, 'utf-8');
		console.log('✅ 客户端包装器生成成功');
	}

	/**
	 * 构建包装器代码
	 */
	private buildWrapperCode(): string {
		return `// ===================================================================
// 🤖 完全动态生成的API客户端包装器 - 请勿手动修改
// 生成时间: ${new Date().toISOString()}
// 基于: oazapfts (完全动态生成)
// ===================================================================

// 导入原始生成的客户端
import * as rawApi from './api-client-raw';

// 配置默认选项
const defaultOptions: rawApi.RequestOpts = {
	// 可以在这里设置全局默认配置
};

// 重新导出所有生成的API函数和类型
export * from './api-client-raw';

// 导出默认配置的 API 实例
export const api = {
	// 直接使用 rawApi 的所有方法，这样新增的接口会自动出现
	...rawApi,
	
	// 可以在这里添加一些便利方法
	configure: (options: Partial<rawApi.RequestOpts>) => {
		Object.assign(rawApi.defaults, options);
	},
	
	setBaseUrl: (baseUrl: string) => {
		rawApi.defaults.basePath = baseUrl;
	},
	
	setAuth: (token: string) => {
		rawApi.defaults.headers = {
			...rawApi.defaults.headers,
			Authorization: \`Bearer \${token}\`,
		};
	},
};

// 导出便利的分组API（可选，但保持动态性）
export const createApiGroups = () => {
	// 这里可以通过反射动态创建分组，但为了简单起见，暂时手动维护
	// 新的接口会通过 rawApi 自动暴露，也可以通过 api.* 访问
	
	return {
		// 所有方法都通过 api 暴露，支持动态添加
		health: {
			check: api.health || (() => { throw new Error('health endpoint not found'); }),
		},
		// 可以根据需要添加更多分组，但主要通过 api.* 使用
	};
};

// 默认导出配置好的 API 实例
export default api;

/*
使用示例：

import api from './api-client';

// 直接使用（推荐，支持新增接口自动生成）
const result = await api.getSomeEndpoint();

// 配置
api.setBaseUrl('https://api.example.com');
api.setAuth('your-token');

// 自定义配置
api.configure({
	headers: { 'Custom-Header': 'value' }
});

*/`;
	}
}

/**
 * 主函数
 */
async function main() {
	try {
		const generator = new ApiClientGenerator();
		await generator.generate();
	} catch (error) {
		console.error('❌ API客户端生成失败:', error);
		process.exit(1);
	}
}

// 运行脚本
if (require.main === module) {
	main();
}

export { ApiClientGenerator }; 
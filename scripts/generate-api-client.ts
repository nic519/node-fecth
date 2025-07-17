import { Router } from '@/routes/routesHandler';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * API客户端生成器
 * 基于OpenAPI规范自动生成前端TypeScript客户端代码
 */
class ApiClientGenerator {
	private outputDir: string;
	private openApiPath: string;
	private typesPath: string;
	private clientPath: string;

	constructor() {
		this.outputDir = path.join(process.cwd(), 'frontend', 'src', 'generated');
		this.openApiPath = path.join(this.outputDir, 'openapi.json');
		this.typesPath = path.join(this.outputDir, 'api-types.ts');
		this.clientPath = path.join(this.outputDir, 'api-client.ts');
	}

	/**
	 * 生成完整的API客户端
	 */
	async generate(): Promise<void> {
		console.log('🚀 开始生成API客户端...');

		// 1. 生成OpenAPI文档
		await this.generateOpenApiDoc();

		// 2. 生成TypeScript类型定义
		await this.generateTypes();

		// 3. 生成API客户端代码
		await this.generateClientCode();

		console.log('✅ API客户端生成完成!');
		console.log(`📂 生成的文件:`);
		console.log(`  - ${this.openApiPath}`);
		console.log(`  - ${this.typesPath}`);
		console.log(`  - ${this.clientPath}`);
	}

	/**
	 * 生成OpenAPI文档
	 */
	private async generateOpenApiDoc(): Promise<void> {
		console.log('📄 生成OpenAPI文档...');
		
		// 确保输出目录存在
		if (!fs.existsSync(this.outputDir)) {
			fs.mkdirSync(this.outputDir, { recursive: true });
		}

		// 创建路由器实例并获取OpenAPI文档
		const router = new Router();
		const openApiDoc = router.getOpenAPIDocument();

		// 写入OpenAPI文档
		fs.writeFileSync(this.openApiPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
		console.log('✅ OpenAPI文档生成成功');
	}

	/**
	 * 生成TypeScript类型定义
	 */
	private async generateTypes(): Promise<void> {
		console.log('🔧 生成TypeScript类型定义...');

		try {
			// 使用openapi-typescript生成类型定义
			const { stdout, stderr } = await execAsync(
				`npx openapi-typescript "${this.openApiPath}" --output "${this.typesPath}"`
			);

			if (stderr) {
				console.warn('⚠️ 类型生成警告:', stderr);
			}

			console.log('✅ TypeScript类型定义生成成功');
		} catch (error) {
			console.error('❌ 生成TypeScript类型定义失败:', error);
			throw error;
		}
	}

	/**
	 * 生成API客户端代码
	 */
	private async generateClientCode(): Promise<void> {
		console.log('🔨 生成API客户端代码...');

		const clientCode = this.buildClientCode();
		fs.writeFileSync(this.clientPath, clientCode, 'utf-8');
		console.log('✅ API客户端代码生成成功');
	}

	/**
	 * 构建API客户端代码
	 */
	private buildClientCode(): string {
		return `// ===================================================================
// 🤖 自动生成的API客户端 - 请勿手动修改
// 生成时间: ${new Date().toISOString()}
// 基于: OpenAPI 3.1.0 规范
// ===================================================================

import ky from 'ky';
import type { paths, components } from './api-types';
import type { 
	UserDetailResponse, 
	UsersListResponse, 
	AdminStatsResponse, 
	SuccessResponse,
	UserConfig 
} from '@/types/user-config';

// 类型别名，方便使用
export type UserSummary = components['schemas']['UserSummarySchema'];
export type AdminStats = components['schemas']['AdminStatsSchema'];
export type ConfigResponse = components['schemas']['ConfigResponseSchema'];
export type ErrorResponse = components['schemas']['ErrorResponseSchema'];

// API配置
const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
	isDev: import.meta.env.DEV,
};

// 创建基础API客户端
const apiClient = ky.create({
	prefixUrl: config.apiBaseUrl,
	timeout: 30000,
	retry: {
		limit: 2,
		methods: ['get'],
	},
	hooks: {
		beforeError: [
			(error) => {
				const { response } = error;
				if (response && response.body) {
					error.name = 'ApiError';
					error.message = \`请求失败: \${response.status} \${response.statusText}\`;
				}
				return error;
			},
		],
	},
});

// ===================================================================
// 用户配置API
// ===================================================================

export const userConfigApi = {
	/**
	 * 获取用户详情
	 */
	async getDetail(uid: string, token: string): Promise<UserDetailResponse> {
		return apiClient
			.get(\`config/user/detail/\${uid}\`, {
				searchParams: { token },
			})
			.json<UserDetailResponse>();
	},

	/**
	 * 更新用户配置
	 */
	async update(uid: string, config: UserConfig, token: string): Promise<SuccessResponse> {
		return apiClient.post(\`config/user/update/\${uid}\`, {
			json: { config },
			searchParams: { token },
		}).json<SuccessResponse>();
	},

	/**
	 * 删除用户配置
	 */
	async delete(uid: string, token: string): Promise<SuccessResponse> {
		return apiClient.delete(\`config/user/delete/\${uid}\`, {
			searchParams: { token },
		}).json<SuccessResponse>();
	},
};

// ===================================================================
// 管理员API
// ===================================================================

export const adminApi = {
	/**
	 * 获取所有用户列表
	 */
	async getAllUsers(superToken: string): Promise<UsersListResponse> {
		return apiClient
			.get('config/user/all', {
				searchParams: { superToken },
			})
			.json<UsersListResponse>();
	},

	/**
	 * 创建新用户
	 */
	async createUser(uid: string, config: UserConfig, superToken: string): Promise<SuccessResponse> {
		return apiClient
			.post(\`config/user/create/\${uid}\`, {
				json: { config },
				searchParams: { superToken },
			})
			.json<SuccessResponse>();
	},

	/**
	 * 删除用户
	 */
	async deleteUser(uid: string, superToken: string): Promise<SuccessResponse> {
		return apiClient
			.delete(\`config/user/delete/\${uid}\`, {
				searchParams: { superToken },
			})
			.json<SuccessResponse>();
	},

	/**
	 * 获取系统统计数据
	 */
	async getStats(superToken: string): Promise<AdminStatsResponse> {
		return apiClient
			.get('admin/stats', {
				searchParams: { superToken },
			})
			.json<AdminStatsResponse>();
	},
};

// ===================================================================
// 订阅API
// ===================================================================

export const subscriptionApi = {
	/**
	 * 获取订阅配置
	 */
	async getConfig(
		uid: string, 
		token: string, 
		options?: {
			type?: 'clash' | 'v2ray' | 'ss';
			udp?: boolean;
			download?: boolean;
		}
	): Promise<string> {
		return apiClient
			.get(uid, {
				searchParams: { 
					token, 
					...options 
				},
			})
			.text();
	},
};

// ===================================================================
// 存储API
// ===================================================================

export const storageApi = {
	/**
	 * 存储操作
	 */
	async operation(action: string, key?: string, token?: string): Promise<any> {
		return apiClient
			.get('storage', {
				searchParams: { 
					action, 
					...(key && { key }), 
					...(token && { token }) 
				},
			})
			.json();
	},
};

// ===================================================================
// KV存储API
// ===================================================================

export const kvApi = {
	/**
	 * KV存储操作
	 */
	async operation(params: Record<string, string>): Promise<any> {
		return apiClient
			.get('kv', {
				searchParams: params,
			})
			.json();
	},
};

// ===================================================================
// 健康检查API
// ===================================================================

export const healthApi = {
	/**
	 * 健康检查
	 */
	async check(): Promise<{ code: number; msg: string; data: { status: string; timestamp: string } }> {
		return apiClient
			.get('health')
			.json();
	},
};

// 导出配置供其他模块使用
export { config };

// 导出类型定义
export type * from './api-types';
`;
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
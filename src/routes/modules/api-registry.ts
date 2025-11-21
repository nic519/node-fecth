import { IAPI } from '@/routes/modules/base/api.base';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 路由注册器 - 懒加载版本（简洁Worker专用）
 */
export class APIRegistry {
	// 模块缓存
	private moduleCache: Map<string, IAPI> = new Map();
	private registeredModules: Set<string> = new Set();

	// 模块工厂函数
	private moduleFactories: Record<string, () => IAPI | Promise<IAPI>> = {};

	constructor() {
		this.setupModuleFactories();
	}

	private setupModuleFactories(): void {
		this.moduleFactories = {
			health: () => {
				const { APIHealth } = require('@/routes/modules/api.health');
				return new APIHealth();
			},
			user: async () => {
				const { APIUser } = await import('@/routes/modules/api.user');
				return new APIUser();
			},
			admin: async () => {
				const { APIAdmin } = await import('@/routes/modules/api.admin');
				return new APIAdmin();
			},
			adminTemplate: async () => {
				const { APIAdminTemplate } = await import('@/routes/modules/api.admin-template');
				return new APIAdminTemplate();
			},
			storage: async () => {
				const { APIStorage } = await import('@/routes/modules/api.kv-storage');
				return new APIStorage();
			},
			subscription: async () => {
				const { APIProxy } = await import('@/routes/modules/api.proxy');
				return new APIProxy();
			},
		};
	}

	// 懒加载模块
	async getModule(moduleName: string): Promise<IAPI> {
		if (this.moduleCache.has(moduleName)) {
			return this.moduleCache.get(moduleName)!;
		}

		const factory = this.moduleFactories[moduleName];
		if (!factory) {
			throw new Error(`未知的路由模块: ${moduleName}`);
		}

		const module = await factory();
		this.moduleCache.set(moduleName, module);
		return module;
	}

	// 注册模块
	async registerModule(app: OpenAPIHono<{ Bindings: Env }>, moduleName: string): Promise<void> {
		if (this.registeredModules.has(moduleName)) return;

		const module = await this.getModule(moduleName);
		module.register(app);
		this.registeredModules.add(moduleName);
	}

	// 注册核心模块
	async registerCoreModules(app: OpenAPIHono<{ Bindings: Env }>): Promise<void> {
		await this.registerModule(app, 'health');
	}

	// 预加载常用模块
	async preloadModules(app: OpenAPIHono<{ Bindings: Env }>, moduleNames: string[]): Promise<void> {
		for (const moduleName of moduleNames) {
			await this.registerModule(app, moduleName); // 加载并注册
		}
	}

	getRegisteredModules(): string[] {
		return Array.from(this.registeredModules);
	}
}

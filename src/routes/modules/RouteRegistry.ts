import { IRouteModule } from '@/routes/modules/base/RouteModule';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 路由注册器 - 懒加载版本（简洁Worker专用）
 */
export class RouteRegistry {
	// 模块缓存
	private moduleCache: Map<string, IRouteModule> = new Map();
	private registeredModules: Set<string> = new Set();

	// 模块工厂函数
	private moduleFactories: Record<string, () => IRouteModule | Promise<IRouteModule>> = {};

	constructor() {
		this.setupModuleFactories();
	}

	private setupModuleFactories(): void {
		this.moduleFactories = {
			health: () => {
				const { HealthModule } = require('@/routes/modules/HealthModule');
				return new HealthModule();
			},
			user: async () => {
				const { UserModule } = await import('@/routes/modules/UserModule');
				return new UserModule();
			},
			admin: async () => {
				const { AdminModule } = await import('@/routes/modules/AdminModule');
				return new AdminModule();
			},
			storage: async () => {
				const { StorageModule } = await import('@/routes/modules/StorageModule');
				return new StorageModule();
			},
			subscription: async () => {
				const { SubscriptionModule } = await import('@/routes/modules/SubscriptionModule');
				return new SubscriptionModule();
			},
		};
	}

	// 懒加载模块
	async getModule(moduleName: string): Promise<IRouteModule> {
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
	async preloadModules(moduleNames: string[]): Promise<void> {
		for (const moduleName of moduleNames) {
			await this.getModule(moduleName);
		}
	}

	getRegisteredModules(): string[] {
		return Array.from(this.registeredModules);
	}
}

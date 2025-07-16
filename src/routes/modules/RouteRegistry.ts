import { AdminModule } from '@/routes/modules/AdminModule';
import { HealthModule } from '@/routes/modules/HealthModule';
import { StorageModule } from '@/routes/modules/StorageModule';
import { SubscriptionModule } from '@/routes/modules/SubscriptionModule';
import { UserModule } from '@/routes/modules/UserModule';
import { IRouteModule } from '@/routes/modules/base/RouteModule';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 路由注册器 - 统一管理所有路由模块
 */
export class RouteRegistry {
	private modules: IRouteModule[] = [];

	constructor() {
		this.initializeModules();
	}

	/**
	 * 初始化所有路由模块
	 */
	private initializeModules(): void {
		this.modules = [new HealthModule(), new UserModule(), new AdminModule(), new StorageModule(), new SubscriptionModule()];
	}

	/**
	 * 注册所有路由模块到应用实例
	 * @param app OpenAPIHono 应用实例
	 */
	registerAllModules(app: OpenAPIHono<{ Bindings: Env }>): void {
		console.log('🚀 开始注册路由模块...');

		this.modules.forEach((module) => {
			try {
				module.register(app);
				console.log(`✅ 路由模块注册成功: ${module.moduleName}`);
			} catch (error) {
				console.error(`❌ 路由模块注册失败: ${module.moduleName}`, error);
				throw error;
			}
		});

		console.log(`🎉 所有路由模块注册完成，共 ${this.modules.length} 个模块`);
	}

	/**
	 * 获取已注册的模块列表
	 */
	getRegisteredModules(): string[] {
		return this.modules.map((module) => module.moduleName);
	}

	/**
	 * 添加自定义路由模块
	 * @param module 路由模块实例
	 */
	addModule(module: IRouteModule): void {
		this.modules.push(module);
		console.log(`➕ 添加自定义路由模块: ${module.moduleName}`);
	}

	/**
	 * 移除路由模块
	 * @param moduleName 模块名称
	 */
	removeModule(moduleName: string): boolean {
		const index = this.modules.findIndex((module) => module.moduleName === moduleName);
		if (index !== -1) {
			this.modules.splice(index, 1);
			console.log(`➖ 移除路由模块: ${moduleName}`);
			return true;
		}
		return false;
	}
}

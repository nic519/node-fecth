import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 路由模块基础接口
 */
export interface IRouteModule {
	/**
	 * 注册路由到应用实例
	 * @param app OpenAPIHono 应用实例
	 */
	register(app: OpenAPIHono<{ Bindings: Env }>): void;

	/**
	 * 模块名称
	 */
	readonly moduleName: string;
}

/**
 * 路由模块基础抽象类
 */
export abstract class BaseRouteModule implements IRouteModule {
	abstract readonly moduleName: string;

	abstract register(app: OpenAPIHono<{ Bindings: Env }>): void;

	/**
	 * 错误处理工具方法
	 */
	protected handleError(error: unknown, context: string) {
		console.error(`❌ ${this.moduleName} - ${context}:`, error);
		return {
			error: 'Internal Server Error',
			message: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

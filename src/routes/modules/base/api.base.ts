import { ResponseCodes } from '@/types/openapi-schemas';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 路由模块基础接口
 */
export interface IAPI {
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
export abstract class BaseAPI implements IAPI {
	readonly moduleName: string;

	constructor() {
		this.moduleName = this.constructor.name.replace(/^API/, '').toLowerCase();
	}

	abstract register(app: OpenAPIHono<{ Bindings: Env }>): void;

	/**
	 * 错误处理工具方法
	 */
	protected handleError(error: unknown, context: string) {
		console.error(`❌ ${this.moduleName} - ${context}:`, error);
		return {
			code: ResponseCodes.INTERNAL_ERROR,
			msg: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

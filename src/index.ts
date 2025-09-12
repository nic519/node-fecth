import { GlobalConfig, initGlobalConfig } from '@/config/global-config';
import { Router } from '@/routes/routesHandler';

/**
 * ===================================================================
 * 🚀 Workers 全栈应用入口 (统一生产和开发环境)
 * ===================================================================
 *
 * 架构特点：
 * - 静态资源: Workers Static Assets 自动处理
 * - API 请求: 路由系统处理
 * - 统一入口: 不再区分开发/生产模式
 * - 平台抽象: 为未来 Vercel 迁移做准备
 */

class ApplicationService {
	private router = new Router();

	constructor(private env: Env) {}

	async handleRequest(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// 记录请求信息 (开发阶段)
		if (GlobalConfig.isDev) {
			console.log(`🚀 Workers 处理请求: ${request.method} ${url.pathname}`);
		}

		// 所有请求都通过路由系统处理
		// 静态资源会被 Workers Static Assets 自动拦截
		return this.router.route(request, this.env);
	}
}

/**
 * Workers 运行时入口
 * 处理所有请求：API、静态资源、SPA 路由
 */
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// 初始化全局配置
		initGlobalConfig(request, env);

		try {
			// 输出headers
			console.log('headers', request.headers);

			const service = new ApplicationService(env);
			return await service.handleRequest(request);
		} catch (error) {
			console.error('❌ 应用错误:', error);

			// 开发环境返回详细错误信息
			if (GlobalConfig.isDev) {
				return new Response(
					JSON.stringify({
						error: 'Internal Server Error',
						message: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}

			// 生产环境返回通用错误
			return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};

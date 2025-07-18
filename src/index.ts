import { initGlobalConfig } from '@/config/global-config';
import { Router } from '@/routes/routesHandler';

class SubscriptionService {
	private router = new Router();

	constructor(private env: Env) {}

	async handleRequest(request: Request): Promise<Response> {
		return this.router.route(request, this.env);
	}
}

// Worker 入口 (仅用于开发模式，生产环境使用 Pages Functions)
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log('🔑 开发模式 - Workers 处理请求');
		initGlobalConfig(request, env);

		const service = new SubscriptionService(env);
		return service.handleRequest(request);
	},
};

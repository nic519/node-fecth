import { ExecutionContext } from '@cloudflare/workers-types';
import { Router } from '@/routes/routesHandler';
import { initGlobalConfig } from '@/config/global-config';

class SubscriptionService {
	private router = new Router();

	constructor(private env: Env) {}

	async handleRequest(request: Request): Promise<Response> {
		return this.router.route(request, this.env);
	}
}

// Worker 入口
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		console.log('🔑 开始处理请求');
		initGlobalConfig(request, env);

		const service = new SubscriptionService(env);
		return service.handleRequest(request);
	},
};

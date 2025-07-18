import { initGlobalConfig } from '@/config/global-config';
import { Router } from '@/routes/routesHandler';

// Pages Functions 入口 - 处理根路径路由（包括 OpenAPI 文档）
export const onRequest: PagesFunction<Env> = async (context) => {
	const { request, env } = context;

	console.log('📄 Pages Functions 处理根路径请求');
	initGlobalConfig(request, env);

	const router = new Router();
	return router.route(request, env);
};

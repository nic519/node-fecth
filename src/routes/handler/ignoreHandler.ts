import { RouteHandler } from '@/types/routes.types';

export class IgnoreHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// 忽略 favicon.ico 和其他静态资源请求
		if (
			pathname === '/favicon.ico' ||
			pathname === '/robots.txt' ||
			pathname === '/openapi.json' ||
			pathname.startsWith('/static/') ||
			pathname.endsWith('.ico') ||
			pathname.endsWith('.png') ||
			pathname.endsWith('.jpg') ||
			pathname.endsWith('.gif') ||
			pathname.endsWith('.css') ||
			pathname.endsWith('.js') ||
			pathname.endsWith('.json')
		) {
			return null; // 让静态文件服务器处理
		}
		return null;
	}
}

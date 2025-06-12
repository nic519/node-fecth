import { RouteHandler } from '@/types/routesType';

export class IgnoreHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		// 忽略 favicon.ico 和其他静态资源请求
		if (
			pathname === '/favicon.ico' ||
			pathname === '/robots.txt' ||
			pathname.startsWith('/static/') ||
			pathname.endsWith('.ico') ||
			pathname.endsWith('.png') ||
			pathname.endsWith('.jpg') ||
			pathname.endsWith('.gif') ||
			pathname.endsWith('.css') ||
			pathname.endsWith('.js')
		) {
			return new Response(null, { status: 204 }); // 返回 204 No Content
		}
		return null;
	}
}

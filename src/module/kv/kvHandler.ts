import { RouteHandler } from '@/routes/routesType';
import { CommonUtils } from '@/utils/commonUtils';
import { RoutesPath } from '@/routes/routesPath';
import { KvService } from '@/module/kv/services/kvService';
import { ForwardingService } from '@/module/kv/services/forwardingService';
import { AuthUtils } from '@/utils/authUtils';

export class KvHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		console.log('kvHandler', url, request.method);

		// 如果是本地开发环境，直接转发整个请求
		if (CommonUtils.isLocalEnv(request)) {
			console.log('🔄 本地开发环境检测到，转发到生产worker');
			return ForwardingService.forwardRequest(request);
		}

		// 统一验证token
		let uid: string | undefined;
		let token: string | null = null;

		if (request.method === 'GET') {
			uid = url.searchParams.get('uid') || undefined;
			token = url.searchParams.get('token');
		} else if (request.method === 'POST') {
			const body = (await request.json()) as { uid?: string; token?: string };
			uid = body.uid;
			token = body.token || null;
		}

		if (!uid) return new Response('缺少参数: uid', { status: 400 });

		const authResult = AuthUtils.validateToken(uid, token, env);
		if (authResult instanceof Response) return authResult;

		// 生产环境或有KV binding的环境，直接处理
		const kvService = new KvService(request, env);

		if (request.method === 'POST') {
			return this.handlePost(request, kvService);
		}
		return this.handleGet(request, kvService);
	}

	private async handleGet(request: Request, kvService: KvService): Promise<Response> {
		const url = new URL(request.url);
		const key = url.searchParams.get('key');

		if (!key) return new Response('缺少参数: key', { status: 400 });

		const value = await kvService.get(key);
		if (value === null) return new Response('Key not found', { status: 404 });

		return new Response(value, this.getHeaders());
	}

	private async handlePost(request: Request, kvService: KvService): Promise<Response> {
		// 重新解析body，因为在handle方法中已经解析过一次
		const body = await request.text();
		const { key, value, action } = JSON.parse(body) as {
			key: string;
			value?: string;
			action?: string;
		};

		if (!key) return new Response('缺少参数: key', { status: 400 });

		if (action === 'delete') {
			await kvService.delete(key);
			return new Response('删除成功', this.getHeaders());
		}

		if (!value) return new Response('缺少参数: value', { status: 400 });

		await kvService.put(key, value);
		return new Response('OK', this.getHeaders());
	}

	private getHeaders() {
		return {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Access-Control-Allow-Origin': '*',
			},
		};
	}
}

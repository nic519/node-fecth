import { RouteHandler } from '@/types/routes.types';
import { KvService } from '@/module/kv/services/kvService';
import { AuthUtils } from '@/utils/authUtils';

export class KvHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		console.log('kvHandler', url, request.method);

		// 统一验证token
		const uid = url.searchParams.get('uid') || undefined;
		const token = url.searchParams.get('token') || undefined;
		const authResult = AuthUtils.validateToken(env, uid, token);
		if (authResult instanceof Response) return authResult;

		// 生产环境或有KV binding的环境，直接处理
		const kvService = new KvService(env);

		if (request.method === 'POST') {
			const body = await request.text();
			const bodyParams = JSON.parse(body);
			return this.handlePost(bodyParams, kvService);
		}
		return this.handleGet(url.searchParams.get('key') || '', kvService);
	}

	private async handleGet(key: string, kvService: KvService): Promise<Response> {
		if (!key) return new Response('缺少参数: key', { status: 400 });

		const value = await kvService.get(key);
		if (value === null) return new Response('Key not found', { status: 404 });

		return new Response(value, this.getHeaders());
	}

	private async handlePost(bodyParams: { key: string; value: string }, kvService: KvService): Promise<Response> {
		const { key, value } = bodyParams;
		if (!key || !value) return new Response('缺少参数: key/value', { status: 400 });

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

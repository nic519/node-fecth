import { RouteHandler } from '@/types/routes.types';
import { KvService } from '@/module/kv/services/kvService';
import { AuthUtils } from '@/utils/authUtils';

export class KvHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		console.log('kvHandler', url, request.method);

		try {
			// 统一验证身份
			const authResult = await AuthUtils.authenticateFromQuery(request, env);
			if (!authResult.success) {
				return authResult.response!;
			}

			// 生产环境或有KV binding的环境，直接处理
			const kvService = new KvService(env);

			if (request.method === 'POST') {
				const body = await request.text();
				const bodyParams = JSON.parse(body);
				return this.handlePost(bodyParams, kvService);
			}
			return this.handleGet(url.searchParams.get('key') || '', kvService);
		} catch (error) {
			console.error('KV处理错误:', error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500, 'text/plain');
		}
	}

	private async handleGet(key: string, kvService: KvService): Promise<Response> {
		if (!key) {
			return AuthUtils.createErrorResponse('缺少参数: key', 400, 'text/plain');
		}

		try {
			const value = await kvService.get(key);
			if (value === null) {
				return AuthUtils.createErrorResponse('Key not found', 404, 'text/plain');
			}

			return new Response(value, {
				headers: AuthUtils.getCorsHeaders('text/plain; charset=utf-8'),
			});
		} catch (error) {
			console.error('KV读取错误:', error);
			return AuthUtils.createErrorResponse('Failed to read from KV', 500, 'text/plain');
		}
	}

	private async handlePost(bodyParams: { key: string; value: string }, kvService: KvService): Promise<Response> {
		const { key, value } = bodyParams;
		if (!key || !value) {
			return AuthUtils.createErrorResponse('缺少参数: key/value', 400, 'text/plain');
		}

		try {
			await kvService.put(key, value);
			return new Response('OK', {
				headers: AuthUtils.getCorsHeaders('text/plain; charset=utf-8'),
			});
		} catch (error) {
			console.error('KV写入错误:', error);
			return AuthUtils.createErrorResponse('Failed to write to KV', 500, 'text/plain');
		}
	}
}

import { RouteHandler } from '@/routes/routesType';
import { CommonUtils } from '@/utils/commonUtils';
import { RoutesPath } from '@/routes/routesPath';
import { KvService } from '@/module/kv/services/kvService';
import { ForwardingService } from '@/module/kv/services/forwardingService';

export class KvHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response | null> {
		const url = new URL(request.url);
		console.log('kvHandler', url, request.method);

		// 如果是本地开发环境，直接转发整个请求
		if (CommonUtils.isLocalEnv(request)) {
			console.log('🔄 本地开发环境检测到，转发到生产worker');
			return ForwardingService.forwardRequest(request, RoutesPath.kv);
		}

		// 生产环境或有KV binding的环境，直接处理
		const kvService = new KvService(request, env);

		if (request.method === 'POST') {
			return this.handlePost(request, kvService);
		}
		return this.handleGet(request, kvService);
	}

	private async handleGet(request: Request, kvService: KvService): Promise<Response> {
		const url = new URL(request.url);

		// 获取参数
		const key = url.searchParams.get('key');
		const token = url.searchParams.get('token');
		const uid = url.searchParams.get('uid');

		if (!key) {
			return new Response('缺少必要参数: key', { status: 400 });
		}

		try {
			// 使用KV服务获取值
			const value = await kvService.get(key, uid || undefined, token || undefined);

			if (value === null) {
				return new Response('Key not found', { status: 404 });
			}

			return new Response(value, {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			console.error('KV获取错误:', error);
			return new Response('获取KV值时发生错误', { status: 500 });
		}
	}

	private async handlePost(request: Request, kvService: KvService): Promise<Response> {
		try {
			// 解析请求体
			const body = (await request.json()) as {
				key: string;
				value?: string;
				action?: string;
				uid?: string;
				token?: string;
			};

			const { key, value, action, uid, token } = body;

			if (!key) {
				return new Response('缺少必要参数: key', { status: 400 });
			}

			// 处理删除操作
			if (action === 'delete') {
				await kvService.delete(key, uid, token);
				return new Response('删除成功', {
					status: 200,
					headers: {
						'Content-Type': 'text/plain; charset=utf-8',
						'Access-Control-Allow-Origin': '*',
					},
				});
			}

			// 处理存储操作
			if (!value) {
				return new Response('缺少必要参数: value', { status: 400 });
			}

			await kvService.put(key, value, uid, token);

			console.log(`✅ KV PUT成功: ${key}`);

			return new Response('OK', {
				status: 200,
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			console.error('KV操作错误:', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			return new Response(`KV操作失败: ${errorMessage}`, { status: 500 });
		}
	}
}

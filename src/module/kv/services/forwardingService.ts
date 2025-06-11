import { CommonUtils } from '@/utils/commonUtils';

/**
 * 通用请求转发服务
 * 负责在本地开发环境中将请求转发到生产环境
 */
export class ForwardingService {
	/**
	 * 转发完整的HTTP请求到生产环境
	 */
	static async forwardRequest(request: Request): Promise<Response> {
		try {
			// 构建转发URL - 直接替换base URL，保持原始路径和参数
			const originalUrl = new URL(request.url);
			const forwardUrl = new URL(CommonUtils.getProdURI());
			forwardUrl.pathname = originalUrl.pathname;
			forwardUrl.search = originalUrl.search;

			console.log(`🌐 转发请求到: ${forwardUrl.toString()}`);

			// 克隆请求体（如果是POST请求）
			let body: string | undefined;
			if (request.method === 'POST') {
				body = await request.text();
			}

			// 转发请求
			const response = await fetch(forwardUrl.toString(), {
				method: request.method,
				headers: request.headers,
				body,
			});

			// 获取响应内容
			const responseText = await response.text();

			console.log(`📥 生产worker响应: ${response.status} - ${responseText.substring(0, 100)}...`);

			// 返回相同的响应
			return new Response(responseText, {
				status: response.status,
				headers: {
					'Content-Type': response.headers.get('Content-Type') || 'text/plain; charset=utf-8',
					'Access-Control-Allow-Origin': '*',
					'X-Proxy-Source': 'local-dev-forward',
				},
			});
		} catch (error) {
			console.error('转发到生产worker失败:', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			return new Response(`转发请求失败: ${errorMessage}`, { status: 500 });
		}
	}
}

import { CommonUtils } from '@/utils/commonUtils';

/**
 * 通用请求转发服务
 * 负责在本地开发环境中将请求转发到生产环境
 */
export class ForwardingService {
	/**
	 * 转发完整的HTTP请求到生产环境
	 */
	static async forwardRequest(request: Request, targetPath: string): Promise<Response> {
		try {
			// 构建转发URL
			const forwardUrl = new URL(targetPath, CommonUtils.getProdURI());
			const originalUrl = new URL(request.url);

			// 复制所有查询参数
			originalUrl.searchParams.forEach((value, key) => {
				forwardUrl.searchParams.set(key, value);
			});

			console.log(`🌐 转发请求到: ${forwardUrl.toString()}`);

			// 克隆请求体（如果是POST请求）
			let body: string | undefined;
			if (request.method === 'POST') {
				body = await request.text();
			}

			// 转发请求
			const response = await fetch(forwardUrl.toString(), {
				method: request.method,
				headers: {
					'User-Agent': 'Local-Dev-Proxy/1.0',
					'X-Forwarded-For': 'local-development',
					'Content-Type': request.headers.get('Content-Type') || 'application/json',
				},
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

	/**
	 * 发送GET请求到生产环境
	 */
	static async forwardGet(targetPath: string, params: Record<string, string> = {}): Promise<string | null> {
		try {
			const forwardUrl = new URL(targetPath, CommonUtils.getProdURI());

			// 添加查询参数
			Object.entries(params).forEach(([key, value]) => {
				if (value) forwardUrl.searchParams.set(key, value);
			});

			console.log(`🌐 转发GET请求到: ${forwardUrl.toString()}`);

			const response = await fetch(forwardUrl.toString(), {
				method: 'GET',
				headers: {
					'User-Agent': 'Local-Dev-KV-Proxy/1.0',
					'X-Forwarded-For': 'local-development',
				},
			});

			if (response.status === 404) {
				return null;
			}

			if (!response.ok) {
				throw new Error(`GET转发失败: ${response.status} - ${await response.text()}`);
			}

			const result = await response.text();
			console.log(`📥 GET成功: ${result.substring(0, 100)}...`);
			return result;
		} catch (error) {
			console.error('GET转发失败:', error);
			throw error;
		}
	}

	/**
	 * 发送POST请求到生产环境
	 */
	static async forwardPost(targetPath: string, data: Record<string, any>): Promise<void> {
		try {
			const forwardUrl = new URL(targetPath, CommonUtils.getProdURI());

			console.log(`🌐 转发POST请求到: ${forwardUrl.toString()}`);

			const response = await fetch(forwardUrl.toString(), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Local-Dev-KV-Proxy/1.0',
					'X-Forwarded-For': 'local-development',
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error(`POST转发失败: ${response.status} - ${await response.text()}`);
			}

			console.log(`📤 POST成功`);
		} catch (error) {
			console.error('POST转发失败:', error);
			throw error;
		}
	}
}

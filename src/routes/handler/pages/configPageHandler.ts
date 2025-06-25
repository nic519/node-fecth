import { GlobalConfig } from '@/config/global-config';
import { RouteHandler } from '@/types/routes.types';
import { ConfigResponse } from '@/types/user-config.types';
import { AuthUtils } from '@/utils/authUtils';
import { UserConfigPage } from '@/components/pages/UserConfigPage';

export class ConfigPageHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		console.log(`📄 配置页面请求: ${pathname}`);

		try {
			// 解析路径参数
			const pathParts = pathname.split('/').filter(Boolean);

			// 路由匹配: /config/:userId
			if (pathParts[0] === 'config' && pathParts[1]) {
				const userId = pathParts[1];

				// 验证用户权限
				const authResult = await AuthUtils.authenticate(request, env, userId);
				
				// 从 URL 参数获取 token
				const token = url.searchParams.get('token') || '';

				// 使用 JSX 组件生成页面
				const html = UserConfigPage({ 
					userId, 
					configResponse: authResult, 
					token 
				});

				return new Response(html as string, {
					status: 200,
					headers: {
						'Content-Type': 'text/html;charset=utf-8',
						'Cache-Control': 'no-cache',
					},
				});
			}

			return new Response('Not Found', { status: 404 });
		} catch (error) {
			console.error('配置页面处理错误:', error);
			return AuthUtils.createErrorResponse('Internal Server Error', 500, 'text/html');
		}
	}

	/**
	 * 转义HTML特殊字符，防止XSS攻击
	 */
	private escapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
	}
}

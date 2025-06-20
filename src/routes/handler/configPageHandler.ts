import { RouteHandler } from '@/types/routes.types';
import { UserManager } from '@/module/userManager/userManager';
import { AuthUtils } from '@/utils/authUtils';
import { ConfigResponse, UserConfig } from '@/types/user-config.types';

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

				// 生成HTML页面
				const html = await this.generateConfigPage(userId, authResult, request);

				return new Response(html, {
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
	 * 生成配置管理页面HTML（从 HTML 模板文件读取并插值）
	 */
	private async generateConfigPage(userId: string, configRespone: ConfigResponse, request: Request): Promise<string> {
		const htmlResp = await fetch(new URL('/user-modify.html', request.url));
		let template = await htmlResp.text();

		// 变量插值 - 安全转义HTML特殊字符
		const escapedConfig = JSON.stringify(configRespone);
		console.log(`escapedConfig=${escapedConfig}`);
		template = template.replace(/\$\{configRespone\}/g, escapedConfig);
		return template;
	}

	/**
	 * 转义HTML特殊字符，防止XSS攻击
	 */
	private escapeHtml(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
	}

	/**
	 * 获取默认配置YAML模板
	 */
	private getDefaultConfigYaml(): string {
		return `subscribe: "https://example.com/subscription"
accessToken: "your-access-token"
fileName: "config.yaml"
excludeRegex: "Standard"
appendSubList:
  - ""
flag: "🥷"
includeArea: "[HK]"`;
	}
}

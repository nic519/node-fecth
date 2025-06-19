import { RouteHandler } from '@/types/routes.types';
import { UserManager } from '@/module/userManager/userManager';

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
				const token = url.searchParams.get('token');

				if (!token) {
					return new Response('Missing access token', { status: 401 });
				}

				// 验证用户权限
				const userManager = new UserManager(env);
				if (!userManager.validateUserPermission(userId, token)) {
					return new Response('Invalid access token', { status: 403 });
				}

				// 获取用户配置
				const configResponse = await userManager.getUserConfig(userId);
				const config = configResponse?.config;

				// 生成HTML页面
				const html = await this.generateConfigPage(userId, config, request);

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
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 生成配置管理页面HTML（从 HTML 模板文件读取并插值）
	 */
	private async generateConfigPage(userId: string, config: any, request: Request): Promise<string> {
		const htmlResp = await fetch(new URL('/user-modify.html', request.url));
		let template = await htmlResp.text();

		const configYaml = config ? this.configToYaml(config) : this.getDefaultConfigYaml();

		// 变量插值
		template = template.replace(/\$\{userId\}/g, userId).replace(/\$\{configYaml\}/g, configYaml);
		return template;
	}

	/**
	 * 配置对象转YAML字符串
	 */
	private configToYaml(config: any): string {
		if (!config) return this.getDefaultConfigYaml();

		const lines = [];
		lines.push('# 用户配置');
		lines.push('# 请根据您的需求修改以下配置');
		lines.push('');

		if (config.subscribe) lines.push(`subscribe: "${config.subscribe}"`);
		if (config.accessToken) lines.push(`accessToken: "${config.accessToken}"`);
		if (config.ruleUrl) lines.push(`ruleUrl: "${config.ruleUrl}"`);
		if (config.fileName) lines.push(`fileName: "${config.fileName}"`);

		if (config.multiPortMode && config.multiPortMode.length > 0) {
			lines.push(`multiPortMode:${config.multiPortMode.map((code: string) => `\n  - ${code}`).join('')}`);
		}

		if (config.appendSubList && config.appendSubList.length > 0) {
			lines.push('appendSubList:');
			config.appendSubList.forEach((sub: any) => {
				lines.push(`  - subscribe: "${sub.subscribe}"`);
				lines.push(`    flag: "${sub.flag}"`);
				if (sub.includeArea && sub.includeArea.length > 0) {
					lines.push(`    includeArea:${sub.includeArea.map((code: string) => `\n      - ${code}`).join('')}`);
				}
			});
		}

		if (config.excludeRegex) lines.push(`excludeRegex: "${config.excludeRegex}"`);

		return lines.join('\n');
	}

	/**
	 * 获取默认配置YAML模板
	 */
	private getDefaultConfigYaml(): string {
		return `# 用户配置模板
# 请根据您的需求修改以下配置

# 必需的订阅地址
subscribe: "https://example.com/subscription"

# 必需的访问令牌
accessToken: "your-access-token"

# 可选的规则模板链接
# ruleUrl: "https://example.com/rules"

# 可选的文件名
# fileName: "config.yaml"

# 可选的多端口模式（地区代码）
# multiPortMode:
#   - TW
#   - SG
#   - JP

# 可选的追加订阅列表
# appendSubList:
#   - subscribe: "https://example.com/sub1"
#     flag: "sub1"
#     includeArea:
#       - US
#       - HK
#   - subscribe: "https://example.com/sub2"
#     flag: "sub2"

# 可选的排除正则表达式
# excludeRegex: ".*test.*"`;
	}
}

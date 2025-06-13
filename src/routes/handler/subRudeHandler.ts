import { RouteHandler } from '@/types/routesType';
import { ProcessedDBUser, RESPONSE_HEADERS } from '@/types/userTypes';
import { ConfigValidator } from '@/module/configValidator';
import { YamlRudeMerge } from '@/module/yamlRudeMerge';
import { CommonUtils } from '@/utils/commonUtils';
import { SubscribeParamsValidator } from '@/types/subscribeTypes';

export class SubRudeHandler implements RouteHandler {
	private configValidator = new ConfigValidator();

	async handle(request: Request, env: Env, params?: Record<string, any>): Promise<Response | null> {
		const url = new URL(request.url);
		const authConfig = params?.authConfig as ProcessedDBUser;
		if (!authConfig) {
			return new Response('缺少必要参数: authConfig', { status: 400 });
		}

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);
			const yamlMerge = new YamlRudeMerge(authConfig.subscribe, authConfig.ruleUrl);
			const { yamlContent, subInfo } = queryParams.mode === 'fast' ? await yamlMerge.fastStrategy() : await yamlMerge.multiPortStrategy();

			// 使用配置验证器验证格式
			const formatError = this.configValidator.validate(yamlContent, queryParams.target);
			if (formatError) return formatError;

			var headers = {
				...RESPONSE_HEADERS,
				'Subscription-Userinfo': subInfo,
				'Content-Type': queryParams.target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
			};

			// 通过URL参数控制是否下载文件
			if (queryParams.download) {
				(headers as any)['Content-Disposition'] = `attachment; filename=${authConfig.fileName}.${queryParams.target === 'clash' ? 'yaml' : 'json'}`;
			}

			return new Response(yamlContent, {
				status: 200,
				headers: headers,
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response(error instanceof Error ? error.message : '处理订阅时发生错误', { status: 500 });
		}
	}
}

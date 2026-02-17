/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserConfig } from '@/types/openapi-schemas';
import { YamlValidator } from '@/modules/yamlMerge/utils/yamlValidator';
import { YamlMergeFactory } from '@/modules/yamlMerge/yamlMergeFactory';
import { SubscribeParamsValidator } from '@/types/request/url-params.types';
import { RouteHandler } from '@/types/routes.types';

const RESPONSE_HEADERS: Record<string, string> = {
	'Content-Type': 'text/yaml; charset=utf-8',
	'Profile-Update-Interval': '24',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
};

export class ClashHandler implements RouteHandler {
	private _buildRespHeaders(subInfo: string, fileName?: string): Record<string, string> {
		const headers: Record<string, string> = {
			...RESPONSE_HEADERS,
			'Subscription-Userinfo': subInfo,
		};
		if (fileName) {
			headers['Content-Disposition'] = `attachment; filename=${fileName}.yaml`;
		}
		return headers;
	}

	async handle(request: Request, env: Env, params?: Record<string, any>): Promise<Response | null> {
		const url = new URL(request.url);
		const userConfig: UserConfig = params!.userConfig;

		try {
			const queryParams = SubscribeParamsValidator.parseParams(url);

			const yamlMerge = new YamlMergeFactory(userConfig);
			const { yamlContent, subInfo } = await yamlMerge.generate();

			const yamlValidator = new YamlValidator();
			yamlValidator.validate(yamlContent);

			return new Response(yamlContent, {
				status: 200,
				headers: this._buildRespHeaders(subInfo, queryParams.download ? userConfig.fileName : undefined),
			});
		} catch (error) {
			console.error('ClashHandler handle error:', error);
			return new Response(error instanceof Error ? error.message : '处理订阅时发生错误', { status: 500 });
		}
	}
}

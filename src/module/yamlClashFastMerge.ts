import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ExtractClashNode } from './extractClashNode';
import { KvService } from '@/module/kv/services/kvService';
import { CustomError, ErrorCode } from '@/utils/customError';
import { TrafficUtils } from '@/utils/trafficUtils';

export class ClashYamlMerge {
	private kvService: KvService;

	constructor(
		// 环境变量
		private env: Env,
		// 请求
		private request: Request,
		// clash订阅地址
		private clashSubUrl: string,
		// clash使用的yaml模板地址（仅包含规则）
		private clashTemplateUrl: string,
		// 用户信息
		private token: string,
		private uid: string
	) {
		this.kvService = new KvService(request, env);
	}

	private getWorkerUrl(): string | null {
		const url = new URL(this.request.url);
		return url.origin;
	}

	// 根据clash的yaml动态配置，提取原始订阅地址
	// 把原始订阅地址，存入worker的kv，并可以通过一个url获取出来
	private async extractOriginalSubUrl(clashRawCfg: string): Promise<string> {
		try {
			const extractor = new ExtractClashNode();
			// TODO: 不需要解析，直接从clash content中拿
			const clashNodes = extractor.getOriginalLinks(clashRawCfg);

			if (!clashNodes || clashNodes.trim().length === 0) {
				throw new CustomError(ErrorCode.NO_PROXIES_FOUND, '无法从订阅内容中提取到有效的代理节点', 422, {
					subscriptionUrl: this.clashSubUrl,
				});
			}

			console.log(`🔑 clashNodes: ${clashNodes}`);

			// 生成简单的键：使用URL的hostname和pathname的组合
			const url = new URL(this.clashSubUrl);
			const storageKey = `sub-${url.hostname}${url.pathname.replace(/[^a-z]/g, '-')}`;

			// 使用KV代理服务进行存储
			// value要用base64编码
			const value = btoa(clashNodes);
			await this.kvService.put(storageKey, value);

			return storageKey;
		} catch (error) {
			if (error instanceof CustomError) {
				throw error;
			}

			throw new CustomError(ErrorCode.SUBSCRIPTION_FETCH_FAILED, '处理订阅内容时发生错误', 500, {
				originalError: error instanceof Error ? error.message : String(error),
				subscriptionUrl: this.clashSubUrl,
			});
		}
	}

	/// 把订阅地址合并进去
	async getFinalRawCfg(): Promise<{ yamlContent: string; subInfo: string }> {
		// 得到clash配置+剩余流量信息
		const { content: clashContent, subInfo: clashSubInfo } = await TrafficUtils.fetchClashContent(this.clashSubUrl);

		// 得到clash模板
		const clashCfgTemplate = await fetch(this.clashTemplateUrl).then((res) => res.text());
		// 把clash配置里面的节点信息提取出来
		const kvKey = await this.extractOriginalSubUrl(clashContent);
		console.log(`🔑 extractOriginalSubUrl: ${kvKey}`);

		const routeUrl = `${this.getWorkerUrl()}/kv?key=${kvKey}&uid=${this.uid}&token=${this.token}`;
		console.log(`🔑 提取原始订阅地址: ${routeUrl}`);

		// 合并yaml
		const yamlObj = yamlParse(clashCfgTemplate);
		// 修改proxy-providers中的url
		if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
			yamlObj['proxy-providers']['Airport1'].url = routeUrl;
		}
		// 把yamlObj转成yaml字符串
		return {
			yamlContent: yamlStringify(yamlObj),
			subInfo: clashSubInfo,
		};
	}

	async merge(): Promise<{ yamlContent: string; subInfo: string }> {
		const { yamlContent, subInfo } = await this.getFinalRawCfg();
		return {
			yamlContent,
			subInfo,
		};
	}
}

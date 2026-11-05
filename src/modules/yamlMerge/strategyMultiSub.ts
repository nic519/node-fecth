import { StrategyMultiPort } from '@/modules/yamlMerge/strategyMultiPort';
import { StrategyUtils } from '@/modules/yamlMerge/utils/strategyUtils';
import type { YamlObject, YamlValue } from '@/modules/yamlMerge/utils/yamlTypes';
import { ClashProxy } from '@/types/clash.types';
import { UserConfig } from '@/types/api-schemas';
import { createConcurrencyLimit } from '@/utils/http/client';
import { logger } from '@/utils/request/network.config';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { buildSubscriptionListFromConfig } from '@/modules/user/subscription-list';
import yaml from 'js-yaml';
import { normalizeInlineProxies } from '@/modules/user/inline-proxies';
import { safeError } from '@/utils/logHelper';
import { PreMergeInfo } from './clash-merge.types';

export interface SubscriptionOutcome {
  sourceCount: number;
  successCount: number;
  failedCount: number;
  staleCount: number;
  failures: string[];
}

export class StrategyMultiSub {
	constructor(
		private ruleContent: string,
		private userConfig: UserConfig,
		private uid?: string,
		private runtimeEnv?: Env,
        private outcome?: SubscriptionOutcome,
	) { }

	private async getProxyList(): Promise<{ allProxyList: ClashProxy[]; preMergeInfo: PreMergeInfo }> {
		const allProxyList: ClashProxy[] = [];
		const preMergeInfo: PreMergeInfo = {
			ruleContent: this.ruleContent,
			clashContent: '',
			subInfo: '',
		};

		const appendSubList = buildSubscriptionListFromConfig(this.userConfig);
		const userId = this.uid;
        if (this.outcome) this.outcome.sourceCount = appendSubList.length;

		if (appendSubList && appendSubList.length > 0) {
			// 使用并发控制，最大并发数 5
			const limit = createConcurrencyLimit(5);
			// 10 seconds timeout for each subscription is handled within fetch logic if needed, 
			// but getWithCache does not expose timeout. Assuming default ky timeout or sufficient.

			const tasks = appendSubList.map((sub, index) => limit(async () => {
				try {
					const result = sub.type === 'inline'
                        ? { content: normalizeInlineProxies(sub.proxiesYaml ?? ''), traffic: null }
                        : await DynamicService.getWithCache(
						sub.subscribe,
						5 * 60 * 1000,
						sub.proxyProvider,
						this.runtimeEnv,
                        () => { if (this.outcome) this.outcome.staleCount++; },
					);
					const clashContent = result.content;
					const subInfo = result.traffic || '';

					// 注意：这里会有多个订阅覆盖 preMergeInfo.clashContent 的情况
					// 但为了保持兼容性，暂时保留此逻辑
					preMergeInfo.clashContent = clashContent;

					const appendProxyList = StrategyUtils.getProxyList({
						clashContent,
						flag: sub.flag,
						includeArea: sub.includeArea,
					});

					if (this.outcome) this.outcome.successCount++;
                    return { proxyList: appendProxyList, subInfo, flag: sub.flag };
				} catch (error) {
					if (this.outcome) {
                        this.outcome.failedCount++;
                        this.outcome.failures.push(`来源 ${index + 1}: ${safeError(error)}`);
                    }
                    logger.error({ error: safeError(error), userId }, 'Failed to fetch subscription in strategy');
					// 失败时不中断整体流程，返回空列表
					return { proxyList: [], subInfo: '', flag: sub.flag };
				}
			}));

			const results = await Promise.all(tasks);

			for (const { proxyList, subInfo, flag } of results) {
				if (subInfo) {
					allProxyList.push({
						name: `${flag}-${StrategyUtils.formatSubInfo(subInfo)}`,
						server: 'www.baidu.com',
						port: 1443,
						type: 'http',
					});
					// 这里的赋值也可能被覆盖，逻辑同上
					preMergeInfo.subInfo = subInfo;
				}
				allProxyList.push(...proxyList);
			}
		}

		return { allProxyList, preMergeInfo };
	}

	async generate(): Promise<{ yamlContent: YamlObject; subInfo: string }> {
		const loaded = yaml.load(this.ruleContent);
		const yamlObj: YamlObject = (loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : {}) as YamlObject;

		delete yamlObj['proxy-providers'];

		const { allProxyList, preMergeInfo } = await this.getProxyList();

		if (!Array.isArray(yamlObj['proxies'])) {
			yamlObj['proxies'] = [] as YamlValue[];
		}
		(yamlObj['proxies'] as unknown as ClashProxy[]).push(...allProxyList);

		if (this.userConfig.multiPortMode) {
			const strategyMultiPort = new StrategyMultiPort(preMergeInfo, this.userConfig);
			const listeners = strategyMultiPort.createListeners(allProxyList);
			yamlObj['listeners'] = listeners as unknown as YamlValue;
		}

		return { yamlContent: yamlObj, subInfo: preMergeInfo.subInfo };
	}
}

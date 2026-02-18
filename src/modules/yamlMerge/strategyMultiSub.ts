import { UserConfig } from '@/types/openapi-schemas';
import { StrategyMultiPort } from '@/modules/yamlMerge/strategyMultiPort';
import { StrategyUtils } from '@/modules/yamlMerge/utils/strategyUtils';
import { ClashProxy } from '@/types/clash.types';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import yaml from 'js-yaml';
import { PreMergeInfo } from './clash-merge.types';
import { DEFAULT_SUB_FLAG } from '@/config/constants';

export class StrategyMultiSub {
	constructor(private ruleContent: string, private userConfig: UserConfig) { }

	private async getProxyList(): Promise<{ allProxyList: ClashProxy[]; preMergeInfo: PreMergeInfo }> {
		const allProxyList: ClashProxy[] = [];
		const preMergeInfo: PreMergeInfo = {
			ruleContent: this.ruleContent,
			clashContent: '',
			subInfo: '',
		};

		const appendSubList = this.userConfig.appendSubList;

		if (appendSubList && appendSubList.length > 0) {
			appendSubList.push({
				subscribe: this.userConfig.subscribe,
				flag: DEFAULT_SUB_FLAG,
			});

			const MAX_CONCURRENT = 3;
			const results: Array<{ proxyList: ClashProxy[]; subInfo: string; flag: string }> = [];

			for (let i = 0; i < appendSubList.length; i += MAX_CONCURRENT) {
				const batch = appendSubList.slice(i, i + MAX_CONCURRENT);

				const batchPromises = batch.map(async (sub) => {
					try {
						const trafficUtils = new ProxyFetch(sub.subscribe);
						const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();

						preMergeInfo.clashContent = clashContent;

						const appendProxyList = StrategyUtils.getProxyList({
							clashContent,
							flag: sub.flag,
							includeArea: sub.includeArea,
						});
						if (appendProxyList.length === 0) {
						}
						return { proxyList: appendProxyList, subInfo, flag: sub.flag };
					} catch {
						return { proxyList: [], subInfo: '', flag: sub.flag };
					}
				});

				const batchResults = await Promise.all(batchPromises);
				results.push(...batchResults);

				if (i + MAX_CONCURRENT < appendSubList.length) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			for (const { proxyList, subInfo, flag } of results) {
				if (subInfo) {
					allProxyList.push({
						name: `${flag}-${StrategyUtils.formatSubInfo(subInfo)}`,
						server: 'www.baidu.com',
						port: 1443,
						type: 'http',
					});
					preMergeInfo.subInfo = subInfo;
				}
				allProxyList.push(...proxyList);
			}
		}

		return { allProxyList, preMergeInfo };
	}

	async generate(): Promise<{ yamlContent: Record<string, any>; subInfo: string }> {
		const yamlObj = (yaml.load(this.ruleContent) || {}) as Record<string, any>;
		
		if (typeof yamlObj !== 'object') {
			return { yamlContent: yamlObj, subInfo: '' };
		}

		delete yamlObj['proxy-providers'];

		const { allProxyList, preMergeInfo } = await this.getProxyList();
		
		if (!Array.isArray(yamlObj['proxies'])) {
			yamlObj['proxies'] = [];
		}
		yamlObj['proxies'].push(...allProxyList);

		if (this.userConfig.multiPortMode) {
			const strategyMultiPort = new StrategyMultiPort(preMergeInfo, this.userConfig);
			yamlObj['listeners'] = strategyMultiPort.createListeners(yamlObj['proxies']);
		}

		return { yamlContent: yamlObj, subInfo: preMergeInfo.subInfo };
	}
}

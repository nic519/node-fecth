import { UserConfig } from '@/types/openapi-schemas';
import { StrategyMultiPort } from '@/modules/yamlMerge/strategyMultiPort';
import { StrategyUtils } from '@/modules/yamlMerge/utils/strategyUtils';
import { ClashProxy } from '@/types/clash.types';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import yaml from 'js-yaml';
import { PreMergeInfo } from './clash-merge.types';
import { DEFAULT_SUB_FLAG } from '@/config/constants';
import { createConcurrencyLimit } from '@/utils/http/client';
import { logger } from '@/utils/request/network.config';

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

			// 使用并发控制，最大并发数 5
			// 相比于原来的分批处理，这种方式更高效，能充分利用网络带宽
			const limit = createConcurrencyLimit(5);

			const tasks = appendSubList.map(sub => limit(async () => {
				try {
					const trafficUtils = new ProxyFetch(sub.subscribe);
					const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();

					// 注意：这里会有多个订阅覆盖 preMergeInfo.clashContent 的情况
					// 但为了保持兼容性，暂时保留此逻辑
					preMergeInfo.clashContent = clashContent;

					const appendProxyList = StrategyUtils.getProxyList({
						clashContent,
						flag: sub.flag,
						includeArea: sub.includeArea,
					});

					return { proxyList: appendProxyList, subInfo, flag: sub.flag };
				} catch (error) {
					logger.error({ url: sub.subscribe, error }, 'Failed to fetch subscription in strategy');
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

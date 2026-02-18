import yaml from 'js-yaml';
import { ClashProxy } from '@/types/clash.types';
import { PreMergeInfo } from './clash-merge.types';
import { StrategyUtils } from './utils/strategyUtils';

export class StrategyDirectly {
	constructor(private preMergeInfo: PreMergeInfo) { }

	generate(): Record<string, any> {
		const proxyList: ClashProxy[] = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
		});

		const yamlObj = (yaml.load(this.preMergeInfo.ruleContent) || {}) as Record<string, any>;

		if (typeof yamlObj === 'object') {
			delete yamlObj['proxy-providers'];

			if (!Array.isArray(yamlObj['proxies'])) {
				yamlObj['proxies'] = [];
			}
			yamlObj['proxies'].push(...proxyList);
		}

		return yamlObj;
	}
}

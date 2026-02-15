import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashProxy } from '@/types/clash.types';
import { PreMergeInfo } from './clash-merge.types';
import { StrategyUtils } from './utils/strategyUtils';

export class StrategyDirectly {
	constructor(private preMergeInfo: PreMergeInfo) {}

	generate(excludeRegex: string | undefined): string {
		// 获取主订阅的clash内容
		const proxyList: ClashProxy[] = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
			excludeRegex: excludeRegex,
		});

		const yamlObj = yamlParse(this.preMergeInfo.ruleContent);
		delete yamlObj['proxy-providers'];

		// 2.添加proxy
		if (yamlObj['proxies']) {
			yamlObj['proxies'].push(...proxyList);
		} else {
			yamlObj['proxies'] = proxyList;
		}
		return yamlStringify(yamlObj);
	}
}

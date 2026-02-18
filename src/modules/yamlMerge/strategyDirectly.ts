import yaml from 'js-yaml';
import { ClashProxy } from '@/types/clash.types';
import type { YamlObject } from '@/modules/yamlMerge/utils/yamlTypes';
import { PreMergeInfo } from './clash-merge.types';
import { StrategyUtils } from './utils/strategyUtils';

export class StrategyDirectly {
	constructor(private preMergeInfo: PreMergeInfo) { }

	generate(): YamlObject {
		const proxyList: ClashProxy[] = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
		});

		const loaded = yaml.load(this.preMergeInfo.ruleContent);
		const yamlObj: YamlObject = (loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : {}) as YamlObject;

		delete yamlObj['proxy-providers'];

		if (!Array.isArray(yamlObj['proxies'])) {
			yamlObj['proxies'] = [] as YamlObject['proxies'];
		}
		(yamlObj['proxies'] as unknown as ClashProxy[]).push(...proxyList);

		return yamlObj;
	}
}

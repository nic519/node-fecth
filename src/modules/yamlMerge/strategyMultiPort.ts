import yaml from 'js-yaml';
import { ClashProxy, ClashListener, ProxyAreaInfo } from '@/types/clash.types';
import type { YamlObject, YamlValue } from '@/modules/yamlMerge/utils/yamlTypes';
import { StrategyUtils } from '@/modules/yamlMerge/utils/strategyUtils';
import { UserConfig } from '@/types/openapi-schemas';
import { PreMergeInfo } from './clash-merge.types';

export class StrategyMultiPort {
	constructor(private preMergeInfo: PreMergeInfo, private userConfig: UserConfig) { }

	createListeners(proxyList: ClashProxy[]): ClashListener[] {
		const startPort = 42000;
		const listeners: ClashListener[] = [];

		const areaMap = new Map<ProxyAreaInfo, ClashProxy[]>();
		for (const proxy of proxyList) {
			const matchArea = StrategyUtils.getProxyArea(proxy.name);
			if (!matchArea) {
				continue;
			}
			if (areaMap.has(matchArea)) {
				areaMap.get(matchArea)?.push(proxy);
			} else {
				areaMap.set(matchArea, [proxy]);
			}
		}
		Array.from(areaMap.entries()).forEach(([proxyArea, proxyList]) => {
			if (this.userConfig.multiPortMode && !this.userConfig.multiPortMode.includes(proxyArea.code)) {
				return;
			}

			let tPort = startPort + proxyArea.startPort;
			proxyList.forEach((proxy) => {
				listeners.push({
					name: 'mixed-' + tPort,
					type: 'mixed',
					port: tPort,
					proxy: proxy.name,
				});
				tPort++;
			});
		});
		return listeners;
	}

	generate(): YamlObject {
		const loaded = yaml.load(this.preMergeInfo.ruleContent);
		const yamlObj: YamlObject = (loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : {}) as YamlObject;

		delete yamlObj['proxy-providers'];

		const proxyList = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
		});

		if (!Array.isArray(yamlObj['proxies'])) {
			yamlObj['proxies'] = [] as YamlValue[];
		}
		(yamlObj['proxies'] as unknown as ClashProxy[]).push(...proxyList);

		const listeners = this.createListeners(proxyList);
		yamlObj['listeners'] = listeners as unknown as YamlValue;

		return yamlObj;
	}
}

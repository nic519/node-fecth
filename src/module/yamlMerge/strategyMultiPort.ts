import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashListener, ClashProxy, ProxyAreaInfo } from '@/types/clash.types';
import { AreaCode } from '@/types/user.types';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';

export class StrategyMultiPort {
	constructor(private ruleContent: string, private clashContent: string, private areaCodeList: AreaCode[]) {}

	/// 创建listeners
	createListeners(proxyList: ClashProxy[]): ClashListener[] {
		var startPort = 42000;
		const listeners: ClashListener[] = [];

		// 根据国家地区来分组，且需要固定顺序
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
			if (this.areaCodeList.length > 0 && !this.areaCodeList.includes(proxyArea.code)) {
				return;
			}

			// 不同的国家地区，安排一个新的端口起点
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

	/// 取出所有proxy-provider
	generate(): string {
		// 1.删除proxy-providers
		const yamlObj = yamlParse(this.ruleContent);
		delete yamlObj['proxy-providers'];

		// 2.添加proxy
		const proxyList = StrategyUtils.getProxyList(this.clashContent);
		if (yamlObj['proxies']) {
			yamlObj['proxies'].push(...proxyList);
		} else {
			yamlObj['proxies'] = proxyList;
		}

		// 3.添加listeners
		const listeners = this.createListeners(proxyList);
		yamlObj['listeners'] = listeners;

		return yamlStringify(yamlObj);
	}
}

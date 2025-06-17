import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashListener, ClashProxy, ProxyArea, ProxyAreaInfo } from '@/types/clashTypes';
import { AreaCode } from '@/types/userTypes';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';

export class StrategyMultiPort {
	constructor(private ruleContent: string, private clashContent: string, private areaCodeList: AreaCode[]) {}

	/// 取出所有proxy
	private getProxyList(): ClashProxy[] {
		const yamlObj = yamlParse(this.clashContent);
		return yamlObj['proxies'].map((proxy: any) => proxy as ClashProxy);
	}

	/// 创建listeners
	createListeners(proxyList: ClashProxy[]): ClashListener[] {
		var startPort = 42000;
		const listeners: ClashListener[] = [];

		// 根据国家地区来分组，且需要固定顺序
		const areaMap = new Map<ProxyAreaInfo, ClashProxy[]>();
		for (const proxy of proxyList) {
			const matchArea = StrategyUtils.getProxyArea(proxy.name);
			if (areaMap.has(matchArea)) {
				areaMap.get(matchArea)?.push(proxy);
			} else {
				areaMap.set(matchArea, [proxy]);
			}
		}
		Array.from(areaMap.entries()).forEach(([proxyArea, proxyList]) => {
			// 类型保护，确保 areaCodeList 存在且为数组，proxyArea.code 存在
			if (this.areaCodeList[0] !== 'ALL') {
				if (proxyArea === ProxyArea.Unknown || !this.areaCodeList.includes(proxyArea.code)) {
					return;
				}
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
		const proxyList = this.getProxyList();
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

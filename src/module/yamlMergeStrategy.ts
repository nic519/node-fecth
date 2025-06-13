import { ClashListener, ClashProxy, ProxyArea, ProxyAreaInfo } from '@/types/clashTypes';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export class YamlMergeStrategy {
	constructor(private ruleContent: string) {}

	generate(subUrl: string): string {
		const yamlObj = yamlParse(this.ruleContent);
		if (yamlObj['proxy-providers'] && yamlObj['proxy-providers']['Airport1']) {
			yamlObj['proxy-providers']['Airport1'].url = subUrl;
		}
		return yamlStringify(yamlObj);
	}
}

export class YamlMultiPortStrategy {
	constructor(private ruleContent: string, private clashContent: string) {}

	/// 取出所有proxy
	private getProxyList(): ClashProxy[] {
		const yamlObj = yamlParse(this.clashContent);
		return yamlObj['proxies'].map((proxy: any) => proxy as ClashProxy);
	}

	private getProxyArea(proxyName: string): ProxyAreaInfo {
		const proxyMatchKey = Object.values(ProxyArea).find((area) => new RegExp(area.regex, 'i').test(proxyName)) ?? ProxyArea.Unknown;
		return proxyMatchKey as ProxyAreaInfo;
	}

	/// 创建listeners
	private createListeners(proxyList: ClashProxy[]): ClashListener[] {
		var startPort = 42000;
		const listeners: ClashListener[] = [];

		// 根据国家地区来分组，且需要固定顺序
		const areaMap = new Map<ProxyAreaInfo, ClashProxy[]>();
		for (const proxy of proxyList) {
			const matchArea = this.getProxyArea(proxy.name);
			if (areaMap.has(matchArea)) {
				areaMap.get(matchArea)?.push(proxy);
			} else {
				areaMap.set(matchArea, [proxy]);
			}
		}
		console.log(areaMap);
		Array.from(areaMap.entries()).forEach(([proxyArea, proxyList]) => {
			if (proxyArea === ProxyArea.Unknown) {
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

import { ClashListener, ClashProxy } from '@/types/clashTypes';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import fs from 'fs';

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

	/// 创建listeners
	private createListeners(proxyList: ClashProxy[]): ClashListener[] {
		var startPort = 42000;
		const listeners: ClashListener[] = [];
		// 1. 先收集所有的proxy name, 如果都是同一个国家地区的，就分一个组
		// 2. 需要根据分组，去决定port的分配，如新加坡的就从startPort+0开始，另一个地方，就从startPort+100开始
		const areaMap = new Map<string, ClashProxy[]>();
		for (const proxy of proxyList) {
			const proxyMatchKey = proxy.name.substring(0, 3);
			if (areaMap.has(proxyMatchKey)) {
				areaMap.get(proxyMatchKey)?.push(proxy);
			} else {
				areaMap.set(proxyMatchKey, [proxy]);
			}
		}
		// 3. 根据分组，去决定port的分配
		for (const [proxyName, proxyList] of areaMap) {
			listeners.push({
				name: 'mixed-' + startPort,
				type: 'mixed',
				port: startPort++,
				proxy: proxyList.map((proxy) => proxy.name).join(','),
			});
		}
		return listeners;
	}

	/// 取出所有proxy-provider
	generate(): string {
		// 1.删除proxy-providers
		const yamlObj = yamlParse(this.ruleContent);
		delete yamlObj['proxy-providers'];

		// 2.添加proxy
		const proxyList = this.getProxyList();
		yamlObj['proxies'] = proxyList;

		// 3.添加listeners
		const listeners = this.createListeners(proxyList);
		yamlObj['listeners'] = listeners;

		return yamlStringify(yamlObj);
	}
}

// 测试
// 读取本地文件
const ruleContent = fs.readFileSync('/Users/nicholas/Desktop/program_private/passwall_rule/miho-cfg.yaml', 'utf8');
const clashContent = fs.readFileSync('/Users/nicholas/Desktop/RenzheCloud_Clash.yaml', 'utf8');
const yamlMultiPortStrategy = new YamlMultiPortStrategy(ruleContent, clashContent);
const result = yamlMultiPortStrategy.generate();
console.log(result);

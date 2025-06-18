import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashProxy } from '@/types/clashTypes';
import { AreaCode, DBUser } from '@/types/userTypes';
import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';
import { StrategyMultiPort } from './strategyMultiPort';

export class StrategyMultiSub {
	constructor(private userConfig: DBUser, private mainClashContent: string) {}

	/// 取出所有proxy
	private async getProxyList(): Promise<ClashProxy[]> {
		// 获取主订阅的clash内容
		const mainProxyList: ClashProxy[] = StrategyUtils.getProxyList(this.mainClashContent);

		// 获取追加订阅的clash内容
		const appendSubList = this.userConfig.appendSubList;
		if (appendSubList) {
			for (const sub of appendSubList) {
				const { subInfo, content: clashContent } = await TrafficUtils.fetchClashContent(sub.subscribe);
				// 要加一条无用的但是说明订阅剩余流量信息的proxy
				mainProxyList.push({
					name: `${StrategyUtils.formatSubInfo(subInfo)}-${sub.flag}`,
					server: 'www.baidu.com',
					port: 443,
					password: '123456',
					udp: true,
					cipher: 'aes-256-cfb',
					obfs: 'http_simple',
					'obfs-param': '',
					protocol: 'origin',
					'protocol-param': '',
					type: 'ssr',
				});
				const appendProxyList = StrategyUtils.getProxyList(clashContent, sub.flag, sub.include, sub.excludeKeywords);
				mainProxyList.push(...appendProxyList);
			}
		}
		return mainProxyList;
	}

	/// 取出所有proxy-provider
	async generate(): Promise<string> {
		// 1.删除proxy-providers
		const ruleContent = await TrafficUtils.fetchRawContent(this.userConfig.ruleUrl);
		const yamlObj = yamlParse(ruleContent);
		delete yamlObj['proxy-providers'];

		// 2.添加proxy
		const proxyList = await this.getProxyList();
		if (yamlObj['proxies']) {
			yamlObj['proxies'].push(...proxyList);
		} else {
			yamlObj['proxies'] = proxyList;
		}

		// 3. 检查是否支持多出口模式
		if (this.userConfig.multiPortMode) {
			const strategyMultiPort = new StrategyMultiPort(ruleContent, yamlStringify(yamlObj), this.userConfig.multiPortMode);
			yamlObj['listeners'] = strategyMultiPort.createListeners(yamlObj['proxies']);
		}

		return yamlStringify(yamlObj);
	}
}

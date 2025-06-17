import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashProxy } from '@/types/clashTypes';
import { AreaCode, DBUser } from '@/types/userTypes';
import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';
import { StrategyMultiPort } from './strategyMultiPort';

export class StrategyMultiSub {
	constructor(private userConfig: DBUser, private mainClashContent: string) {}

	/// 根据clashContent提取proxyList
	private getProxyListFromClashContent(clashContent: string, flag?: string, include?: AreaCode[]): ClashProxy[] {
		const yamlObj = yamlParse(clashContent);
		return yamlObj['proxies']
			.filter((proxy: ClashProxy) => {
				if (include) {
					const proxyArea = StrategyUtils.getProxyArea(proxy.name);
					return include.includes(proxyArea.code);
				}
				return true;
			})
			.map((proxy: ClashProxy) => {
				if (flag) {
					proxy.name = `${proxy.name}-${flag}`;
				}
				return proxy;
			});
	}

	/// 取出所有proxy
	private async getProxyList(): Promise<ClashProxy[]> {
		// 获取主订阅的clash内容
		const mainProxyList = this.getProxyListFromClashContent(this.mainClashContent);

		// 获取追加订阅的clash内容
		const appendSubList = this.userConfig.appendSubList;
		if (appendSubList) {
			for (const sub of appendSubList) {
				const { subInfo, content: clashContent } = await TrafficUtils.fetchClashContent(sub.subscribe);
				// 要加一条无用的但是说明订阅剩余流量信息的proxy
				// mainProxyList.push({
				// 	name: `${subInfo}-${sub.flag}`
				// });
				const appendProxyList = this.getProxyListFromClashContent(clashContent, sub.flag, sub.include);
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

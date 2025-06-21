import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ClashProxy } from '@/types/clash.types';
import { TrafficUtils } from '@/utils/trafficUtils';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';
import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { PreMergeInfo } from './clash-merge.types';

export class StrategyMultiSub {
	constructor( private preMergeInfo: PreMergeInfo, private userConfig: InnerUser) {}

	/// 取出所有proxy
	private async getProxyList(): Promise<ClashProxy[]> {
		// 获取主订阅的clash内容
		const mainProxyList: ClashProxy[] = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
			excludeRegex: this.userConfig.excludeRegex,
		});

		// 获取追加订阅的clash内容
		const appendSubList = this.userConfig.appendSubList;
		if (appendSubList) {
			for (const sub of appendSubList) {
				const trafficUtils = new TrafficUtils(sub.subscribe);
				const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();
				// 要加一条无用的但是说明订阅剩余流量信息的proxy
				mainProxyList.push({
					name: `${StrategyUtils.formatSubInfo(subInfo)}-${sub.flag}`,
					server: 'www.baidu.com',
					port: 1443,
					type: 'http',
				});
				const appendProxyList = StrategyUtils.getProxyList({
					clashContent,
					flag: sub.flag,
					includeArea: sub.includeArea,
					excludeRegex: this.userConfig.excludeRegex,
				});
				mainProxyList.push(...appendProxyList);
			}
		}
		return mainProxyList;
	}

	/// 取出所有proxy-provider
	async generate(): Promise<string> {
		// 1.删除proxy-providers 
		const yamlObj = yamlParse(this.preMergeInfo.ruleContent);
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
			const strategyMultiPort = new StrategyMultiPort(this.preMergeInfo, this.userConfig);
			yamlObj['listeners'] = strategyMultiPort.createListeners(yamlObj['proxies']);
		}

		return yamlStringify(yamlObj);
	}
}

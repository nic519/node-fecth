import { InnerUser } from '@/module/userManager/innerUserConfig';
import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';
import { StrategyUtils } from '@/module/yamlMerge/utils/strategyUtils';
import { ClashProxy } from '@/types/clash.types';
import { ProxyFetch } from '@/utils/request/proxy-fetch';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { PreMergeInfo } from './clash-merge.types';

export class StrategyMultiSub {
	constructor(private preMergeInfo: PreMergeInfo, private userConfig: InnerUser) {}

	/// 取出所有proxy
	private async getProxyList(): Promise<ClashProxy[]> {
		// 获取主订阅的clash内容
		const mainProxyList: ClashProxy[] = StrategyUtils.getProxyList({
			clashContent: this.preMergeInfo.clashContent,
			excludeRegex: this.userConfig.excludeRegex,
		});
		console.log(`✅ 成功处理主订阅，总计获得 ${mainProxyList.length} 个代理`);

		// 获取追加订阅的clash内容
		const appendSubList = this.userConfig.appendSubList;
		if (appendSubList && appendSubList.length > 0) {
			console.log(`📡 开始处理 ${appendSubList.length} 个追加订阅`);

			// 限制并发请求数量，避免资源过载
			const MAX_CONCURRENT = 3;
			const results: Array<{ proxyList: ClashProxy[]; subInfo: string; flag: string }> = [];

			for (let i = 0; i < appendSubList.length; i += MAX_CONCURRENT) {
				const batch = appendSubList.slice(i, i + MAX_CONCURRENT);

				const batchPromises = batch.map(async (sub) => {
					try {
						const trafficUtils = new ProxyFetch(sub.subscribe);
						const { subInfo, content: clashContent } = await trafficUtils.fetchClashContent();

						const appendProxyList = StrategyUtils.getProxyList({
							clashContent,
							flag: sub.flag,
							includeArea: sub.includeArea,
							excludeRegex: this.userConfig.excludeRegex,
						});
						console.log(`✅ 成功处理追加订阅 ${sub.flag}，总计获得 ${appendProxyList.length} 个代理`);
						if (appendProxyList.length === 0) {
							console.log(
								`❌ 追加订阅 ${sub.flag} 没有获取到代理, clashContent=${clashContent.length}, subInfo=${subInfo}, ${clashContent.substring(
									0,
									500
								)}`
							);
						}
						return { proxyList: appendProxyList, subInfo, flag: sub.flag };
					} catch (error) {
						console.error(`❌ 获取追加订阅 ${sub.flag} 失败:`, error);
						return { proxyList: [], subInfo: '', flag: sub.flag };
					}
				});

				const batchResults = await Promise.all(batchPromises);
				results.push(...batchResults);

				// 在批次之间短暂延迟，减少资源压力
				if (i + MAX_CONCURRENT < appendSubList.length) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			// 添加流量信息和代理列表
			for (const { proxyList, subInfo, flag } of results) {
				// 添加流量信息proxy
				if (subInfo) {
					mainProxyList.push({
						name: `${flag}-${StrategyUtils.formatSubInfo(subInfo)}`,
						server: 'www.baidu.com',
						port: 1443,
						type: 'http',
					});
				}
				mainProxyList.push(...proxyList);
			}

			console.log(`✅ 成功处理追加订阅，总计获得 ${mainProxyList.length} 个代理`);
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

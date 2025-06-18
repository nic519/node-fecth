import { ClashProxy, ProxyAreaInfo, SubInfo } from '@/types/clash.types';
import { AreaCode } from '@/types/user.types';
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';
import { ProxyAreaObjects } from '@/config/proxy-area.config';

export class StrategyUtils {
	/// 根据代理名称，获取代理所属的地区信息
	static getProxyArea(proxyName: string): ProxyAreaInfo | null {
		const proxyMatchKey = ProxyAreaObjects.find((area) => new RegExp(area.regex, 'i').test(proxyName));
		return proxyMatchKey ?? null;
	}

	/// 根据clash的订阅情况信息格式，调整成可视的信息
	static formatSubInfo(subInfo: string): string {
		const subInfoObj = Object.fromEntries(
			subInfo.split(';').map((pair) => {
				const [key, value] = pair.trim().split('=');
				return [key, Number(value)];
			})
		);
		const percent = ((subInfoObj.upload + subInfoObj.download) / subInfoObj.total) * 100;
		const percentStr = percent.toFixed(1) + '%';
		let expireStr = '';
		if (subInfoObj.expire && !isNaN(subInfoObj.expire)) {
			const date = new Date(subInfoObj.expire * 1000);
			expireStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
		} else {
			expireStr = '未知';
		}
		var powerEmoji = percent < 70 ? '🔋' : '🪫';
		return `A${powerEmoji}消耗${percentStr}, 到期${expireStr}`;
	}

	/// 根据clashContent提取proxyList
	static getProxyList(clashContent: string, flag?: string, include?: AreaCode[], excludeKeyWords?: string[]): ClashProxy[] {
		const yamlObj = yamlParse(clashContent);
		return yamlObj['proxies']
			.filter((proxy: ClashProxy) => {
				// 检查排除关键词
				if (excludeKeyWords && excludeKeyWords.some((keyword) => proxy.name.includes(keyword))) {
					return false;
				}
				// 检查地区包含
				if (include) {
					const proxyArea = StrategyUtils.getProxyArea(proxy.name);
					return proxyArea && include.includes(proxyArea.code);
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
}

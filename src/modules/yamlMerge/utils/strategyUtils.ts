import { ProxyAreaObjects } from '@/config/proxy-area.config';
import { ClashProxy, ProxyAreaInfo } from '@/types/clash.types';
import { AreaCode } from '@/types/openapi-schemas';
import { parse as yamlParse } from 'yaml';

export class StrategyUtils {
	static getProxyArea(proxyName: string): ProxyAreaInfo | null {
		const proxyMatchKey = ProxyAreaObjects.find((area) => new RegExp(area.regex, 'i').test(proxyName));
		return proxyMatchKey ?? null;
	}

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
		const powerEmoji = percent < 70 ? '🔋' : '🪫';
		return `A${powerEmoji}消耗${percentStr}, 到期${expireStr}`;
	}

	static getProxyList(options: {
		clashContent: string;
		flag?: string;
		includeArea?: AreaCode[];
	}): ClashProxy[] {
		const { clashContent, flag, includeArea } = options;

		const yamlObj = yamlParse(clashContent);
		return yamlObj['proxies']
			.filter((proxy: ClashProxy) => {
				if (includeArea && includeArea.length > 0) {
					const proxyArea = StrategyUtils.getProxyArea(proxy.name);
					return proxyArea && includeArea.includes(proxyArea.code);
				}
				return true;
			})
			.map((proxy: ClashProxy) => {
				if (flag) {
					proxy.name = `${flag}-${proxy.name}`;
				}
				return proxy;
			});
	}
}

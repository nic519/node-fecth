import { ProxyArea, ProxyAreaInfo, SubInfo } from '@/types/clashTypes';

export class StrategyUtils {
	static getProxyArea(proxyName: string): ProxyAreaInfo {
		const proxyMatchKey = Object.values(ProxyArea).find((area) => new RegExp(area.regex, 'i').test(proxyName)) ?? ProxyArea.Unknown;
		return proxyMatchKey as ProxyAreaInfo;
	}

	static formatSubInfo(subInfo: string): string {
		const subInfoObj = Object.fromEntries(
			subInfo.split(';').map((pair) => {
				const [key, value] = pair.trim().split('=');
				return [key, Number(value)];
			})
		);
		const percent = (((subInfoObj.upload + subInfoObj.download) / subInfoObj.total) * 100).toFixed(1);
		let expireStr = '';
		if (subInfoObj.expire && !isNaN(subInfoObj.expire)) {
			const date = new Date(subInfoObj.expire * 1000);
			expireStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
		} else {
			expireStr = '未知';
		}
		return `[消耗]${percent}% [过期]${expireStr}`;
	}
}

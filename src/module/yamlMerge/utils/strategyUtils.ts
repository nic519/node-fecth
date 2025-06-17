import { ProxyArea, ProxyAreaInfo } from '@/types/clashTypes';

export class StrategyUtils {
	static getProxyArea(proxyName: string): ProxyAreaInfo {
		const proxyMatchKey = Object.values(ProxyArea).find((area) => new RegExp(area.regex, 'i').test(proxyName)) ?? ProxyArea.Unknown;
		return proxyMatchKey as ProxyAreaInfo;
	}
}

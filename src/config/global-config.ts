import { DEFAULT_RULE_URL } from "./constants";

export interface GlobalConfigType {
	isDev: boolean;
	workerUrl: string;
	ruleUrl: string;
	env?: Env;
}

export const GlobalConfig: GlobalConfigType = {
	isDev: false,
	workerUrl: 'https://node.1024.hair',
	ruleUrl: DEFAULT_RULE_URL,
};

export const ProxyConfig = {
	/**
	 * 需要走代理的目标域名列表
	 */
	targetDomains: [
		'liangxin.xyz'
	],

	/**
	 * 代理服务 API 地址
	 * 使用 Vercel 部署的代理服务绕过 Cloudflare 限制
	 */
	proxyApiUrl: 'https://transfer-bice-rho.vercel.app/api/proxy'
};


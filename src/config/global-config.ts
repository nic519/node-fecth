
export interface GlobalConfigType {
	workerUrl: string;
	env?: Env;
}

export const GlobalConfig: GlobalConfigType = {
	workerUrl: 'https://node.1024.hair',
};

export const ProxyConfig = {
	/**
	 * 需要走代理的目标域名列表
	 */
	targetDomains: [
		'liangxin.xyz',
		'1ytsub.com'
	],

	/**
	 * 代理服务 API 地址
	 * 使用 Vercel 部署的代理服务绕过 Cloudflare 限制
	 */
	proxyApiUrl: 'https://transfer-v.vercel.app/api/proxy'
};


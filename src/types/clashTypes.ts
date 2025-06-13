export interface ClashProxy {
	name: string;
	type: string;
	server: string;
	port: number;
	password: string;
	udp: boolean;
	sni?: string;
	'skip-cert-verify'?: boolean;
}

export interface ClashListener {
	name: string;
	type: string;
	port: number;
	proxy: string;
}

export interface ProxyAreaInfo {
	name: string;
	regex: string; // 正则匹配条件
	startPort: number; // 端口相对起点
}

export const ProxyArea: Record<string, ProxyAreaInfo> = {
	TW: {
		name: 'TW',
		regex: 'TW|台湾',
		startPort: 0,
	},
	SG: {
		name: 'SG',
		regex: 'SG|新加坡',
		startPort: 100,
	},
	JP: {
		name: 'JP',
		regex: 'JP|日本',
		startPort: 200,
	},
	HK: {
		name: 'HK',
		regex: 'HK|香港',
		startPort: 300,
	},
	KR: {
		name: 'KR',
		regex: 'KR|韩国',
		startPort: 400,
	},
	Unknown: {
		name: 'Unknown',
		regex: 'Unknown',
		startPort: 900,
	},
} as const;

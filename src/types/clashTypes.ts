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
	// 显示名称
	name: string;
	// 正则匹配条件
	regex: string; 
	// 端口相对起点，作用：把地区的端口范围固定
	startPort: number;
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
	Unknown: {
		name: 'Unknown',
		regex: 'Unknown',
		startPort: 900,
	},
} as const;

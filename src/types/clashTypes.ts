import { AreaCode } from './userTypes';

export interface ClashProxy {
	name: string;
	type: string;
	server: string;
	port: number;
	password: string;
	cipher: string;
	udp: boolean;
	obfs: string;
	'obfs-param': string;
	protocol: string;
	'protocol-param': string;
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
	code: AreaCode;
	// 正则匹配条件
	regex: string;
	// 端口相对起点，作用：把地区的端口范围固定
	startPort: number;
}

export const ProxyArea: Partial<Record<AreaCode, ProxyAreaInfo>> = {
	TW: {
		code: 'TW',
		regex: 'TW|台湾',
		startPort: 0,
	},
	SG: {
		code: 'SG',
		regex: 'SG|新加坡',
		startPort: 100,
	},
	JP: {
		code: 'JP',
		regex: 'JP|日本',
		startPort: 200,
	},
	VN: {
		code: 'VN',
		regex: 'VN|越南',
		startPort: 700,
	},
	HK: {
		code: 'HK',
		regex: 'HK|香港',
		startPort: 300,
	},
	US: {
		code: 'US',
		regex: 'US|美国',
		startPort: 800,
	},
	Unknown: {
		code: 'Unknown',
		regex: 'Unknown',
		startPort: 900,
	},
} as const;

export interface SubInfo {
	upload: number;
	download: number;
	total: number;
	expire: number;
}

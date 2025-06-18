import { AreaCode } from '@/types/user.types';

export interface ClashYaml {
	proxies: ClashProxy[];
	listeners?: ClashListener[];
}

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

export interface SubInfo {
	upload: number;
	download: number;
	total: number;
	expire: number;
}

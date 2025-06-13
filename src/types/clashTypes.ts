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

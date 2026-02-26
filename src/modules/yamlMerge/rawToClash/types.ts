export interface BaseProxy {
    name: string;
    server: string;
    port: number;
    type: string;
    udp?: boolean;
}

export interface SSRProxy extends BaseProxy {
    type: 'ssr';
    cipher: string;
    password: string;
    protocol: string;
    obfs: string;
    'protocol-param'?: string;
    'obfs-param'?: string;
}

export interface TrojanProxy extends BaseProxy {
    type: 'trojan';
    password: string;
    'skip-cert-verify'?: boolean;
    sni?: string;
    alpn?: string[];
}

export interface VmessProxy extends BaseProxy {
    type: 'vmess';
    uuid: string;
    alterId: number;
    cipher: string;
    tls?: boolean;
    'skip-cert-verify'?: boolean;
    servername?: string;
    network?: string;
    'ws-opts'?: {
        path: string;
        headers?: {
            Host: string;
        };
    };
}

export type ClashProxy = SSRProxy | TrojanProxy | VmessProxy;

export interface ClashConfig {
    proxies: ClashProxy[];
}

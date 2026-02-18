export interface ClashProxy {
    name: string;
    server: string;
    port: number;
    type: string;
    cipher: string;
    password: string;
    protocol: string;
    obfs: string;
    'protocol-param'?: string;
    'obfs-param'?: string;
    udp?: boolean;
}

export interface ClashConfig {
    proxies: ClashProxy[];
}

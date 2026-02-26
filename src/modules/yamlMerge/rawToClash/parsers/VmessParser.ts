import { Base64Helper } from '../Base64Helper';
import { ClashProxy } from '../types';
import { IProtocolParser } from './IProtocolParser';

interface VmessJson {
    v: string;
    ps: string;
    add: string;
    port: string | number;
    id: string;
    aid: string | number;
    scy: string;
    net: string;
    type: string;
    host: string;
    path: string;
    tls: string;
    sni: string;
}

export class VmessParser implements IProtocolParser {
    checkPresence(decodedContent: string): boolean {
        return decodedContent.includes('vmess://');
    }

    canParseLine(line: string): boolean {
        return line.startsWith('vmess://');
    }

    parseLine(line: string): ClashProxy | null {
        if (!this.canParseLine(line)) {
            return null;
        }

        try {
            const base64Content = line.substring(8); // Remove vmess://
            const jsonStr = Base64Helper.safeDecode(base64Content);
            const config = JSON.parse(jsonStr) as VmessJson;

            const proxy: ClashProxy = {
                name: config.ps || 'Unknown',
                type: 'vmess',
                server: config.add,
                port: Number(config.port),
                uuid: config.id,
                alterId: Number(config.aid || 0),
                cipher: config.scy || 'auto',
                udp: true,
                tls: config.tls === 'tls',
                network: config.net,
                servername: config.sni || config.host,
                'skip-cert-verify': true // Default to true for better compatibility
            };

            if (config.net === 'ws') {
                proxy['ws-opts'] = {
                    path: config.path || '/',
                    headers: config.host ? { Host: config.host } : undefined
                };
            }

            return proxy;
        } catch (error) {
            console.warn('Error parsing vmess link:', error);
            return null;
        }
    }
}

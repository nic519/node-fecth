import { Base64Helper } from '../Base64Helper';
import { ClashProxy } from '../types';
import { IProtocolParser } from './IProtocolParser';

export class SSRParser implements IProtocolParser {
    checkPresence(decodedContent: string): boolean {
        return decodedContent.includes('ssr://');
    }

    canParseLine(line: string): boolean {
        return line.startsWith('ssr://');
    }

    parseLine(line: string): ClashProxy | null {
        if (!this.canParseLine(line)) {
            return null;
        }

        try {
            const base64Config = line.substring(6); // Remove ssr://
            const configStr = Base64Helper.safeDecode(base64Config);

            // Parse config
            // Format: host:port:protocol:method:obfs:password_base64/?params

            const parts = configStr.split('/?');
            const mainPart = parts[0];
            const paramsPart = parts.length > 1 ? parts[1] : '';

            const mainFields = mainPart.split(':');
            if (mainFields.length < 6) {
                console.warn('Skipping invalid config (not enough fields):', configStr);
                return null;
            }

            const server = mainFields[0];
            const port = parseInt(mainFields[1], 10);
            const protocol = mainFields[2];
            const method = mainFields[3];
            const obfs = mainFields[4];
            const passwordBase64 = mainFields[5];
            const password = Base64Helper.safeDecode(passwordBase64);

            // Parse params
            const params = new URLSearchParams(paramsPart);
            const obfsParamBase64 = params.get('obfsparam');
            const protoParamBase64 = params.get('protoparam');
            const remarksBase64 = params.get('remarks');
            // const groupBase64 = params.get('group');

            const obfsParam = obfsParamBase64 ? Base64Helper.safeDecode(obfsParamBase64) : undefined;
            const protoParam = protoParamBase64 ? Base64Helper.safeDecode(protoParamBase64) : undefined;
            const name = remarksBase64 ? Base64Helper.safeDecode(remarksBase64) : 'Unknown';

            const proxy: ClashProxy = {
                name: name,
                server: server,
                port: port,
                type: 'ssr',
                cipher: method,
                password: password,
                protocol: protocol,
                obfs: obfs,
                'protocol-param': protoParam,
                'obfs-param': obfsParam,
                udp: true
            };

            return proxy;
        } catch (error) {
            console.error('Error parsing SSR link:', error);
            return null;
        }
    }
}

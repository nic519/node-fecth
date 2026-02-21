import * as yaml from 'js-yaml';
import { Base64Helper } from './Base64Helper';
import { ClashProxy, ClashConfig } from './types';

export class SSRToClashConverter {
    static isSSR(content: string): boolean {
        try {
            // Remove whitespace to get the clean base64 string
            const base64Content = content.replace(/\s/g, '');

            // Attempt to decode
            const decodedBody = Base64Helper.safeDecode(base64Content);

            // Check if it contains ssr:// links
            return decodedBody.includes('ssr://');
        } catch {
            return false;
        }
    }

    static convert(fileContent: string): string {
        // Remove whitespace to get the clean base64 string
        const base64Content = fileContent.replace(/\s/g, '');

        // Decode the main body
        const decodedBody = Base64Helper.safeDecode(base64Content);

        // Split into lines (SSR links)
        const lines = decodedBody.split('\n').filter(line => line.trim() !== '');

        const proxies: ClashProxy[] = [];

        for (const line of lines) {
            if (!line.startsWith('ssr://')) {
                console.warn('Skipping invalid line (not ssr://):', line.substring(0, 20) + '...');
                continue;
            }

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
                continue;
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

            proxies.push(proxy);
        }

        const clashConfig: ClashConfig = {
            proxies: proxies
        };

        const yamlStr = yaml.dump(clashConfig, {
            lineWidth: -1, // Disable line wrapping
            noRefs: true
        });

        return yamlStr;
    }
}

import { ClashProxy } from '../types';
import { IProtocolParser } from './IProtocolParser';

export class TrojanParser implements IProtocolParser {
    checkPresence(decodedContent: string): boolean {
        return decodedContent.includes('trojan://');
    }

    canParseLine(line: string): boolean {
        return line.startsWith('trojan://');
    }

    parseLine(line: string): ClashProxy | null {
        if (!this.canParseLine(line)) {
            return null;
        }

        try {
            const url = new URL(line.trim());
            const password = url.username;
            const server = url.hostname;
            const port = parseInt(url.port);
            const name = decodeURIComponent(url.hash.substring(1)); // remove #
            const allowInsecure = url.searchParams.get('allowInsecure') === '1';
            // const sni = url.searchParams.get('peer'); // Typical parameter for SNI in trojan links

            const proxy: ClashProxy = {
                name: name || 'Unknown',
                type: 'trojan',
                server: server,
                port: port,
                password: password,
                udp: true,
                'skip-cert-verify': allowInsecure
            };
            return proxy;
        } catch (error) {
            console.warn('Error parsing trojan link:', line, error);
            return null;
        }
    }
}

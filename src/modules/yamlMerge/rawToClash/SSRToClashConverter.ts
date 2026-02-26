import * as yaml from 'js-yaml';
import { Base64Helper } from './Base64Helper';
import { IProtocolParser } from './parsers/IProtocolParser';
import { SSRParser } from './parsers/SSRParser';
import { TrojanParser } from './parsers/TrojanParser';
import { VmessParser } from './parsers/VmessParser';
import { ClashConfig, ClashProxy } from './types';

export class SSRToClashConverter {
    private static parsers: IProtocolParser[] = [
        new SSRParser(),
        new TrojanParser(),
        new VmessParser()
    ];

    static isValidProtocol(content: string): boolean {
        try {
            // Remove whitespace to get the clean base64 string
            const base64Content = content.replace(/\s/g, '');

            // Attempt to decode
            const decodedBody = Base64Helper.safeDecode(base64Content);

            // Check if any parser recognizes the content
            return this.parsers.some(parser => parser.checkPresence(decodedBody));
        } catch {
            return false;
        }
    }

    static convert(fileContent: string): string {
        // Remove whitespace to get the clean base64 string
        const base64Content = fileContent.replace(/\s/g, '');

        // Decode the main body
        const decodedBody = Base64Helper.safeDecode(base64Content);

        // Split into lines
        const lines = decodedBody.split('\n').filter(line => line.trim() !== '');

        const proxies: ClashProxy[] = [];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            let parsed = false;

            for (const parser of this.parsers) {
                if (parser.canParseLine(trimmedLine)) {
                    const proxy = parser.parseLine(trimmedLine);
                    if (proxy) {
                        proxies.push(proxy);
                    }
                    parsed = true;
                    break;
                }
            }

            if (!parsed) {
                console.warn('Skipping invalid line (no matching protocol):', trimmedLine.substring(0, 20) + '...');
            }
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

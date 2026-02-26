import { ClashProxy } from '../types';

export interface IProtocolParser {
    /**
     * Checks if the decoded file content contains this protocol.
     */
    checkPresence(decodedContent: string): boolean;

    /**
     * Checks if a specific line belongs to this protocol.
     */
    canParseLine(line: string): boolean;

    /**
     * Parses a single line into a proxy config.
     */
    parseLine(line: string): ClashProxy | null;
}

import * as fs from 'fs';

export class FileService {
    static readFile(filePath: string): string {
        console.log(`Reading input file: ${filePath}`);
        return fs.readFileSync(filePath, 'utf-8');
    }

    static writeFile(filePath: string, content: string): void {
        console.log(`Writing output to: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

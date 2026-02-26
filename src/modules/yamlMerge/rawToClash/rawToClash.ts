import { FileService } from './FileService';
import { SSRToClashConverter } from './SSRToClashConverter';

// Define paths
const INPUT_FILE = '/Users/nicholas/Downloads/1yunti-ori.txt';
const OUTPUT_FILE = '/Users/nicholas/Downloads/1yunti-clash.yaml';

function convertRawToClash() {
    try {
        const fileContent = FileService.readFile(INPUT_FILE);
        const yamlStr = SSRToClashConverter.convert(fileContent);
        FileService.writeFile(OUTPUT_FILE, yamlStr);
        console.log('Conversion complete.');
    } catch (error) {
        console.error('Error converting raw to clash:', error);
    }
}

// Execute conversion
convertRawToClash();

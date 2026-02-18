import { FileService } from './FileService';
import { SSRToClashConverter } from './SSRToClashConverter';

// Define paths
const INPUT_FILE = '/Users/nicholas/Downloads/renzhe-原始.txt';
const OUTPUT_FILE = '/Users/nicholas/Desktop/my_program/node-fecth/src/modules/yamlMerge/rawToClash/renzhe-clash.yaml';

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

import {writeFile, mkdir} from 'fs/promises'
import {dirname} from 'path'
import { Basic } from './generator/basic.js'
import { ALPHABET } from './constants.js'

const d = new Basic(ALPHABET);

try {
    // Create directory if it doesn't exist
    await mkdir(dirname(d.SCHEMA_FILE), { recursive: true });
    
    await writeFile(d.SCHEMA_FILE, d.produceJson());
    console.log('File saved successfully to:', d.SCHEMA_FILE);
} catch (err) {
    console.error('Error writing file:', err);
}
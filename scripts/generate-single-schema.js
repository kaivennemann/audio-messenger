import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SingleTone } from '../src/conversion/generator/single.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate single-tone schema
// 2000-6000 Hz range - above most low-frequency noise
// One frequency per character = MAXIMUM SPEED!
const symbolCount = ALPHABET.length + 1; // +1 for start symbol

const generator = new SingleTone(ALPHABET, 2000, 6000, symbolCount);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/single.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Single-tone schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 2000-6000 Hz`);
console.log(`🎵 Total symbols: ${symbolCount}`);
console.log(`⚡ Tones per symbol: 1 (FASTEST!)`);
console.log(`🔤 Alphabet size: ${ALPHABET.length} + 1 start marker`);
console.log(`\n🚀 Speed improvement: 2x faster than basic mode!`);
console.log(`\nFrequency distribution (first 10 characters):`);
const parsed = JSON.parse(schemaJson);
ALPHABET.slice(0, 10).forEach((char, idx) => {
  console.log(`  '${char}': ${parsed.frequencyMap[char][0]} Hz`);
});
console.log(`  '~' (start): ${parsed.frequencyMap['~'][0]} Hz`);

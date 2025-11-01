import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { singleConstructor } from '../src/conversion/generator/index.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate single-tone schema (no mixing needed - direct mapping)
const generator = singleConstructor(ALPHABET);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/single.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Single-tone schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 2000-6000 Hz`);
console.log(`🎵 Total symbols: ${ALPHABET.length + 1}`);
console.log(`⚡ Tones per symbol: 1 (FASTEST!)`);
console.log(`🔤 Alphabet size: ${ALPHABET.length} + 1 start marker`);
console.log(`\n🚀 Speed improvement: 2x faster than basic mode!`);
console.log(`\nFirst 10 character mappings:`);
const parsed = JSON.parse(schemaJson);
ALPHABET.slice(0, 10).forEach((char) => {
  console.log(`  '${char}': ${parsed.frequencyMap[char][0]} Hz`);
});
console.log(`  '~' (start): ${parsed.frequencyMap['~'][0]} Hz`);

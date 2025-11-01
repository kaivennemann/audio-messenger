import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { quadConstructor } from '../src/conversion/generator/index.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate quad-tone schema with 4 tones per symbol
const generator = quadConstructor(ALPHABET);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/quad.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Quad-tone schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 1000-5000 Hz`);
console.log(`🎵 Total bands: 20`);
console.log(`🔤 Alphabet size: ${ALPHABET.length + 1} (including start marker)`);
console.log(`\n🎯 Features:`);
console.log(`  • 4 tones per character (maximum information density!)`);
console.log(`  • Better-mixed frequency pairs (improved separation)`);
console.log(`  • Logarithmic spacing for better pitch perception`);
console.log(`  • With 20 bands and 4 tones: 20^4 = 160,000 possible symbols!`);
console.log(`\n⚡ Information density: 2x more tones = 2x more data per time unit`);
console.log(`\nFirst 5 character mappings:`);
const parsed = JSON.parse(schemaJson);
['a', 'b', 'c', 'd', 'e'].forEach(char => {
  console.log(`  '${char}': ${parsed.frequencyMap[char].join(', ')} Hz`);
});

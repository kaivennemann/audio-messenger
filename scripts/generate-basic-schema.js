import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { basicConstructor } from '../src/conversion/generator/index.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate basic schema with better-mixed frequency pairs
const generator = basicConstructor(ALPHABET);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/basic.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Basic schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 400-8000 Hz`);
console.log(`🎵 Total bands: 50`);
console.log(`🔤 Alphabet size: ${ALPHABET.length + 1} (including start marker)`);
console.log(`\n📻 Features:`);
console.log(`  • Better-mixed frequency pairs (improved separation)`);
console.log(`  • Original wide frequency range`);
console.log(`  • Compatible with most audio systems`);
console.log(`\nFirst 5 character mappings:`);
const parsed = JSON.parse(schemaJson);
['a', 'b', 'c', 'd', 'e'].forEach(char => {
  console.log(`  '${char}': ${parsed.frequencyMap[char].join(', ')} Hz`);
});

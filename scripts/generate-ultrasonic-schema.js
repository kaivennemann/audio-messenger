import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ultrasonicConstructor } from '../src/conversion/generator/index.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate ultrasonic schema with better-mixed frequency pairs
const generator = ultrasonicConstructor(ALPHABET);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/ultrasonic.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Ultrasonic schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 8000-17000 Hz (above voice)`);
console.log(`🎵 Total bands: 35`);
console.log(`🔤 Alphabet size: ${ALPHABET.length + 1} (including start marker)`);
console.log(`\n🎤 Benefits:`);
console.log(`  • Better-mixed frequency pairs (less adjacent clustering)`);
console.log(`  • No interference from human conversation`);
console.log(`  • Less environmental noise`);
console.log(`  • Clearer signal in noisy rooms`);
console.log(`\n⚠️  Note: May not be audible to people over 40 years old`);
console.log(`\nFirst 5 character mappings:`);
const parsed = JSON.parse(schemaJson);
['a', 'b', 'c', 'd', 'e'].forEach(char => {
  console.log(`  '${char}': ${parsed.frequencyMap[char].join(', ')} Hz`);
});

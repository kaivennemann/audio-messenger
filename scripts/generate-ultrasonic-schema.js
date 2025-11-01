import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Ultrasonic } from '../src/conversion/generator/ultrasonic.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate ultrasonic schema
// 8000-17000 Hz range is above human speech
// 35 bands provides good resolution for clear transmission
const generator = new Ultrasonic(ALPHABET, 8000, 17000, 35);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/ultrasonic.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Ultrasonic schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 8000-17000 Hz (above voice)`);
console.log(`🎵 Total bands: 35`);
console.log(`🔤 Alphabet size: ${ALPHABET.length + 1} (including start marker)`);
console.log(`\n🎤 Benefits:`);
console.log(`  • No interference from human conversation`);
console.log(`  • Less environmental noise`);
console.log(`  • Clearer signal in noisy rooms`);
console.log(`\n⚠️  Note: May not be audible to people over 40 years old`);
console.log(`\nFrequency distribution (first 10 bands):`);
const parsed = JSON.parse(schemaJson);
parsed.valid_hz.slice(0, 10).forEach((freq, idx) => {
  console.log(`  Band ${idx}: ${freq} Hz`);
});

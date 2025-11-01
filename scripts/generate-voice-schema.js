import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VoiceOptimized } from '../src/conversion/generator/voice.js';
import { ALPHABET } from '../src/conversion/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate voice-optimized schema
// 300-3500 Hz range captures most important speech frequencies
// 40 bands gives us good resolution while staying responsive
const generator = new VoiceOptimized(ALPHABET, 300, 3500, 40);

const schemaJson = generator.produceJson();
const outputPath = join(__dirname, '../src/conversion/schema/voice.json');

writeFileSync(outputPath, schemaJson, 'utf8');

console.log('✅ Voice-optimized schema generated successfully!');
console.log(`📝 Output: ${outputPath}`);
console.log(`📊 Frequency range: 300-3500 Hz`);
console.log(`🎵 Total bands: 40`);
console.log(`🔤 Alphabet size: ${ALPHABET.length + 1} (including start marker)`);
console.log(`\nFrequency distribution (first 10 bands):`);
const parsed = JSON.parse(schemaJson);
parsed.valid_hz.slice(0, 10).forEach((freq, idx) => {
  console.log(`  Band ${idx}: ${freq} Hz`);
});

import { LogSchemaGenerator } from './LogSchemaGenerator.js';

/**
 * Voice-Optimized Schema Generator
 * Focuses on frequencies present in human speech (85Hz - 4000Hz)
 * This range captures:
 * - Fundamental frequencies: 85-255 Hz (male) and 165-255 Hz (female)
 * - First formants (vowel sounds): 200-1200 Hz
 * - Second formants: 600-3000 Hz
 * - Consonants and clarity: 2000-4000 Hz
 */
export function voiceConstructor(alphabet) {
  const b = new LogSchemaGenerator(
    alphabet,
    '../schema/voice.json',
    300,
    3500,
    40
  );

  return b;
}

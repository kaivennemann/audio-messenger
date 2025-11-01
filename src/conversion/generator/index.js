import { LogSchemaGenerator } from './LogSchemaGenerator.js';
import { BasicSchemaGenerator } from './BasicSchemaGenerator.js';

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

/**
 * Ultrasonic Schema Generator
 * Uses frequencies above human speech (8000-18000 Hz)
 * This range is:
 * - Above fundamental voice frequencies (85-255 Hz)
 * - Above most consonants and sibilants (up to 8000 Hz)
 * - Still audible to most people under 40
 * - Minimal interference from background conversation
 * - Higher frequencies = less environmental noise
 */
export function ultrasonicConstructor(alphabet) {
  const b = new BasicSchemaGenerator(
    alphabet,
    '../schema/ultrasonic.json',
    8000,
    17000,
    35
  );

  return b;
}

export function basicConstructor(alphabet) {
  const b = new BasicSchemaGenerator(
    alphabet,
    '../schema/basic.json',
    400,
    8000,
    50
  );

  return b;
}

/**
 * Single-Tone Schema Generator
 * Uses exactly ONE frequency per character for maximum speed
 * Starting at 2000 Hz
 */
export function singleConstructor(alphabet) {
  const b = new BasicSchemaGenerator(
    alphabet,
    '../schema/single.json',
    2000,
    6000,
    alphabet.length + 1
  );

  return b;
}

import { BasicSchemaGenerator } from './BasicSchemaGenerator.js';

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

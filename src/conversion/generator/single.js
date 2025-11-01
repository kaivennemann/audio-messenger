import { BasicSchemaGenerator } from './BasicSchemaGenerator.js';

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

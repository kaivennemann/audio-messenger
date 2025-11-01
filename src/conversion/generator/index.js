import { SchemaGenerator } from './SchemaGenerator.js';

/**
 * Voice-Optimized Schema Generator
 * Focuses on frequencies present in human speech (300Hz - 3500Hz)
 * Uses logarithmic spacing for better pitch perception
 */
export function voiceConstructor(alphabet) {
  return new SchemaGenerator({
    alphabet,
    filePath: '../schema/voice.json',
    minHz: 300,
    maxHz: 3500,
    bands: 40,
    spacingMode: 'logarithmic',
  });
}

/**
 * Ultrasonic Schema Generator
 * Uses frequencies above human speech (8000-17000 Hz)
 * Minimal interference from background conversation
 */
export function ultrasonicConstructor(alphabet) {
  return new SchemaGenerator({
    alphabet,
    filePath: '../schema/ultrasonic.json',
    minHz: 8000,
    maxHz: 17000,
    bands: 35,
    spacingMode: 'linear',
  });
}

/**
 * Basic Schema Generator
 * Original frequency range (400-8000 Hz)
 */
export function basicConstructor(alphabet) {
  return new SchemaGenerator({
    alphabet,
    filePath: '../schema/basic.json',
    minHz: 400,
    maxHz: 8000,
    bands: 50,
    spacingMode: 'linear',
  });
}

/**
 * Single-Tone Schema Generator
 * Uses exactly ONE frequency per character for maximum speed (2x faster)
 */
export function singleConstructor(alphabet) {
  return new SchemaGenerator({
    alphabet,
    filePath: '../schema/single.json',
    minHz: 2000,
    maxHz: 6000,
    spacingMode: 'single',
  });
}

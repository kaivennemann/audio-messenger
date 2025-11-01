import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
export class Ultrasonic {
  START_SYMBOL = '~';

  constructor(alphabet, minHz = 8000, maxHz = 17000, bands = 35) {
    // Validate inputs
    if (!Array.isArray(alphabet) || alphabet.length === 0) {
      throw new Error('Alphabet must be a non-empty array');
    }

    if (minHz >= maxHz) {
      throw new Error('minHz must be less than maxHz');
    }

    if (alphabet.includes(this.START_SYMBOL)) {
      throw new Error('Alphabet contains reserved start symbol');
    }

    // Don't mutate the input - create new array
    this.alphabet = [...alphabet, this.START_SYMBOL];

    this.minHz = minHz;
    this.maxHz = maxHz;
    this.bands = bands;

    // Use path.join for reliable path handling
    this.SCHEMA_FILE = join(__dirname, '../schema/ultrasonic.json');

    // Create valid frequencies with linear spacing (works better at high frequencies)
    this.valid_hz = [];
    const step = (maxHz - minHz) / (bands - 1);

    for (let i = 0; i < bands; i++) {
      this.valid_hz.push(Math.round(minHz + (step * i)));
    }

    // Assign symbols to frequency sequences
    const symbolCount = this.alphabet.length;
    const soundsPerSymbol = Math.ceil(Math.log(symbolCount) / Math.log(bands));

    this.frequencyMap = this.alphabet.reduceRight((ret, cur, index) => {
      ret[cur] = [];

      let v = index;

      for (let i = 0; i < soundsPerSymbol; i++) {
        ret[cur].push(this.valid_hz[v % bands]);

        v = Math.floor(v / bands);
      }

      return ret;
    }, {});
  }

  produceJson() {
    const data = {
      alphabet: this.alphabet,
      valid_hz: this.valid_hz,
      start: this.START_SYMBOL,
      frequencyMap: this.frequencyMap,
      description: 'Ultrasonic schema using high frequencies above speech range',
      range: `${this.minHz}-${this.maxHz} Hz`,
      bands: this.bands,
      notes: 'Minimal interference from human voice. May not be audible to people over 40.',
    };

    return JSON.stringify(data, null, 2);
  }
}

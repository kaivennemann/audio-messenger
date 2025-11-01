import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Single-Tone Schema Generator
 * Uses exactly ONE frequency per character for maximum speed
 * Starting at 2000 Hz
 */
export class SingleTone {
  START_SYMBOL = '~';

  constructor(alphabet, minHz = 2000, maxHz = 6000, bands = 77) {
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

    // We need exactly as many bands as we have symbols
    const symbolCount = this.alphabet.length;

    this.minHz = minHz;
    this.maxHz = maxHz;
    this.bands = symbolCount; // One band per symbol!

    // Use path.join for reliable path handling
    this.SCHEMA_FILE = join(__dirname, '../schema/single.json');

    // Create valid frequencies - one per symbol
    this.valid_hz = [];
    const step = (maxHz - minHz) / (symbolCount - 1);

    for (let i = 0; i < symbolCount; i++) {
      this.valid_hz.push(Math.round(minHz + (step * i)));
    }

    // Assign ONE frequency to each symbol
    this.frequencyMap = this.alphabet.reduce((ret, symbol, index) => {
      ret[symbol] = [this.valid_hz[index]]; // Single frequency!
      return ret;
    }, {});
  }

  produceJson() {
    const data = {
      alphabet: this.alphabet,
      valid_hz: this.valid_hz,
      start: this.START_SYMBOL,
      frequencyMap: this.frequencyMap,
      description: 'Single-tone schema - one frequency per character for maximum speed',
      range: `${this.minHz}-${this.maxHz} Hz`,
      bands: this.bands,
      tonesPerSymbol: 1,
      notes: 'Fastest transmission mode. Starting at 2kHz to avoid low-frequency noise.',
    };

    return JSON.stringify(data, null, 2);
  }
}

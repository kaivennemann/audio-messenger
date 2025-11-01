import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Basic {
  START_SYMBOL = '~';

  constructor(alphabet, minHz = 400, maxHz = 8000, bands = 50) {
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
    this.SCHEMA_FILE = join(__dirname, '../schema/basic.json');

    // Create valid frequencies
    this.valid_hz = [];

    for (let i = 0; i < bands; i++) {
      this.valid_hz.push(
        Math.round(minHz + (maxHz - minHz) * (i / (bands - 1)))
      );
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
    };

    return JSON.stringify(data, null, 2); // Added pretty printing
  }
}

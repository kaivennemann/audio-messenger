import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Unified schema generator that supports multiple frequency spacing modes
 */
export class SchemaGenerator {
  START_SYMBOL = '~';

  constructor(options = {}) {
    const {
      alphabet,
      filePath = '../schema/basic.json',
      minHz = 400,
      maxHz = 8000,
      bands = 50,
      spacingMode = 'linear', // 'linear', 'logarithmic', or 'single'
      tonesPerSymbol = null, // null = auto-calculate, 1 = single tone, 2+ = multi-tone
    } = options;

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
    const symbolCount = this.alphabet.length;

    this.minHz = minHz;
    this.maxHz = maxHz;
    this.bands = bands;
    this.spacingMode = spacingMode;
    this.SCHEMA_FILE = join(__dirname, filePath);

    // Generate valid frequencies based on spacing mode
    if (spacingMode === 'single') {
      // Single-tone mode: one frequency per symbol
      this.valid_hz = this.generateFrequencies(
        minHz,
        maxHz,
        symbolCount,
        'linear'
      );
      this.tonesPerSymbol = 1;
    } else if (spacingMode === 'logarithmic') {
      this.valid_hz = this.generateFrequencies(
        minHz,
        maxHz,
        bands,
        'logarithmic'
      );
      this.tonesPerSymbol =
        tonesPerSymbol || Math.ceil(Math.log(symbolCount) / Math.log(bands));
    } else if (spacingMode === 'random' && tonesPerSymbol) {
      this.frequencyMap = this.alphabet.reduce((map, symbol, index) => {
        map[symbol] = this.generateRandFrequencies(minHz, maxHz, bands);
        return map;
      }, {});
      return;
    } else {
      // Linear spacing (default)
      this.valid_hz = this.generateFrequencies(minHz, maxHz, bands, 'linear');
      this.tonesPerSymbol =
        tonesPerSymbol || Math.ceil(Math.log(symbolCount) / Math.log(bands));
    }

    // Create frequency map
    this.frequencyMap = this.generateFrequencyMap();
  }

  /**
   * Generate frequencies with specified spacing mode
   */
  generateFrequencies(minHz, maxHz, count, mode) {
    const frequencies = [];

    if (mode === 'logarithmic') {
      // Logarithmic spacing - better matches human pitch perception
      const logMin = Math.log(minHz);
      const logMax = Math.log(maxHz);
      const step = (logMax - logMin) / (count - 1);

      for (let i = 0; i < count; i++) {
        const logFreq = logMin + step * i;
        const freq = Math.exp(logFreq);
        frequencies.push(Math.round(freq));
      }
    } else {
      // Linear spacing - evenly distributed
      const step = (maxHz - minHz) / (count - 1);

      for (let i = 0; i < count; i++) {
        frequencies.push(Math.round(minHz + step * i));
      }
    }

    return frequencies;
  }

  generateRandFrequencies(minHz, maxHz, count) {
    const frequencies = [];
    for (let i = 0; i < count; i++) {
      const freq = Math.round(Math.random() * (maxHz - minHz) + minHz);
      frequencies.push(freq);
    }
    return frequencies;
  }

  /**
   * Generate frequency map for all symbols
   */
  generateFrequencyMap() {
    if (this.spacingMode === 'single') {
      // Single-tone mode: direct 1-to-1 mapping
      return this.alphabet.reduce((map, symbol, index) => {
        map[symbol] = [this.valid_hz[index]];
        return map;
      }, {});
    } else {
      // Multi-tone mode: better-mixed encoding
      // Instead of base-N which clusters adjacent symbols,
      // we use a more spread-out mapping
      return this.alphabet.reduceRight((map, symbol, index) => {
        map[symbol] = [];
        let value = index;

        for (let i = 0; i < this.tonesPerSymbol; i++) {
          // Use modulo with prime-like step to spread frequencies
          // This creates better separation between adjacent characters
          const freqIndex = value % this.bands;
          const mixedIndex = (freqIndex * 13 + i * 7) % this.bands; // Mix with primes
          map[symbol].push(this.valid_hz[mixedIndex]);
          value = Math.floor(value / this.bands);
        }

        return map;
      }, {});
    }
  }

  /**
   * Generate JSON schema
   */
  produceJson() {
    const data = {
      alphabet: this.alphabet,
      valid_hz: this.valid_hz,
      start: this.START_SYMBOL,
      frequencyMap: this.frequencyMap,
      bands: this.bands,
      range: `${this.minHz}-${this.maxHz} Hz`,
      spacingMode: this.spacingMode,
      tonesPerSymbol: this.tonesPerSymbol,
    };

    return JSON.stringify(data, null, 2);
  }
}

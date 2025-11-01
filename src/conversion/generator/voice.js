import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Voice-Optimized Schema Generator
 * Focuses on frequencies present in human speech (85Hz - 4000Hz)
 * This range captures:
 * - Fundamental frequencies: 85-255 Hz (male) and 165-255 Hz (female)
 * - First formants (vowel sounds): 200-1200 Hz
 * - Second formants: 600-3000 Hz
 * - Consonants and clarity: 2000-4000 Hz
 */
export class VoiceOptimized {
  START_SYMBOL = '~';

  constructor(alphabet, minHz = 300, maxHz = 3500, bands = 40) {
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
    this.SCHEMA_FILE = join(__dirname, '../schema/voice.json');

    // Create valid frequencies with logarithmic spacing
    // Logarithmic spacing better matches how humans perceive pitch
    this.valid_hz = this.generateLogarithmicFrequencies(minHz, maxHz, bands);

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

  /**
   * Generate logarithmically-spaced frequencies
   * This better matches human pitch perception
   */
  generateLogarithmicFrequencies(minHz, maxHz, count) {
    const frequencies = [];
    const logMin = Math.log(minHz);
    const logMax = Math.log(maxHz);
    const step = (logMax - logMin) / (count - 1);

    for (let i = 0; i < count; i++) {
      const logFreq = logMin + (step * i);
      const freq = Math.exp(logFreq);
      frequencies.push(Math.round(freq));
    }

    return frequencies;
  }

  produceJson() {
    const data = {
      alphabet: this.alphabet,
      valid_hz: this.valid_hz,
      start: this.START_SYMBOL,
      frequencyMap: this.frequencyMap,
      description: 'Voice-optimized schema using logarithmic frequency spacing',
      range: `${this.minHz}-${this.maxHz} Hz`,
      bands: this.bands,
    };

    return JSON.stringify(data, null, 2);
  }
}

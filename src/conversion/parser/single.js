import singleSchema from './../schema/single.json' with { type: 'json' };

/**
 * Single-tone frequency matching
 * Uses one frequency per character for maximum speed
 */

// Configuration for single-tone matching
const SINGLE_CONFIG = {
  // Standard tolerance
  FREQUENCY_TOLERANCE_PERCENT: 0.08,
  // Standard amplitude threshold
  MIN_AMPLITUDE_THRESHOLD: 30,
  // Shorter duration since we have fewer tones
  TONE_DURATION_MS: 120,
  // Minimal gap for speed
  TONE_GAP_MS: 30,
};

/**
 * Convert text to single-tone frequencies
 */
export function convertTextToSingleHz(data) {
  data = '~' + data + '~';
  const arredData = data.split('');
  const result = [];

  for (let char of arredData) {
    if (!singleSchema.frequencyMap[char]) {
      throw new Error(`Cannot use character: ${char}`);
    }

    // Each character = ONE frequency!
    result.push(singleSchema.frequencyMap[char][0]);
  }

  return result;
}

/**
 * Find closest valid single-tone frequency
 */
export function findClosestSingleFrequency(
  detectedHz,
  tolerance = SINGLE_CONFIG.FREQUENCY_TOLERANCE_PERCENT
) {
  let closestHz = null;
  let minDiff = Infinity;

  for (const validHz of singleSchema.valid_hz) {
    const diff = Math.abs(detectedHz - validHz);
    const maxAllowedDiff = validHz * tolerance;

    if (diff <= maxAllowedDiff && diff < minDiff) {
      minDiff = diff;
      closestHz = validHz;
    }
  }

  return closestHz;
}

/**
 * Convert detected frequencies to text using single-tone schema
 */
export function convertSingleHzToText(frequencyArray, options = {}) {
  const tolerance = options.tolerance || SINGLE_CONFIG.FREQUENCY_TOLERANCE_PERCENT;

  // Normalize frequencies
  const normalizedFrequencies = frequencyArray.map((freq) =>
    findClosestSingleFrequency(freq, tolerance)
  );

  const validFrequencies = normalizedFrequencies.filter((f) => f !== null);

  if (validFrequencies.length === 0) {
    return '';
  }

  // Build reverse map: frequency -> character
  const reverseMap = {};
  for (const [char, freqs] of Object.entries(singleSchema.frequencyMap)) {
    reverseMap[freqs[0]] = char;
  }

  // Convert frequencies to characters
  let result = '';
  for (const freq of validFrequencies) {
    const char = reverseMap[freq];
    if (char) {
      result += char;
    }
  }

  // Remove start/end markers
  return result.replace(/^~+|~+$/g, '');
}

/**
 * Process single-tone frequency detections
 */
export function processSingleDetections(detections) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const result = [];
  let currentTone = null;
  let toneFrequencies = [];

  for (let i = 0; i < detections.length; i++) {
    const detection = detections[i];

    // Skip low amplitude
    if (detection.amplitude < SINGLE_CONFIG.MIN_AMPLITUDE_THRESHOLD) {
      if (currentTone !== null && toneFrequencies.length > 0) {
        const avgFreq = Math.round(
          toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
        );
        const validFreq = findClosestSingleFrequency(avgFreq);
        if (validFreq !== null) {
          result.push(validFreq);
        }
        currentTone = null;
        toneFrequencies = [];
      }
      continue;
    }

    const validFreq = findClosestSingleFrequency(detection.frequency);

    if (validFreq === null) {
      continue;
    }

    // Start new tone or continue existing one
    if (currentTone === null) {
      currentTone = validFreq;
      toneFrequencies = [detection.frequency];
    } else if (validFreq === currentTone) {
      toneFrequencies.push(detection.frequency);
    } else {
      // Different tone detected
      const avgFreq = Math.round(
        toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
      );
      const finalValidFreq = findClosestSingleFrequency(avgFreq);
      if (finalValidFreq !== null) {
        result.push(finalValidFreq);
      }

      currentTone = validFreq;
      toneFrequencies = [detection.frequency];
    }
  }

  // Don't forget the last tone
  if (currentTone !== null && toneFrequencies.length > 0) {
    const avgFreq = Math.round(
      toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
    );
    const validFreq = findClosestSingleFrequency(avgFreq);
    if (validFreq !== null) {
      result.push(validFreq);
    }
  }

  return result;
}

export { SINGLE_CONFIG, singleSchema };

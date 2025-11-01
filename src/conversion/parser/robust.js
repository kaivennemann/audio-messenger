import schema from './../schema/basic.json' with { type: 'json' };

/**
 * Robust frequency matching with tolerance bands
 * Handles real-world frequency drift and noise
 */

// Configuration for robust matching
const CONFIG = {
  // Frequency tolerance as percentage (e.g., 0.05 = 5%)
  FREQUENCY_TOLERANCE_PERCENT: 0.08,
  // Minimum amplitude threshold (0-255)
  MIN_AMPLITUDE_THRESHOLD: 30,
  // Tone duration in milliseconds
  TONE_DURATION_MS: 200,
  // Gap between tones in milliseconds
  TONE_GAP_MS: 50,
};

/**
 * Find closest valid frequency from schema
 * @param {number} detectedHz - Detected frequency
 * @param {number} tolerance - Tolerance percentage (default 8%)
 * @returns {number|null} - Closest valid frequency or null if no match
 */
export function findClosestValidFrequency(
  detectedHz,
  tolerance = CONFIG.FREQUENCY_TOLERANCE_PERCENT
) {
  let closestHz = null;
  let minDiff = Infinity;

  for (const validHz of schema.valid_hz) {
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
 * Convert detected frequencies to text with tolerance
 * @param {Array<number>} frequencyArray - Array of detected frequencies
 * @param {Object} options - Configuration options
 * @returns {string} - Decoded text
 */
export function convertFromHzToTextRobust(
  frequencyArray,
  options = {}
) {
  const tolerance = options.tolerance || CONFIG.FREQUENCY_TOLERANCE_PERCENT;

  // First, map detected frequencies to closest valid frequencies
  const normalizedFrequencies = frequencyArray.map((freq) =>
    findClosestValidFrequency(freq, tolerance)
  );

  // Filter out null values (frequencies that couldn't be matched)
  const validFrequencies = normalizedFrequencies.filter((f) => f !== null);

  if (validFrequencies.length === 0) {
    return '';
  }

  // Now decode using the normalized frequencies
  let result = '';
  let i = 0;

  while (i < validFrequencies.length) {
    let matched = false;

    // Try to match frequency patterns for each character
    for (const [char, frequencies] of Object.entries(schema.frequencyMap)) {
      if (i + frequencies.length <= validFrequencies.length) {
        const slice = validFrequencies.slice(i, i + frequencies.length);

        if (arraysMatch(slice, frequencies)) {
          result += char;
          i += frequencies.length;
          matched = true;
          break;
        }
      }
    }

    // If no match found, skip this frequency
    if (!matched) {
      i++;
    }
  }

  // Remove start/end markers
  return result.replace(/^~+|~+$/g, '');
}

/**
 * Compare two arrays for equality
 */
function arraysMatch(arr1, arr2) {
  return (
    arr1.length === arr2.length && arr1.every((val, idx) => val === arr2[idx])
  );
}

/**
 * Process raw frequency detections into discrete tones
 * Handles timing and amplitude filtering
 * @param {Array<{frequency: number, amplitude: number, timestamp: number}>} detections
 * @returns {Array<number>} - Processed frequency array
 */
export function processFrequencyDetections(detections) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const result = [];
  let currentTone = null;
  let toneFrequencies = [];

  for (let i = 0; i < detections.length; i++) {
    const detection = detections[i];

    // Skip low amplitude detections (likely noise)
    if (detection.amplitude < CONFIG.MIN_AMPLITUDE_THRESHOLD) {
      // End current tone if we were tracking one
      if (currentTone !== null && toneFrequencies.length > 0) {
        const avgFreq = Math.round(
          toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
        );
        const validFreq = findClosestValidFrequency(avgFreq);
        if (validFreq !== null) {
          result.push(validFreq);
        }
        currentTone = null;
        toneFrequencies = [];
      }
      continue;
    }

    const validFreq = findClosestValidFrequency(detection.frequency);

    if (validFreq === null) {
      continue;
    }

    // Start new tone or continue existing one
    if (currentTone === null) {
      currentTone = validFreq;
      toneFrequencies = [detection.frequency];
    } else if (validFreq === currentTone) {
      // Same tone continuing
      toneFrequencies.push(detection.frequency);
    } else {
      // Different tone detected - save previous and start new
      const avgFreq = Math.round(
        toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
      );
      const finalValidFreq = findClosestValidFrequency(avgFreq);
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
    const validFreq = findClosestValidFrequency(avgFreq);
    if (validFreq !== null) {
      result.push(validFreq);
    }
  }

  return result;
}

export { CONFIG };

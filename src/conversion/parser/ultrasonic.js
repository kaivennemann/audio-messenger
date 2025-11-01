import ultrasonicSchema from './../schema/ultrasonic.json' with { type: 'json' };

/**
 * Ultrasonic frequency matching
 * Uses high frequencies (8-17kHz) above human speech range
 */

// Configuration for ultrasonic matching
const ULTRASONIC_CONFIG = {
  // Slightly lower tolerance for cleaner high frequencies
  FREQUENCY_TOLERANCE_PERCENT: 0.07,
  // Lower amplitude threshold (high frequencies may be quieter)
  MIN_AMPLITUDE_THRESHOLD: 20,
  // Slightly shorter duration for faster transmission
  TONE_DURATION_MS: 150,
  // Minimal gap for speed
  TONE_GAP_MS: 30,
};

/**
 * Convert text to ultrasonic frequencies
 */
export function convertTextToUltrasonicHz(data) {
  data = '~' + data + '~';
  const arredData = data.split('');
  const result = [];

  for (let char of arredData) {
    if (!ultrasonicSchema.frequencyMap[char]) {
      throw new Error(`Cannot use character: ${char}`);
    }

    for (let item of ultrasonicSchema.frequencyMap[char]) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Find closest valid ultrasonic frequency
 */
export function findClosestUltrasonicFrequency(
  detectedHz,
  tolerance = ULTRASONIC_CONFIG.FREQUENCY_TOLERANCE_PERCENT
) {
  let closestHz = null;
  let minDiff = Infinity;

  for (const validHz of ultrasonicSchema.valid_hz) {
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
 * Convert detected frequencies to text using ultrasonic schema
 */
export function convertUltrasonicHzToText(frequencyArray, options = {}) {
  const tolerance = options.tolerance || ULTRASONIC_CONFIG.FREQUENCY_TOLERANCE_PERCENT;

  // Normalize frequencies
  const normalizedFrequencies = frequencyArray.map((freq) =>
    findClosestUltrasonicFrequency(freq, tolerance)
  );

  const validFrequencies = normalizedFrequencies.filter((f) => f !== null);

  if (validFrequencies.length === 0) {
    return '';
  }

  let result = '';
  let i = 0;

  while (i < validFrequencies.length) {
    let matched = false;

    for (const [char, frequencies] of Object.entries(ultrasonicSchema.frequencyMap)) {
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

    if (!matched) {
      i++;
    }
  }

  return result.replace(/^~+|~+$/g, '');
}

/**
 * Process ultrasonic frequency detections
 */
export function processUltrasonicDetections(detections) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const result = [];
  let currentTone = null;
  let toneFrequencies = [];

  for (let i = 0; i < detections.length; i++) {
    const detection = detections[i];

    // Skip low amplitude
    if (detection.amplitude < ULTRASONIC_CONFIG.MIN_AMPLITUDE_THRESHOLD) {
      if (currentTone !== null && toneFrequencies.length > 0) {
        const avgFreq = Math.round(
          toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
        );
        const validFreq = findClosestUltrasonicFrequency(avgFreq);
        if (validFreq !== null) {
          result.push(validFreq);
        }
        currentTone = null;
        toneFrequencies = [];
      }
      continue;
    }

    const validFreq = findClosestUltrasonicFrequency(detection.frequency);

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
      const finalValidFreq = findClosestUltrasonicFrequency(avgFreq);
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
    const validFreq = findClosestUltrasonicFrequency(avgFreq);
    if (validFreq !== null) {
      result.push(validFreq);
    }
  }

  return result;
}

function arraysMatch(arr1, arr2) {
  return (
    arr1.length === arr2.length && arr1.every((val, idx) => val === arr2[idx])
  );
}

export { ULTRASONIC_CONFIG, ultrasonicSchema };

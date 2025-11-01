import voiceSchema from './../schema/voice.json' with { type: 'json' };

/**
 * Voice-optimized frequency matching
 * Uses the voice schema with logarithmic frequency spacing
 */

// Configuration for voice matching
const VOICE_CONFIG = {
  // Slightly higher tolerance for voice frequencies (10%)
  FREQUENCY_TOLERANCE_PERCENT: 0.10,
  // Lower amplitude threshold for quieter speech
  MIN_AMPLITUDE_THRESHOLD: 25,
  // Longer tone duration for speech patterns
  TONE_DURATION_MS: 250,
  // Shorter gap for natural speech rhythm
  TONE_GAP_MS: 40,
};

/**
 * Convert text to voice-optimized frequencies
 */
export function convertTextToVoiceHz(data) {
  data = '~' + data + '~';
  const arredData = data.split('');
  const result = [];

  for (let char of arredData) {
    if (!voiceSchema.frequencyMap[char]) {
      throw new Error(`Cannot use character: ${char}`);
    }

    for (let item of voiceSchema.frequencyMap[char]) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Find closest valid voice frequency
 */
export function findClosestVoiceFrequency(
  detectedHz,
  tolerance = VOICE_CONFIG.FREQUENCY_TOLERANCE_PERCENT
) {
  let closestHz = null;
  let minDiff = Infinity;

  for (const validHz of voiceSchema.valid_hz) {
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
 * Convert detected frequencies to text using voice schema
 */
export function convertVoiceHzToText(frequencyArray, options = {}) {
  const tolerance = options.tolerance || VOICE_CONFIG.FREQUENCY_TOLERANCE_PERCENT;

  // Normalize frequencies
  const normalizedFrequencies = frequencyArray.map((freq) =>
    findClosestVoiceFrequency(freq, tolerance)
  );

  const validFrequencies = normalizedFrequencies.filter((f) => f !== null);

  if (validFrequencies.length === 0) {
    return '';
  }

  let result = '';
  let i = 0;

  while (i < validFrequencies.length) {
    let matched = false;

    for (const [char, frequencies] of Object.entries(voiceSchema.frequencyMap)) {
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
 * Process voice frequency detections with speech-optimized parameters
 */
export function processVoiceDetections(detections) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const result = [];
  let currentTone = null;
  let toneFrequencies = [];

  for (let i = 0; i < detections.length; i++) {
    const detection = detections[i];

    // Skip low amplitude (use voice-specific threshold)
    if (detection.amplitude < VOICE_CONFIG.MIN_AMPLITUDE_THRESHOLD) {
      if (currentTone !== null && toneFrequencies.length > 0) {
        const avgFreq = Math.round(
          toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length
        );
        const validFreq = findClosestVoiceFrequency(avgFreq);
        if (validFreq !== null) {
          result.push(validFreq);
        }
        currentTone = null;
        toneFrequencies = [];
      }
      continue;
    }

    const validFreq = findClosestVoiceFrequency(detection.frequency);

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
      const finalValidFreq = findClosestVoiceFrequency(avgFreq);
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
    const validFreq = findClosestVoiceFrequency(avgFreq);
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

export { VOICE_CONFIG, voiceSchema };

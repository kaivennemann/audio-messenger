import { findClosestValidFrequency } from './basic.js';
import { CONFIG } from './config.js';

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

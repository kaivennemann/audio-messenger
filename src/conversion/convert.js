import schema from './schema/basic.json' with { type: 'json' };
import { cauchyEncode } from './cauchy.js';

export function convertFromTextToHz(data, useCauchy = false, redundancy = 4) {
  // Apply Cauchy encoding if requested
  if (useCauchy) {
    data = cauchyEncode(data, redundancy);
  }

  data = '^^^' + data + '$$$';

  const arredData = data.split('');

  const result = [];

  for (let char of arredData) {
    if (!schema.frequencyMap[char]) {
      throw new Error(`cannot use char: ${char}`);
    }

    for (let item of schema.frequencyMap[char]) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Find closest valid frequency from schema
 * @param {number} detectedHz - Detected frequency
 * @param {number} tolerance - Tolerance percentage (default 8%)
 * @returns {number|null} - Closest valid frequency or null if no match
 */
export function findClosestValidFrequency(detectedHz, tolerance = 0.08) {
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

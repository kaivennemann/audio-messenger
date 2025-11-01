import { CONFIG } from './config';

export function convertFromTextToHz(schema, data) {
  data = '~' + data + '~';

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

export function convertFromHzToTextRobust(
  schema,
  frequencyArray,
  options = {}
) {
  const tolerance = options.tolerance || CONFIG.FREQUENCY_TOLERANCE_PERCENT;

  // First, map detected frequencies to closest valid frequencies
  const normalizedFrequencies = frequencyArray.map(freq =>
    findClosestValidFrequency(schema, freq, tolerance)
  );

  // Filter out null values (frequencies that couldn't be matched)
  const validFrequencies = normalizedFrequencies.filter(f => f !== null);

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
 * Find closest valid frequency from schema
 * @param {number} detectedHz - Detected frequency
 * @param {number} tolerance - Tolerance percentage (default 8%)
 * @returns {number|null} - Closest valid frequency or null if no match
 */
export function findClosestValidFrequency(
  schema,
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

function arraysMatch(arr1, arr2) {
  return (
    arr1.length === arr2.length && arr1.every((val, idx) => val === arr2[idx])
  );
}

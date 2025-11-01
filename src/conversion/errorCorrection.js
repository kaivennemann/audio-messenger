/**
 * Error Correction and Checksums for Audio Transmission
 * Implements simple error detection and correction for frequency-based messaging
 */

/**
 * Calculate CRC16 checksum for data validation
 * @param {Array<number>} data - Array of frequencies
 * @returns {number} - CRC16 checksum
 */
export function calculateCRC16(data) {
  let crc = 0xFFFF;

  for (let byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc = crc >> 1;
      }
    }
  }

  return crc & 0xFFFF;
}

/**
 * Convert CRC16 to frequency indices
 * @param {number} crc - CRC value
 * @param {number} maxBands - Number of frequency bands available
 * @returns {Array<number>} - Two frequency indices
 */
export function crcToFrequencyIndices(crc, maxBands) {
  const high = Math.floor(crc / maxBands) % maxBands;
  const low = crc % maxBands;
  return [high, low];
}

/**
 * Convert frequency indices back to CRC
 * @param {Array<number>} indices - Two frequency indices
 * @param {number} maxBands - Number of frequency bands
 * @returns {number} - Reconstructed CRC
 */
export function frequencyIndicesToCRC(indices, maxBands) {
  return (indices[0] * maxBands + indices[1]) & 0xFFFF;
}

/**
 * Add error correction to frequency array
 * Uses repetition code + CRC checksum
 * @param {Array<number>} frequencies - Original frequency array
 * @param {Array<number>} validHz - Valid frequency bands
 * @param {Object} options - Configuration options
 * @returns {Array<number>} - Frequencies with error correction
 */
export function addErrorCorrection(frequencies, validHz, options = {}) {
  const {
    repetitions = 1,      // How many times to repeat each frequency
    addCRC = true,        // Add CRC checksum
    addParity = false,    // Add parity frequencies
  } = options;

  let result = [];

  // Add repetitions for redundancy
  if (repetitions > 1) {
    for (let freq of frequencies) {
      for (let i = 0; i < repetitions; i++) {
        result.push(freq);
      }
    }
  } else {
    result = [...frequencies];
  }

  // Add parity frequencies (simple XOR parity)
  if (addParity) {
    const parityIndices = calculateParityIndices(frequencies, validHz.length);
    for (let idx of parityIndices) {
      result.push(validHz[idx]);
    }
  }

  // Add CRC checksum
  if (addCRC) {
    // Convert frequencies to indices for CRC calculation
    const indices = frequencies.map(f => validHz.indexOf(f));
    const crc = calculateCRC16(indices);
    const crcIndices = crcToFrequencyIndices(crc, validHz.length);

    // Add CRC as two frequency tones
    result.push(validHz[crcIndices[0]]);
    result.push(validHz[crcIndices[1]]);
  }

  return result;
}

/**
 * Calculate parity indices for error detection
 * @param {Array<number>} frequencies - Frequency array
 * @param {number} maxBands - Number of bands
 * @returns {Array<number>} - Parity indices
 */
function calculateParityIndices(frequencies, maxBands) {
  // Find indices of frequencies
  let xorSum = 0;
  let addSum = 0;

  for (let i = 0; i < frequencies.length; i++) {
    const freqValue = frequencies[i] || 0;
    xorSum ^= freqValue;
    addSum += freqValue;
  }

  const parity1 = (xorSum % maxBands);
  const parity2 = (addSum % maxBands);

  return [parity1, parity2];
}

/**
 * Remove error correction and validate data
 * @param {Array<number>} frequencies - Received frequency array
 * @param {Array<number>} validHz - Valid frequency bands
 * @param {Object} options - Configuration options
 * @returns {Object} - { data: Array<number>, valid: boolean, corrected: boolean }
 */
export function removeErrorCorrection(frequencies, validHz, options = {}) {
  const {
    repetitions = 1,
    addCRC = true,
    addParity = false,
  } = options;

  let data = [...frequencies];
  let valid = true;
  let corrected = false;
  let receivedCRC = null;
  let receivedCRCIndices = null;

  // Extract CRC if present (but don't validate yet)
  if (addCRC && data.length >= 2) {
    receivedCRCIndices = [
      validHz.indexOf(data[data.length - 2]),
      validHz.indexOf(data[data.length - 1]),
    ];

    // Check if CRC indices are valid
    if (receivedCRCIndices[0] === -1 || receivedCRCIndices[1] === -1) {
      console.warn('Invalid CRC frequencies detected');
      valid = false;
    } else {
      receivedCRC = frequencyIndicesToCRC(receivedCRCIndices, validHz.length);
    }

    // Remove CRC frequencies from data
    data = data.slice(0, -2);
  }

  // Remove parity if present
  if (addParity && data.length >= 2) {
    data = data.slice(0, -2);
  }

  // Remove repetitions and perform majority voting
  if (repetitions > 1) {
    const { data: decodedData, hadErrors } = derepeatWithCorrection(data, repetitions);
    data = decodedData;
    if (hadErrors) {
      corrected = true;
      console.log('Errors corrected via repetition code');
    }
  }

  // Now validate CRC against the de-repeated original data
  if (addCRC && receivedCRC !== null) {
    // Convert frequencies to indices for CRC validation
    const indices = data.map(f => validHz.indexOf(f));
    const expectedCRC = calculateCRC16(indices);

    if (expectedCRC !== receivedCRC) {
      valid = false;
      console.warn('CRC mismatch! Expected:', expectedCRC.toString(16), 'Received:', receivedCRC.toString(16));
      console.warn('Data length:', data.length, 'Data sample:', data.slice(0, 5));
    } else {
      console.log('✅ CRC validated successfully!', expectedCRC.toString(16));
    }
  }

  return { data, valid, corrected };
}

/**
 * Remove repetitions using majority voting for error correction
 * @param {Array<number>} frequencies - Repeated frequency array
 * @param {number} repetitions - Number of repetitions per frequency
 * @returns {Object} - { data: Array<number>, hadErrors: boolean }
 */
function derepeatWithCorrection(frequencies, repetitions) {
  const result = [];
  let hadErrors = false;

  for (let i = 0; i < frequencies.length; i += repetitions) {
    const group = frequencies.slice(i, i + repetitions);

    if (group.length === 0) continue;

    // Majority voting: find most common frequency in this group
    const frequencyCount = {};
    for (let freq of group) {
      frequencyCount[freq] = (frequencyCount[freq] || 0) + 1;
    }

    let maxCount = 0;
    let majorityFreq = group[0];

    for (let [freq, count] of Object.entries(frequencyCount)) {
      if (count > maxCount) {
        maxCount = count;
        majorityFreq = parseInt(freq);
      }
    }

    // Check if there were any errors corrected
    if (group.some(f => f !== majorityFreq)) {
      hadErrors = true;
    }

    result.push(majorityFreq);
  }

  return { data: result, hadErrors };
}


/**
 * Interleave frequencies for burst error resistance
 * Simple block interleaver: write by rows, read by columns
 * @param {Array<number>} frequencies - Input frequencies
 * @param {number} depth - Interleaving depth (number of columns)
 * @returns {Array<number>} - Interleaved frequencies
 */
export function interleave(frequencies, depth = 4) {
  if (frequencies.length === 0) return [];

  const cols = depth;
  const rows = Math.ceil(frequencies.length / cols);
  const result = [];

  // Write data into matrix by rows
  const matrix = [];
  for (let i = 0; i < frequencies.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    if (!matrix[row]) matrix[row] = [];
    matrix[row][col] = frequencies[i];
  }

  // Read data from matrix by columns
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (matrix[row] && matrix[row][col] !== undefined) {
        result.push(matrix[row][col]);
      }
    }
  }

  return result;
}

/**
 * Deinterleave frequencies
 * Reverse of interleave: write by columns, read by rows
 * @param {Array<number>} frequencies - Interleaved frequencies
 * @param {number} depth - Interleaving depth (number of columns)
 * @returns {Array<number>} - Original order
 */
export function deinterleave(frequencies, depth = 4) {
  if (frequencies.length === 0) return [];

  const cols = depth;
  const rows = Math.ceil(frequencies.length / cols);
  const result = new Array(frequencies.length);

  // Write data back: interleaved data was read column-by-column
  // So we write it back column-by-column
  let idx = 0;
  for (let col = 0; col < cols && idx < frequencies.length; col++) {
    for (let row = 0; row < rows && idx < frequencies.length; row++) {
      const originalIndex = row * cols + col;
      if (originalIndex < frequencies.length) {
        result[originalIndex] = frequencies[idx];
        idx++;
      }
    }
  }

  return result.filter(f => f !== undefined);
}

/**
 * Hamming(7,4) encode - simple error correction code
 * Encodes 4 data bits into 7 bits with error correction capability
 * @param {number} data - 4-bit data (0-15)
 * @returns {number} - 7-bit encoded value
 */
export function hammingEncode(data) {
  const d = data & 0x0F; // Ensure 4 bits
  const d1 = (d >> 3) & 1;
  const d2 = (d >> 2) & 1;
  const d3 = (d >> 1) & 1;
  const d4 = d & 1;

  // Calculate parity bits
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p3 = d2 ^ d3 ^ d4;

  // Construct 7-bit code: p1 p2 d1 p3 d2 d3 d4
  return (p1 << 6) | (p2 << 5) | (d1 << 4) | (p3 << 3) | (d2 << 2) | (d3 << 1) | d4;
}

/**
 * Hamming(7,4) decode - detects and corrects single-bit errors
 * @param {number} code - 7-bit received code
 * @returns {Object} - { data: number, corrected: boolean }
 */
export function hammingDecode(code) {
  const c = code & 0x7F; // Ensure 7 bits

  const p1 = (c >> 6) & 1;
  const p2 = (c >> 5) & 1;
  const d1 = (c >> 4) & 1;
  const p3 = (c >> 3) & 1;
  const d2 = (c >> 2) & 1;
  const d3 = (c >> 1) & 1;
  const d4 = c & 1;

  // Calculate syndrome
  const s1 = p1 ^ d1 ^ d2 ^ d4;
  const s2 = p2 ^ d1 ^ d3 ^ d4;
  const s3 = p3 ^ d2 ^ d3 ^ d4;

  const syndrome = (s1 << 2) | (s2 << 1) | s3;

  let correctedCode = c;
  let corrected = false;

  // Correct error if syndrome is non-zero
  if (syndrome !== 0) {
    const errorPos = syndrome - 1;
    correctedCode ^= (1 << (6 - errorPos));
    corrected = true;
  }

  // Extract data bits
  const cd1 = (correctedCode >> 4) & 1;
  const cd2 = (correctedCode >> 2) & 1;
  const cd3 = (correctedCode >> 1) & 1;
  const cd4 = correctedCode & 1;

  const data = (cd1 << 3) | (cd2 << 2) | (cd3 << 1) | cd4;

  return { data, corrected };
}

const errorCorrection = {
  calculateCRC16,
  addErrorCorrection,
  removeErrorCorrection,
  interleave,
  deinterleave,
  hammingEncode,
  hammingDecode,
};

export default errorCorrection;

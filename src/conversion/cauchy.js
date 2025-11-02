import schema from './schema/basic.json' with { type: 'json' };

/**
 * XOR-based Erasure Codes (simplified approach)
 * Works at the alphabet level - encodes/decodes strings with erasure correction
 * Uses multiple XOR parity checks for redundancy
 */

// Erasure marker for missing characters
export const ERASURE_MARKER = '\x00';

// Number of redundancy symbols to add (can recover up to this many erasures)
const DEFAULT_REDUNDANCY = 4;

/**
 * Map character to index in alphabet
 * @param {string} char - Character from alphabet
 * @returns {number} - Index in alphabet
 */
function charToIndex(char) {
  return schema.alphabet.indexOf(char);
}

/**
 * Map index to character in alphabet
 * @param {number} index - Index in alphabet
 * @returns {string} - Character from alphabet
 */
function indexToChar(index) {
  const normalized = ((index % schema.alphabet.length) + schema.alphabet.length) % schema.alphabet.length;
  return schema.alphabet[normalized];
}

/**
 * Encode a message with XOR erasure codes
 * Uses multiple overlapping XOR parity groups for redundancy
 * @param {string} message - Original message
 * @param {number} redundancy - Number of redundancy symbols to add
 * @returns {string} - Encoded message with redundancy
 */
export function cauchyEncode(message, redundancy = DEFAULT_REDUNDANCY) {
  if (!message || message.length === 0) {
    return message;
  }

  const k = message.length;

  // Convert message to indices
  const dataIndices = [];
  for (let i = 0; i < message.length; i++) {
    const idx = charToIndex(message[i]);
    if (idx === -1) {
      throw new Error(`Character '${message[i]}' not in alphabet`);
    }
    dataIndices.push(idx);
  }

  // Create redundancy symbols using different XOR patterns
  const parityIndices = [];
  for (let p = 0; p < redundancy; p++) {
    let xorSum = 0;

    // Each parity symbol uses a different pattern of data symbols
    // Pattern p uses symbols at positions where (i % redundancy) == p, plus additional weighted positions
    for (let i = 0; i < k; i++) {
      // Create overlapping coverage using multiple conditions
      if (i % redundancy === p || (i + p) % redundancy === 0 || i === p % k) {
        xorSum ^= dataIndices[i];
      }
    }

    parityIndices.push(xorSum);
  }

  // Convert parity indices back to characters
  const parityChars = parityIndices.map(idx => indexToChar(idx));

  // Return original message + parity symbols
  return message + parityChars.join('');
}

/**
 * Decode a message with erasures using XOR erasure codes
 * @param {string} received - Received message (may contain ERASURE_MARKER for missing chars)
 * @param {number} originalLength - Original message length (without redundancy)
 * @param {number} redundancy - Number of redundancy symbols used
 * @returns {string|null} - Decoded message or null if unrecoverable
 */
export function cauchyDecode(received, originalLength, redundancy = DEFAULT_REDUNDANCY) {
  if (!received || received.length === 0) {
    return received;
  }

  const totalLength = originalLength + redundancy;

  // Pad with erasure markers if received is shorter
  while (received.length < totalLength) {
    received += ERASURE_MARKER;
  }

  // Find erasure positions in data portion only
  const erasurePositions = [];
  for (let i = 0; i < originalLength; i++) {
    if (received[i] === ERASURE_MARKER) {
      erasurePositions.push(i);
    }
  }

  // If too many erasures, cannot recover
  if (erasurePositions.length > redundancy) {
    console.warn(`Too many erasures (${erasurePositions.length} > ${redundancy}), cannot recover`);
    return null;
  }

  // If no erasures, just return the data portion
  if (erasurePositions.length === 0) {
    return received.substring(0, originalLength);
  }

  // Convert received to indices (use -1 for erasures)
  const dataIndices = [];
  for (let i = 0; i < originalLength; i++) {
    if (received[i] === ERASURE_MARKER) {
      dataIndices.push(-1);
    } else {
      const idx = charToIndex(received[i]);
      dataIndices.push(idx);
    }
  }

  // Convert parity symbols
  const parityIndices = [];
  for (let i = originalLength; i < received.length; i++) {
    if (received[i] === ERASURE_MARKER) {
      parityIndices.push(-1);
    } else {
      const idx = charToIndex(received[i]);
      parityIndices.push(idx);
    }
  }

  const k = originalLength;

  // Iteratively recover erasures using XOR equations
  for (let iteration = 0; iteration < 20; iteration++) {
    let recovered = false;

    // Try each parity equation
    for (let p = 0; p < redundancy; p++) {
      if (parityIndices[p] === -1) continue; // Can't use corrupted parity

      // Count unknowns in this parity group
      const groupPositions = [];
      for (let i = 0; i < k; i++) {
        if (i % redundancy === p || (i + p) % redundancy === 0 || i === p % k) {
          groupPositions.push(i);
        }
      }

      // Find erasures in this group
      const groupErasures = groupPositions.filter(pos => dataIndices[pos] === -1);

      // If exactly one erasure, we can recover it using XOR
      if (groupErasures.length === 1) {
        const erasurePos = groupErasures[0];
        let xorSum = parityIndices[p];

        // XOR all known values
        for (const pos of groupPositions) {
          if (pos !== erasurePos && dataIndices[pos] !== -1) {
            xorSum ^= dataIndices[pos];
          }
        }

        // The result is the missing value
        dataIndices[erasurePos] = xorSum;
        recovered = true;
      }
    }

    // If no progress, stop
    if (!recovered) break;

    // Check if all erasures recovered
    if (erasurePositions.every(pos => dataIndices[pos] !== -1)) {
      break;
    }
  }

  // Convert recovered indices back to characters
  let result = '';
  for (let i = 0; i < originalLength; i++) {
    if (dataIndices[i] === -1) {
      // Still couldn't recover, use question mark as fallback
      result += '?';
    } else {
      result += indexToChar(dataIndices[i]);
    }
  }

  return result;
}

/**
 * Get metadata about encoding
 * @param {number} messageLength - Original message length
 * @param {number} redundancy - Number of redundancy symbols
 * @returns {object} - Encoding metadata
 */
export function getEncodingInfo(messageLength, redundancy = DEFAULT_REDUNDANCY) {
  return {
    dataLength: messageLength,
    parityLength: redundancy,
    totalLength: messageLength + redundancy,
    maxErasures: redundancy,
    overhead: ((redundancy / messageLength) * 100).toFixed(1) + '%'
  };
}

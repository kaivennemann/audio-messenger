import { CauchyRS } from './cauchy.js';
import schema from '../conversion/schema/basic.json' with { type: 'json' };

/**
 * Automatic erasure-coded message codec
 * Handles encoding messages with redundancy and decoding with erasure correction
 */
export class MessageCodec {
  constructor(dataSymbols = 8, redundancy = 4) {
    this.k = dataSymbols; // Number of data symbols per block
    this.redundancy = redundancy; // Number of redundant symbols
    this.n = this.k + this.redundancy; // Total symbols per block

    // Use schema alphabet (excluding start/end markers)
    this.alphabet = schema.alphabet.filter(c => c !== '^' && c !== '$');
    this.alphabetSize = this.alphabet.length; // Should be 70

    this.codec = new CauchyRS(this.k, this.n, this.alphabetSize);

    // Create mappings between field elements and alphabet
    this.fieldToChar = {};
    this.charToField = {};
    for (let i = 0; i < this.alphabetSize; i++) {
      this.fieldToChar[i] = this.alphabet[i];
      this.charToField[this.alphabet[i]] = i;
    }

    // Receiving state
    this.isReceiving = false;
    this.receivedSymbols = [];
    this.erasurePositions = [];
    this.expectedBlocks = 0;
    this.currentBlock = 0;
  }

  /**
   * Encode a message into blocks with redundancy
   * @param {string} message - Original message
   * @returns {string} - Encoded message with redundancy symbols
   */
  encode(message) {
    const blocks = this._splitIntoBlocks(message);
    const encodedBlocks = [];

    for (const block of blocks) {
      // Pad block if needed
      const paddedBlock = this._padBlock(block);

      // Encode with Cauchy RS (it handles char -> field element conversion)
      const encoded = this.codec.encode(paddedBlock.split(''));

      // Convert field elements back to alphabet characters
      const encodedChars = encoded.map(fieldElement => {
        const idx = fieldElement % this.alphabetSize;
        const char = this.fieldToChar[idx];
        return char !== undefined ? char : ' ';
      });

      encodedBlocks.push(encodedChars.join(''));
    }

    // Add header with number of blocks and original message length
    const header = this._createHeader(blocks.length, message.length);
    return header + encodedBlocks.join('');
  }

  /**
   * Start receiving a new message
   */
  startReceiving() {
    this.isReceiving = true;
    this.receivedSymbols = [];
    this.erasurePositions = [];
    this.currentBlock = 0;
    this.expectedBlocks = 0;
  }

  /**
   * Add a received symbol
   * @param {string} symbol - Received symbol
   */
  addSymbol(symbol) {
    if (!this.isReceiving) return;

    this.receivedSymbols.push(symbol);
  }

  /**
   * Mark an erasure at the current position
   * @param {number} position - Position of the erasure
   */
  addErasure(position) {
    if (!this.isReceiving) return;

    console.log(`Erasure detected at position ${position}`);
    this.erasurePositions.push(position);

    // Add a placeholder for the erased symbol
    this.receivedSymbols.push('\x00'); // Null character as placeholder
  }

  /**
   * Finish receiving and decode the message
   * @returns {string|null} - Decoded message or null if decoding fails
   */
  finishReceiving() {
    this.isReceiving = false;

    if (this.receivedSymbols.length === 0) {
      return null;
    }

    try {
      // Parse header
      const headerLength = 2;
      const header = this.receivedSymbols.slice(0, headerLength).join('');
      const { numBlocks, messageLength } = this._parseHeader(header);

      // Extract encoded data (skip header)
      const encodedData = this.receivedSymbols.slice(headerLength);

      // Adjust erasure positions (account for header)
      const adjustedErasures = this.erasurePositions
        .map(pos => pos - headerLength)
        .filter(pos => pos >= 0);

      // Decode blocks
      const decodedBlocks = [];
      for (let i = 0; i < numBlocks; i++) {
        const blockStart = i * this.n;
        const blockEnd = blockStart + this.n;
        const blockSymbols = encodedData.slice(blockStart, blockEnd);

        // Find erasures in this block
        const blockErasures = adjustedErasures
          .filter(pos => pos >= blockStart && pos < blockEnd)
          .map(pos => pos - blockStart);

        // Convert symbols from characters to field elements
        const fieldSymbols = blockSymbols.map(char => {
          if (char === '\x00') return 0; // Placeholder for erasure
          const fieldValue = this.charToField[char];
          return fieldValue !== undefined ? fieldValue : 0;
        });

        // Decode this block
        const decoded = this.codec.decode(fieldSymbols, blockErasures);

        // Convert back to characters using alphabet
        const decodedChars = decoded.map(fieldElement => {
          const char = this.fieldToChar[fieldElement % this.alphabetSize];
          return char !== undefined ? char : ' ';
        });

        decodedBlocks.push(decodedChars.join(''));
      }

      // Join blocks and trim to original message length
      const fullMessage = decodedBlocks.join('');
      return fullMessage.substring(0, messageLength);

    } catch (error) {
      console.error('Decoding failed:', error);
      return null;
    }
  }

  /**
   * Split message into blocks of k symbols each
   */
  _splitIntoBlocks(message) {
    const blocks = [];
    for (let i = 0; i < message.length; i += this.k) {
      blocks.push(message.substring(i, i + this.k));
    }
    return blocks;
  }

  /**
   * Pad block to k symbols if needed
   */
  _padBlock(block) {
    if (block.length < this.k) {
      return block + ' '.repeat(this.k - block.length);
    }
    return block;
  }

  /**
   * Create a 2-character header encoding number of blocks and message length
   */
  _createHeader(numBlocks, messageLength) {
    // Encode as 2 characters using alphabet (70^2 = 4900 combinations)
    // Combined value: numBlocks (up to 70) and messageLength (up to 70)
    const maxPerField = this.alphabetSize;

    if (numBlocks >= maxPerField || messageLength >= maxPerField) {
      throw new Error(`Message too long: ${numBlocks} blocks, ${messageLength} chars (max ${maxPerField})`);
    }

    const char1 = this.fieldToChar[numBlocks] || ' ';
    const char2 = this.fieldToChar[messageLength] || ' ';

    return char1 + char2;
  }

  /**
   * Parse the header to extract number of blocks and message length
   */
  _parseHeader(header) {
    if (header.length < 2) {
      throw new Error('Invalid header');
    }

    const numBlocks = this.charToField[header[0]] || 0;
    const messageLength = this.charToField[header[1]] || 0;

    return { numBlocks, messageLength };
  }
}

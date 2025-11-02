import { CauchyRS } from './cauchy.js';

/**
 * Automatic erasure-coded message codec
 * Handles encoding messages with redundancy and decoding with erasure correction
 */
export class MessageCodec {
  constructor(dataSymbols = 8, redundancy = 4) {
    this.k = dataSymbols; // Number of data symbols per block
    this.redundancy = redundancy; // Number of redundant symbols
    this.n = this.k + this.redundancy; // Total symbols per block

    this.codec = new CauchyRS(this.k, this.n);

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

      // Encode with Cauchy RS
      const encoded = this.codec.encode(paddedBlock.split(''));

      // Convert back to characters (handling field elements)
      const encodedChars = encoded.map(fieldElement =>
        String.fromCharCode(fieldElement + 32) // Offset to printable ASCII
      );

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
          if (char === '\x00') return 0; // Placeholder
          return char.charCodeAt(0) - 32;
        });

        // Decode this block
        const decoded = this.codec.decode(fieldSymbols, blockErasures);

        // Convert back to characters
        const decodedChars = decoded.map(fieldElement =>
          String.fromCharCode(fieldElement + 32)
        );

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
    // Encode as 2 characters (limited to 72^2 = 5184 combinations)
    const combined = numBlocks * 256 + messageLength;
    const char1 = String.fromCharCode((combined >> 8) + 32);
    const char2 = String.fromCharCode((combined & 0xFF) + 32);
    return char1 + char2;
  }

  /**
   * Parse the header to extract number of blocks and message length
   */
  _parseHeader(header) {
    if (header.length < 2) {
      throw new Error('Invalid header');
    }

    const char1 = header.charCodeAt(0) - 32;
    const char2 = header.charCodeAt(1) - 32;
    const combined = (char1 << 8) | char2;

    const numBlocks = Math.floor(combined / 256);
    const messageLength = combined % 256;

    return { numBlocks, messageLength };
  }
}

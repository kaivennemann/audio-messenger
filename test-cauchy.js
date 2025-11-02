import { cauchyEncode, cauchyDecode, ERASURE_MARKER, getEncodingInfo } from './src/conversion/cauchy.js';

console.log('=== Cauchy Erasure Code Test ===\n');

// Test 1: Basic encoding
const message = 'hello';
const redundancy = 4;

console.log(`Original message: "${message}"`);
console.log(`Redundancy: ${redundancy} symbols\n`);

const encoded = cauchyEncode(message, redundancy);
console.log(`Encoded message: "${encoded}"`);
console.log(`Length: ${message.length} -> ${encoded.length}`);

const info = getEncodingInfo(message.length, redundancy);
console.log(`Encoding info:`, info);
console.log('');

// Test 2: No erasures
console.log('--- Test 2: No erasures ---');
const decoded1 = cauchyDecode(encoded, message.length, redundancy);
console.log(`Decoded: "${decoded1}"`);
console.log(`Match: ${decoded1 === message}\n`);

// Test 3: Single erasure
console.log('--- Test 3: Single erasure (position 2) ---');
const withErasure1 = encoded.substring(0, 2) + ERASURE_MARKER + encoded.substring(3);
console.log(`Received: "${withErasure1.split('').map(c => c === ERASURE_MARKER ? '_' : c).join('')}"`);
const decoded2 = cauchyDecode(withErasure1, message.length, redundancy);
console.log(`Decoded: "${decoded2}"`);
console.log(`Match: ${decoded2 === message}\n`);

// Test 4: Multiple erasures
console.log('--- Test 4: Multiple erasures (positions 1, 3) ---');
const withErasure2 = encoded.substring(0, 1) + ERASURE_MARKER + encoded.substring(2, 3) + ERASURE_MARKER + encoded.substring(4);
console.log(`Received: "${withErasure2.split('').map(c => c === ERASURE_MARKER ? '_' : c).join('')}"`);
const decoded3 = cauchyDecode(withErasure2, message.length, redundancy);
console.log(`Decoded: "${decoded3}"`);
console.log(`Match: ${decoded3 === message}\n`);

// Test 5: Too many erasures
console.log('--- Test 5: Too many erasures (5 erasures, max is 4) ---');
const withTooManyErasures = ERASURE_MARKER.repeat(5) + encoded.substring(5);
console.log(`Received: "${withTooManyErasures.split('').map(c => c === ERASURE_MARKER ? '_' : c).join('')}"`);
const decoded4 = cauchyDecode(withTooManyErasures, message.length, redundancy);
console.log(`Decoded: ${decoded4 === null ? 'null (failed)' : `"${decoded4}"`}\n`);

// Test 6: Longer message
console.log('--- Test 6: Longer message ---');
const longMessage = 'hello world';
const encodedLong = cauchyEncode(longMessage, redundancy);
console.log(`Original: "${longMessage}"`);
console.log(`Encoded: "${encodedLong}" (length: ${encodedLong.length})`);

const withErasureLong = encodedLong.substring(0, 4) + ERASURE_MARKER + encodedLong.substring(5, 8) + ERASURE_MARKER + encodedLong.substring(9);
console.log(`With erasures: "${withErasureLong.split('').map(c => c === ERASURE_MARKER ? '_' : c).join('')}"`);
const decodedLong = cauchyDecode(withErasureLong, longMessage.length, redundancy);
console.log(`Decoded: "${decodedLong}"`);
console.log(`Match: ${decodedLong === longMessage}\n`);

console.log('=== Tests Complete ===');

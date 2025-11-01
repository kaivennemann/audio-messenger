import AudioConverter from './convert.js';

function main() {
  const converter = new AudioConverter(1200, 2200);
  console.log(
    'AudioConverter initialized with frequencies:',
    converter.lowFreq,
    'Hz and',
    converter.highFreq,
    'Hz'
  );

  let encoded = converter.encode('Hello, World!');
  let decoded = converter.decode(encoded);

  console.log('Encoded frequencies:', encoded);
  console.log('Decoded string:', decoded);
}

main();
// console.log('AudioConverter module loaded successfully.');

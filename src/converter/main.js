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

  let encoded = converter.textToHz('Hello, World!');
  let decoded = converter.hzToText(encoded);

  console.log('Encoded frequencies:', encoded);
  console.log('Decoded string:', decoded);
}

main();
// console.log('AudioConverter module loaded successfully.');

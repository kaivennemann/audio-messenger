function stringToBinary(str) {
  return str
    .split('')
    .map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0').split('');
    })
    .flat()
    .map(bit => parseInt(bit, 10));
}

function binaryToString(binary) {
  const chars = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8).join('');
    const charCode = parseInt(byte, 2);
    chars.push(String.fromCharCode(charCode));
  }
  return chars.join('');
}

export default class AudioConverter {
  constructor(lowFreq, highFreq) {
    this.lowFreq = lowFreq;
    this.highFreq = highFreq;
  }

  textToHz(input) {
    const binary = stringToBinary(input);
    console.log('Binary representation:', binary);

    return binary.map(bit => (bit === 0 ? this.lowFreq : this.highFreq));
  }

  hzToText(input) {
    const binary = input.map(freq => (freq === this.lowFreq ? 0 : 1));

    const output = binaryToString(binary);
    console.log('Decoded string:', output);
    return output;
  }
}

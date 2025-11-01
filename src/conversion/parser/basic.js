import schema from './../schema/basic.json' with { type: 'json' };

export function convertText(data) {
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

export function convertHz(frequencyArray) {
  // Create reverse lookup map
  const reverseMap = {};
  for (const [char, frequencies] of Object.entries(schema.frequencyMap)) {
    const key = frequencies.join(','); // Use array as key
    reverseMap[key] = char;
  }

  // Convert frequency array back to characters
  let result = '';
  let i = 0;

  while (i < frequencyArray.length) {
    // Try to match frequency patterns
    for (const [char, frequencies] of Object.entries(schema.frequencyMap)) {
      if (
        arraysMatch(
          frequencyArray.slice(i, i + frequencies.length),
          frequencies
        )
      ) {
        result += char;
        i += frequencies.length;
        break;
      }
    }
  }

  // Remove the wrapper ~
  return result.replace(/^~|~$/g, '');
}

function arraysMatch(arr1, arr2) {
  return (
    arr1.length === arr2.length && arr1.every((val, idx) => val === arr2[idx])
  );
}

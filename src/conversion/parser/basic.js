import schema from './../schema/basic.json' with { type: 'json' };

export function convertFromTextToHz(data) {
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

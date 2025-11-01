import { BasicSchemaGenerator } from './BasicSchemaGenerator.js';

export function basicConstructor(alphabet) {
  const b = new BasicSchemaGenerator(
    alphabet,
    '../schema/basic.json',
    400,
    8000,
    50
  );

  return b;
}

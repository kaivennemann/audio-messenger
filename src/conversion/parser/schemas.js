import { SCHEMA_CONFIGS } from './config.js';
import basicSchema from '../schema/basic.json';
import voiceSchema from '../schema/voice.json';
import ultrasonicSchema from '../schema/ultrasonic.json';
import singleSchema from '../schema/single.json';
import quadSchema from '../schema/quad.json';

const schemas = {
  basic: basicSchema,
  voice: voiceSchema,
  ultrasonic: ultrasonicSchema,
  single: singleSchema,
  quad: quadSchema,
};

export function getSchema(schemaType) {
  if (!schemas[schemaType]) {
    throw new Error(`Unknown schema type: ${schemaType}`);
  }
  return schemas[schemaType];
}

export function getConfig(schemaType) {
  if (!SCHEMA_CONFIGS[schemaType]) {
    throw new Error(`Unknown schema type: ${schemaType}`);
  }
  return SCHEMA_CONFIGS[schemaType];
}

export { schemas, SCHEMA_CONFIGS };

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ALPHABET } from './constants.js';
import {
  basicConstructor,
  singleConstructor,
  ultrasonicConstructor,
  voiceConstructor,
} from './generator/index.js';

const d = ultrasonicConstructor(ALPHABET);
const b = basicConstructor(ALPHABET);

doWrite(d);
doWrite(b);
doWrite(singleConstructor([...ALPHABET, ':', '[', ']']));
doWrite(voiceConstructor(ALPHABET));

async function doWrite(d) {
  try {
    // Create directory if it doesn't exist
    await mkdir(dirname(d.SCHEMA_FILE), { recursive: true });

    await writeFile(d.SCHEMA_FILE, d.produceJson());
    console.log('File saved successfully to:', d.SCHEMA_FILE);
  } catch (err) {
    console.error('Error writing file:', err);
  }
}

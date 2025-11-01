import React from 'react';
import play from '../audio-output/play.js';
// import { convertFromTextToHz } from '../conversion/parser/basic.js';
import AudioConverter from '../converter/convert.js';

function playNote() {
  // const frequencyArray = convertFromTextToHz('hello world');
  const converter = new AudioConverter(3000, 4000);
  let frequencyArray = converter.encode('A');

  console.log(frequencyArray);
  // play([523, 659, 784, 1047], 0.3);
  play(frequencyArray, 0.4);
}

function SoundCreator({ className }) {
  return (
    <div className={className}>
      <button onClick={playNote}>Play</button>
    </div>
  );
}

export default SoundCreator;

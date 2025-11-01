import React from 'react';
import play from '../audio-output/play.js';
import { convertFromTextToHz } from '../conversion/parser/basic.js';

function playNote() {
  const frequencyArray = convertFromTextToHz('hello world');
  console.log(frequencyArray);
  // play([523, 659, 784, 1047], 0.3);
  play(frequencyArray, 3.3);
}

function SoundCreator({ className }) {
  return (
    <div className={className}>
      <button onClick={playNote}>Play</button>
    </div>
  );
}

export default SoundCreator;

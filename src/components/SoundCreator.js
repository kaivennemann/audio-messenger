import React from 'react';
import play from '../audio-output/play.js';

function playNote() {
  // play([523, 659, 784, 1047], 0.3);
  play([2000], 3.3);
}

function SoundCreator({ className }) {
  return (
    <div className={className}>
      <button onClick={playNote}>Play</button>
    </div>
  );
}

export default SoundCreator;

import React from "react";
import * as Tone from "tone";

function play() {
  //create a synth and connect it to the main output (your speakers)
  const synth = new Tone.Synth().toDestination();

  //play a middle 'C' for the duration of an 8th note
  synth.triggerAttackRelease("C7", "8n");
}

function SoundCreator({ className }) {
  return (
    <div className={className}>
      <button onClick={play}>Play</button>
    </div>
  );
}

export default SoundCreator;

import * as Tone from 'tone';
import AudioConverter from '../converter/convert.js';

async function playFrequencies(frequencyArray, durationPerNote) {
  // 1. Create a Tone.Synth and connect it to the main output.
  // The Tone.Synth already includes an internal oscillator and an envelope.
  const synth = new Tone.Synth({
    // 2. Explicitly set the oscillator type to 'sine' for a "nice sine wave."
    oscillator: {
      type: 'sine',
    },
    // Optional: Set a faster attack/release for a cleaner note separation
    envelope: {
      attack: 0.01,
      release: durationPerNote * 0.3, // release slightly before the next note starts
    },
  }).toDestination();

  // Initialize the starting time for the first note
  let startTime = Tone.now();

  // Iterate over each frequency in the provided array
  frequencyArray.forEach(frequency => {
    // Schedule the note's envelope (attack and release)
    // Arguments: (note/frequency, duration, time)
    synth.triggerAttackRelease(frequency, durationPerNote, startTime);

    // Increment the startTime by the duration of the note just scheduled.
    startTime += durationPerNote;
  });

  return new Promise(resolve => {
    // Resolve the promise after all notes have played
    setTimeout(
      () => {
        resolve();
      },
      frequencyArray.length * durationPerNote * 1000
    ); // Convert to milliseconds
  });
}

async function playMessage(msg) {
  // const frequencyArray = convertFromTextToHz('k');
  const converter = new AudioConverter(3500, 4100);
  const frequencyArray = converter.encode(msg);

  console.log(frequencyArray);
  // play([523, 659, 784, 1047], 0.3);
  await playFrequencies(frequencyArray, 0.4);
}

export default playMessage;

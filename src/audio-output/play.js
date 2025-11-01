import * as Tone from 'tone';

function play(frequencyArray, durationPerNote) {
  // Create a synth and connect it to the main output (speakers)
  const synth = new Tone.Synth().toDestination();

  // Initialize the starting time for the first note
  let startTime = Tone.now();

  // Iterate over each frequency in the provided array
  frequencyArray.forEach(frequency => {
    // Schedule the note to start at the current 'startTime'
    // Arguments: (note/frequency, duration, time)
    synth.triggerAttackRelease(frequency, durationPerNote, startTime);

    // Increment the startTime by the duration of the note just scheduled.
    // This ensures the next note starts exactly when the previous one ends (or should release).
    startTime += durationPerNote;
  });

  // Note: For scheduling to work reliably, ensure Tone.start() has been called
  // at some point when the user first interacts with the page (e.g., in a button click handler).
}

export default play;

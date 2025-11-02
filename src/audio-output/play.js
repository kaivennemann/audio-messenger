import { convertFromTextToHz } from '../conversion/convert.js';
import { AudioTonePlayer } from '../conversion/player';

async function playMessage(
  message,
  toneDuration = 200,
  toneGap = 50,
  volume = 0.3
) {
  const frequencies = convertFromTextToHz(message);
  console.log('Frequencies to play:', frequencies);

  const player = new AudioTonePlayer({
    toneDuration: toneDuration,
    toneGap: toneGap,
    volume: volume,
  });
  await player.initialize();

  await player.playSequence(frequencies);
}

export default playMessage;

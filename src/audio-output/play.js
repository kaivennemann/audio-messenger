import { convertFromTextToHz } from '../conversion/convert.js';
import { AudioTonePlayer } from '../conversion/player';
import { CAUCHY } from './../App.js';
async function playMessage(
  message,
  toneDuration = 200,
  toneGap = 50,
  volume = 0.3
) {
  const frequencies = convertFromTextToHz(message, CAUCHY);
  console.log('Frequencies to play:', frequencies);

  const player = new AudioTonePlayer({
    toneDuration: toneDuration,
    toneGap: toneGap,
    volume: volume,
  });
  await player.initialize();
  console.log('awaiting playSequence...');
  await player.playSequence(frequencies);
  console.log('played sequence.');
}

export default playMessage;

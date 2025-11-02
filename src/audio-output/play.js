import { convertFromTextToHz } from '../conversion/convert.js';
import { AudioTonePlayer } from '../conversion/player';
import { MessageCodec } from '../reliability/codec.js';

// Global codec instance
const codec = new MessageCodec(8, 4); // 8 data symbols, 4 redundant

async function playMessage(
  message,
  toneDuration = 200,
  toneGap = 50,
  volume = 0.3,
  useErasureCoding = true
) {
  // Encode message with erasure coding if enabled
  const messageToSend = useErasureCoding ? codec.encode(message) : message;

  console.log('Original message:', message);
  console.log('Encoded message:', messageToSend);
  console.log('Encoding overhead:', ((messageToSend.length / message.length - 1) * 100).toFixed(1) + '%');

  const frequencies = convertFromTextToHz(messageToSend);
  console.log('Frequencies to play:', frequencies);

  const player = new AudioTonePlayer({
    toneDuration: toneDuration,
    toneGap: toneGap,
    volume: volume,
  });
  await player.initialize();
  console.log("awaiting playSequence...")
  await player.playSequence(frequencies);
  console.log("played sequence.")
}

export default playMessage;
export { codec };

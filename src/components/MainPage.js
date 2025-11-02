import React, { useState } from 'react';
import { InputBar, LoadingMessage, Message, MessageStack } from './';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
// import AudioDistribution from './AudioDistribution';

let audioMotion = null;

function initializeAudioVisualizer(audioListener) {
  if (audioMotion == null) {
    const el = document.getElementById('container');
    if (el !== null) {
      audioMotion = new AudioMotionAnalyzer(
        document.getElementById('container'),
        {
          gradient: 'steelblue',
          showScaleX: false,
          showBgColor: true,
          overlay: true,
          bgAlpha: 0.0,
          // width: 200,
          height: 800,
          linearAmplitude: true,
          linearBoost: 10,
          minDecibels: -110,
          minFreq: 2500,
          maxFreq: 8500,
        }
      );
      audioMotion.connectInput(
        audioMotion.audioCtx.createMediaStreamSource(audioListener.mediaStream)
      );
    }
  }
}

const MainPage = ({
  username,
  messagingState,
  messages,
  playSound,
  incomingMessage,
  audioListener,
}) => {
  const [alphabet, setAlphabet] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+() '
  );

  function sendMessage(msg) {
    // TODO: send message somewhere
    playSound(msg);
  }
  console.log(messagingState);

  initializeAudioVisualizer(audioListener);

  return (
    <div>
      <div className="main-page">
        <MessageStack
          messages={messages}
          loading={messagingState === 1}
          incomingMessage={incomingMessage}
        />
        <InputBar onSend={sendMessage} alphabet={alphabet} />
      </div>
      <div id="container" className="audio-visualizer"></div>
    </div>
  );
};

export { MainPage };

import React, { useState } from 'react';
import { InputBar, LoadingMessage, Message, MessageStack } from './';

const MainPage = ({
  username,
  messagingState,
  messages,
  playSound,
  incomingMessage
}) => {
  const [alphabet, setAlphabet] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+() '
  );

  function sendMessage(msg) {
    // TODO: send message somewhere
    playSound(msg);
  }
  console.log(messagingState);

  return (
    <div className="main-page">
      <MessageStack messages={messages} loading={messagingState === 1} incomingMessage={incomingMessage} />

      <InputBar onSend={sendMessage} alphabet={alphabet} />
    </div>
  );
};

export { MainPage };

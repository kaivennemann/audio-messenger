import React, { useState } from 'react';
import { InputBar, LoadingMessage, Message, MessageStack } from './';

const MainPage = ({
  username,
  messagingState,
  messages,
  playSound,
  addCharacter,
}) => {
  const [alphabet, setAlphabet] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+() '
  );

  function sendMessage(msg) {
    // TODO: send message somewhere
    playSound(msg);
  }

  return (
    <div className="main-page">
      <MessageStack messages={messages} loading={messagingState !== 0} />
      <InputBar onSend={sendMessage} alphabet={alphabet} />
    </div>
  );
};

export { MainPage };

import React, { useState } from 'react';
import { InputBar, LoadingMessage, Message, MessageStack } from './';

const MainPage = ({
  username,
  messagingState,
  messages,
  sendMessage,
  incomingMessage,
}) => {
  const [alphabet, setAlphabet] = useState(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-+() '
  );


  return (
    <div className="main-page">
      <MessageStack
        messages={messages}
        loading={messagingState === 1}
        incomingMessage={incomingMessage}
      />
      <InputBar onSend={sendMessage} alphabet={alphabet} username={username} />
    </div>
  );
};

export { MainPage };

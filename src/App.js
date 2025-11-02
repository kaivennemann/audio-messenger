import React, { useState, useRef } from 'react';
import { MainPage } from './components';
import { AudioToneListener } from './conversion/listener.js';
import playMessage, { codec } from './audio-output/play.js';

import './styles/App.css';
import './styles/Styles.css';
import WelcomePage from './components/WelcomePage.js';

export default function App() {
  const [showMainPage, setShowMainPage] = useState(false);
  // Initialize once and persist across renders
  const audioListenerRef = useRef(null);

  if (audioListenerRef.current === null) {
    audioListenerRef.current = new AudioToneListener();
  }

  const audioListener = audioListenerRef.current;

  // messaging state: {0: none, 1: transmitting, 2: receiving}
  let [messagingState, setMessagingState] = useState(0);

  const [username, setUsername] = useState('tempUser');
  const [messages, setMessages] = useState([
    {
      id: 0,
      content:
        'Welcome to NoyZChannel, the noisiest messaging channel! Type and send a message to get started.',
      sender: 'System',
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState([]);

  async function sendMessage(msg) {
    if (messagingState !== 0) return;

    setMessagingState(1);
    // NOTE: Adjust the timing parameters here!
    setTimeout(async () => {
      console.log('waited .2 seconds');
      await playMessage(msg, 60, 20);
      setMessagingState(0);
      let msg_id = messages.length;
      setMessages(messages => {
        return [...messages, { id: msg_id, content: msg, sender: username }];
      });
    }, 20);
  }

  function onToken(token) {
    if (messagingState === 1) {
      return;
    }
    console.log('Received token:', token);
    currentMessage.push(token);
    codec.addSymbol(token); // Add to codec for decoding
    if (messagingState === 0) return;

    setCurrentMessage(currentMessage => [...currentMessage, token]);
  }

  function onErasure(position) {
    if (messagingState === 1) {
      return;
    }
    console.log('Erasure at position:', position);
    codec.addErasure(position); // Mark erasure in codec
  }

  function onMessageStart() {
    if (messagingState !== 0) {
      return;
    }
    console.log('Message started');
    currentMessage.length = 0;
    codec.startReceiving(); // Start codec receiving
    setMessagingState(2);
    setCurrentMessage([]);
  }

  function onMessageEnd() {
    if (messagingState !== 2) {
      return;
    }
    console.log('Message ended');

    // Try to decode with erasure correction
    const decodedMessage = codec.finishReceiving();
    setMessagingState(0);
    setCurrentMessage([]);
    if (decodedMessage !== null) {
      console.log('Successfully decoded message:', decodedMessage);
      let msg_id = messages.length;
      setMessages(messages => {
        return [
          ...messages,
          { id: msg_id, content: decodedMessage, sender: 'Remote' },
        ];
      });
    } else {
      // Fallback to raw message if decoding fails
      console.warn('Decoding failed, using raw message');
      const messageStr = currentMessage.join('');
      let msg_id = messages.length;
      setMessages(messages => {
        return [
          ...messages,
          {
            id: msg_id,
            content: messageStr + ' [CORRUPTED]',
            sender: 'Remote',
          },
        ];
      });
    }
  }

  // HACK: HACKY!!
  audioListener.onToken = onToken;
  audioListener.onMessageStart = onMessageStart;
  audioListener.onMessageEnd = onMessageEnd;
  audioListener.onErasure = onErasure; // Add erasure callback

  return (
    <div className="app">
      <div>
        {!showMainPage && (
          <WelcomePage
            setShowMainPage={setShowMainPage}
            setUsername={setUsername}
            audioListener={audioListener}
          />
        )}
        {showMainPage && (
          <div className="app-container">
            <header className="header">
              <h1 className="header-title">NoyZChannel</h1>
            </header>
            <MainPage
              username={username}
              messagingState={messagingState}
              messages={messages}
              playSound={sendMessage}
              incomingMessage={currentMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

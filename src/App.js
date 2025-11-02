import React, { useState, useRef } from 'react';
import { MainPage } from './components';
import { AudioToneListener } from './conversion/listener.js';
import playMessage from './audio-output/play.js';

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
        'Welcome to NoyZChannel, the noisiest messaging channel! Type a message to get started.',
      sender: 'System',
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState([]);
  const [deliminatorReceived, setDeliminatorReceived] = useState(false);
  const [receivedUsername, setReceivedUsername] = useState('');
  async function sendMessage(msg, username) {
    if (messagingState !== 0) return;

    setMessagingState(1);
    // NOTE: Adjust the timing parameters here!
    setTimeout(async () => {
      console.log('waited 20 ms');
      let full_message = username + '%%' + msg;
      await playMessage(full_message, 40, 0);
      setMessagingState(0);
      let msg_id = messages.length;
      setMessages(messages => {
        return [...messages, { id: msg_id, content: msg, sender: 'You' }];
      });
    }, 20);
  }

  function onToken(token) {
    if (messagingState === 1) {
      return;
    }
    console.log('Received token:', token);
    if (messagingState === 0) return;

    if (deliminatorReceived) {
      if (token === '%') return;
      setCurrentMessage(currentMessage => [...currentMessage, token]);
      return;
    }

    if (token === '%') {
      setDeliminatorReceived(true);
      return;
    } else if (currentMessage.length <= 9) {
      setReceivedUsername(s => s + token);
      return;
    }
    // abandon message, sender id compromised
    console.log('abandon message');
    setCurrentMessage([]);
    setMessagingState(0);
    setReceivedUsername('');
    setDeliminatorReceived(false);
  }
  function onMessageStart() {
    if (messagingState !== 0) {
      return;
    }
    console.log('Message started');
    setMessagingState(2);
    setCurrentMessage([]);
  }

  function onMessageEnd() {
    if (messagingState !== 2) {
      return;
    }
    console.log('Message ended');

    setMessagingState(0);
    setDeliminatorReceived(false);
    const messageStr = currentMessage.join('');
    setCurrentMessage([]);
    let msg_id = messages.length;
    if (
      1 <= receivedUsername.length &&
      receivedUsername.length <= 9 &&
      currentMessage.length > 0
    ) {
      setMessages(messages => {
        return [
          ...messages,
          { id: msg_id, content: messageStr, sender: receivedUsername },
        ];
      });
    }

    setReceivedUsername('');
  }

  // HACK: HACKY!!
  audioListener.onToken = onToken;
  audioListener.onMessageStart = onMessageStart;
  audioListener.onMessageEnd = onMessageEnd;

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
              audioListener={audioListener}
              sendMessage={sendMessage}
              incomingMessage={{
                content: currentMessage,
                sender: receivedUsername,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

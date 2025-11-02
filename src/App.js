import React, { useState } from 'react';
import { MainPage } from './components';
import { AudioToneListener } from './conversion/listener.js';
import playMessage from './audio-output/play.js';

import './styles/App.css';
import './styles/Styles.css';
import WelcomePage from './components/WelcomePage.js';

// HACK: If I put this inside the App function, it seems to reinitialize
// every time the component rerenders (which breaks things).
// But that isn't supposed to happen, right?
// @Tom/Kai?
const audioListener = new AudioToneListener();

export default function App() {
  const [showMainPage, setShowMainPage] = useState(false);

  // messaging state: {0: none, 1: transmitting, 2: receiving}
  let [messagingState, setMessagingState] = useState(0);
  const [username, setUsername] = useState('tempUser');
  const [messages, setMessages] = useState([
    {
      id: 0,
      content: 'Hello! This is the first message.',
      sender: 'Alice',
    },
    {
      id: 1,
      content: 'This is a sample message stack component.',
      sender: 'Bob',
    },
    {
      id: 2,
      content: 'Each message is rendered using the Message component.',
      sender: 'Alice',
    },
    {
      id: 3,
      content: 'Hello! This is the first message.',
      sender: 'Alice',
    },
    {
      id: 4,
      content: 'This is a sample message stack component.',
      sender: 'Bob',
    },
    {
      id: 5,
      content: 'Each message is rendered using the Message component.',
      sender: 'Alice',
    },
    {
      id: 6,
      content: 'Hello! This is the first message.',
      sender: 'Alice',
    },
    {
      id: 7,
      content: 'This is a sample message stack component.',
      sender: 'Bob',
    },
    {
      id: 8,
      content: 'Each message is rendered using the Message component.',
      sender: 'Alice',
    },
  ]);

  async function sendMessage(msg) {
    // HACK: Initialize AudioContext on user gesture
    //
    // Otherwise, browsers block audio playback and we get the following error:
    // The AudioContext was not allowed to start. It must be resumed
    // (or created) after a user gesture on the page. https://goo.gl/7K7WLu
    //
    // Tom/Kai: I think you should implement a button that starts the listener
    // and calles this initialize function instead.
    await audioListener.initialize();

    setMessagingState(1);
    // NOTE: Adjust the timing parameters here!
    await playMessage(msg, 60, 20);
    setMessagingState(0);
    let msg_id = messages.length;
    setMessages(messages => {
      return [...messages, { id: msg_id, content: msg, sender: username }];
    });
  }

  const currentMessage = [];

  function onToken(token) {
    if (messagingState === 1) {
      return;
    }
    console.log('Received token:', token);
    currentMessage.push(token);
  }
  function onMessageStart() {
    if (messagingState === 1) {
      return;
    }
    console.log('Message started');
    currentMessage.length = 0;
  }
  function onMessageEnd() {
    if (messagingState === 1) {
      return;
    }
    console.log('Message ended');
    const messageStr = currentMessage.join('');
    let msg_id = messages.length;
    setMessages(messages => {
      return [
        ...messages,
        { id: msg_id, content: messageStr, sender: 'Remote' },
      ];
    });
  }

  // HACK: HACKY!!
  audioListener.onToken = onToken;
  audioListener.onMessageStart = onMessageStart;
  audioListener.onMessageEnd = onMessageEnd;

  return (
    <div className="app">
      <div>
        {!showMainPage && <WelcomePage setShowMainPage={setShowMainPage} />}
        {showMainPage && (
          <div className="app-container">
            <header className="header">
              <h1 className="header-title">HzMessenger</h1>
            </header>
            <MainPage
              username={username}
              messagingState={messagingState}
              messages={messages}
              playSound={sendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { MainPage } from './components';
import { AudioToneListener } from './conversion/listener.js';
import playMessage from './audio-output/play.js';

import './styles/App.css';
import './styles/Styles.css';

// HACK: If I put this inside the App function, it seems to reinitialize
// every time the component rerenders (which breaks things).
// But that isn't supposed to happen, right?
// @Tom/Kai?
const audioListener = new AudioToneListener();

export default function App() {
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
    await playMessage(msg);
    setMessagingState(0);
    let msg_id = messages.length;
    setMessages(messages => {
      return [...messages, { id: msg_id, content: msg, sender: username }];
    });
  }

  function onToken(token) {
    console.log('Received token:', token);
  }
  function onMessageStart() {
    console.log('Message started');
  }
  function onMessageEnd() {
    console.log('Message ended');
  }

  // HACK: HACKY!!
  audioListener.onToken = onToken;
  audioListener.onMessageStart = onMessageStart;
  audioListener.onMessageEnd = onMessageEnd;

  return (
    <div className="app">
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
  );
}

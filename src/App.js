import React, { useState } from 'react';
import { MainPage } from './components';
// import { play } from './audio-output/play.js'

import './styles/App.css';
import './styles/Styles.css';

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
  ]);

  async function playMessage(msg) {
    setMessagingState(1);
    setTimeout(() => {
      console.log('This message is shown after 3 seconds. tomlog');
      setMessagingState(0);
      let msg_id = messages.length;
      setMessages(messages => {
        return [...messages, { id: msg_id, content: msg, sender: username }];
      });
    }, 3000);
  }

  return (
    <div className="app">
      <MainPage
        username={username}
        messagingState={messagingState}
        messages={messages}
        playSound={playMessage}
      />
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { MainPage } from './components';
import { AudioToneListener } from './conversion/listener.js';
import playMessage from './audio-output/play.js';

import './styles/App.css';
import './styles/Styles.css';

export default function App() {

  // Initialize once and persist across renders
  const audioListenerRef = useRef(null);

  if (audioListenerRef.current === null) {
    audioListenerRef.current = new AudioToneListener();
  }

  const audioListener = audioListenerRef.current;

  // messaging state: {0: none, 1: transmitting, 2: receiving}
  let [messagingState, setMessagingState] = useState(0);

  const [username, setUsername] = useState('tempUser');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState([]);

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

    if (messagingState !== 0) return;

    setMessagingState(1);
    // NOTE: Adjust the timing parameters here!
    setTimeout(
      async () => {
        console.log("waited .2 seconds")
        await playMessage(msg, 60, 20);
        setMessagingState(0);
        let msg_id = messages.length;
        setMessages(messages => {
          return [...messages, { id: msg_id, content: msg, sender: username }];
        });
      },
      20
    );

  }

  // useEffect(() => {
  //   // This function runs every time 'var' changes
  //   if (currentMessage = [])

  //   // Your logic here

  // }, [currentMessage]);

  function onToken(token) {
    if (messagingState === 1) {
      return;
    }
    console.log('Received token:', token);
    if (messagingState === 0) return;

    setCurrentMessage(currentMessage => [...currentMessage, token]);
  }
  function onMessageStart() {
    if (messagingState !== 0) {
      return;
    }
    console.log('Message started');
    setMessagingState(2)
    setCurrentMessage([]);
  }
  function onMessageEnd() {
    if (messagingState !== 2) {
      return;
    }
    console.log('Message ended');
    setMessagingState(0);
    const messageStr = currentMessage.join('');
    setCurrentMessage([])
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
      <header className="header">
        <h1 className="header-title">HzMessenger</h1>
      </header>
      <MainPage
        username={username}
        messagingState={messagingState}
        messages={messages}
        playSound={sendMessage}
        incomingMessage={currentMessage}
      />
    </div>
  );
}

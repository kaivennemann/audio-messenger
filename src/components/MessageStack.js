import React, { useEffect, useRef } from 'react';

import { Message, LoadingMessage } from './';

const MessageStack = ({ messages, loading, username, incomingMessage }) => {
  const scrollableRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (loading || scrollableRef.current) {
      scrollToBottom();
    }
  }, [messages, loading]); // Triggers when messages array changes or loading state changes

  function animateScroll(element, duration) {
    const start = element.scrollTop;
    const end = element.scrollHeight;
    const change = end - start;
    const increment = 20;

    function easeInOut(currentTime, start, change, duration) {
      currentTime /= duration / 2;
      if (currentTime < 1) {
        return (change / 2) * currentTime * currentTime + start;
      }
      currentTime -= 1;
      return (-change / 2) * (currentTime * (currentTime - 2) - 1) + start;
    }

    function animate(elapsedTime) {
      elapsedTime += increment;
      const position = easeInOut(elapsedTime, start, change, duration);
      element.scrollTop = position;
      if (elapsedTime < duration) {
        setTimeout(() => {
          animate(elapsedTime);
        }, increment);
      }
    }

    animate(0);
  }

  function scrollToBottom() {
    const duration = 300;
    animateScroll(scrollableRef.current, duration);
  }

  return (
    <div className="message-stack" ref={scrollableRef}>
      {messages.length === 0 ? (
        <div className="empty-state">No messages yet</div>
      ) : (
        messages.map(message => (
          <Message
            key={message.id}
            content={message.content}
            sender={message.sender}
          />
        ))
      )}

      {loading ? <LoadingMessage /> : ''}
      {incomingMessage.content.length === 0 ? (
        ''
      ) : (
        <Message
          content={incomingMessage.content.join('')}
          sender={incomingMessage.sender}
        />
      )}
    </div>
  );
};

export { MessageStack };

import React from 'react';
import { Message } from './Message.js';
import './LoadingMessage.css';

const LoadingMessage = () => {
  return (
    <div className="loading-shimmer" aria-live="polite">
      <Message content="Sending..." sender="You" />
      <span className="shimmer-overlay" aria-hidden="true" />
    </div>
  );
};

export { LoadingMessage };

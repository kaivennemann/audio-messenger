import React, { useState } from 'react';
import '../styles/WelcomePage.css';

const WelcomePage = ({ setShowMainPage, setUsername, audioListener }) => {
  const [leaving, setLeaving] = useState(false);
  const [name, setName] = useState('');

  const handleJoin = async () => {
    await audioListener.initialize();

    const trimmed = name.trim();
    if (!trimmed) return;
    setLeaving(true);
    // match the welcome-container transition duration (320ms) + small buffer
    setTimeout(() => {
      setUsername(trimmed);
      setShowMainPage(true);
    }, 130);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className={`welcome-container ${leaving ? 'leaving' : ''}`}>
      <h1 className="welcome-title">
        Welcome to <span className="highlight">NoyZChannel</span>
      </h1>

      <input
        className="name-input"
        type="text"
        value={name}
        onChange={e => {
          // enforce max 10 chars (prevent longer input)
          setName(e.target.value.slice(0, 9));
        }}
        onKeyDown={handleKeyDown}
        placeholder="Enter your name"
        autoFocus
        aria-label="Display name"
      />

      <button
        className="join-button"
        onClick={handleJoin}
        disabled={!name.trim()}
      >
        Connect
      </button>

      <p className="welcome-subtitle">Ready to connect to the NoyZNetwork.</p>
    </div>
  );
};

export default WelcomePage;

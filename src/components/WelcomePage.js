import React, { useState } from 'react';

const WelcomePage = ({ setShowMainPage }) => {
  const [leaving, setLeaving] = useState(false);

  const handleLaunch = () => {
    // start exit animation, then show main page after it completes
    setLeaving(true);
    // match the welcome-container transition duration (600ms) + small buffer
    setTimeout(() => setShowMainPage(true), 640);
  };

  return (
    <div className={`welcome-container ${leaving ? 'leaving' : ''}`}>
      <h1 className="welcome-title">
        Welcome to <span className="highlight">NoyZChannel</span>
      </h1>

      <button className="launch-button" onClick={handleLaunch}>
        Init
      </button>

      <p className="welcome-subtitle">Ready to connect to the NoyZNetwork.</p>
    </div>
  );
};

export default WelcomePage;

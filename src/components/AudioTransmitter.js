import React, { useState, useRef } from 'react';
import { convertFromTextToHz } from '../conversion/convert';
import { AudioTonePlayer } from '../conversion/player';

export default function AudioTransmitter() {
  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalTones, setTotalTones] = useState(0);
  const [toneDuration, setToneDuration] = useState(200);
  const [toneGap, setToneGap] = useState(50);

  const playerRef = useRef(null);

  const handlePlay = async () => {
    if (!message.trim()) {
      alert('Please enter a message to send');
      return;
    }

    try {
      // Convert message to frequencies
      const frequencies = convertFromTextToHz(message);
      console.log('Frequencies to play:', frequencies);

      setTotalTones(frequencies.length);
      setProgress(0);
      setIsPlaying(true);

      // Create player with current settings
      playerRef.current = new AudioTonePlayer({
        toneDuration: toneDuration,
        toneGap: toneGap,
        volume: 0.3,
      });

      await playerRef.current.initialize();

      const onProgress = (current, total) => {
        setProgress(current);
      };

      const onComplete = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      // Play based on selected mode
      await playerRef.current.playSequence(frequencies, onProgress, onComplete);
    } catch (error) {
      console.error('Error playing message:', error);
      alert('Error: ' + error.message);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const getEstimatedDuration = () => {
    if (!message.trim()) return 0;
    try {
      const frequencies = convertFromTextToHz(message);
      let toneCount = frequencies.length;

      return (toneCount * (toneDuration + toneGap)) / 1000;
    } catch {
      return 0;
    }
  };

  return (
    <div className="audio-transmitter">
      <style>{`
        .audio-transmitter {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 30px;
          max-width: 600px;
          margin: 20px auto;
        }

        .transmitter-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .transmitter-header h2 {
          font-size: 1.8em;
          color: #333;
          margin-bottom: 5px;
        }

        .transmitter-header .subtitle {
          color: #666;
          font-size: 0.95em;
        }

        .input-section {
          margin-bottom: 20px;
        }

        .message-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 1em;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.3s;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .char-count {
          text-align: right;
          font-size: 0.85em;
          color: #999;
          margin-top: 5px;
        }

        .settings-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .settings-title {
          font-size: 1em;
          font-weight: 600;
          color: #333;
          margin-bottom: 15px;
        }

        .setting-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .setting-item {
          display: flex;
          flex-direction: column;
        }

        .setting-label {
          font-size: 0.85em;
          color: #666;
          margin-bottom: 5px;
        }

        .setting-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95em;
        }

        .mode-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .mode-button {
          flex: 1;
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.9em;
        }

        .mode-button:hover {
          border-color: #667eea;
        }

        .mode-button.active {
          border-color: #667eea;
          background: #667eea;
          color: white;
          font-weight: 600;
        }

        .control-section {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .control-button {
          flex: 1;
          padding: 15px;
          border: none;
          border-radius: 10px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .control-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .control-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .play-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stop-button {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .progress-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .progress-label {
          font-size: 0.85em;
          color: #666;
          margin-bottom: 8px;
        }

        .progress-bar {
          background: #e0e0e0;
          border-radius: 10px;
          height: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
          border-radius: 10px;
        }

        .progress-text {
          font-size: 0.85em;
          color: #666;
          text-align: center;
        }

        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-card {
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }

        .info-card-label {
          font-size: 0.8em;
          color: #555;
          margin-bottom: 4px;
        }

        .info-card-value {
          font-size: 1.2em;
          font-weight: bold;
          color: #333;
        }

        .mode-description {
          font-size: 0.85em;
          color: #666;
          background: #fff3cd;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
      `}</style>

      <div className="transmitter-header">
        <h2>Audio Transmitter</h2>
        <p className="subtitle">Convert text to audio tones and broadcast</p>
      </div>

      <div className="input-section">
        <textarea
          className="message-input"
          placeholder="Type your message here..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={isPlaying}
        />
        <div className="char-count">{message.length} characters</div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Transmission Mode</div>

        <div className="settings-title" style={{ marginTop: '15px' }}>
          Timing Settings
        </div>
        <div className="setting-row">
          <div className="setting-item">
            <label className="setting-label">Tone Duration (ms)</label>
            <input
              type="number"
              className="setting-input"
              value={toneDuration}
              onChange={e => setToneDuration(parseInt(e.target.value) || 200)}
              min="50"
              max="1000"
              step="50"
              disabled={isPlaying}
            />
          </div>
          <div className="setting-item">
            <label className="setting-label">Gap Duration (ms)</label>
            <input
              type="number"
              className="setting-input"
              value={toneGap}
              onChange={e => setToneGap(parseInt(e.target.value) || 50)}
              min="10"
              max="500"
              step="10"
              disabled={isPlaying}
            />
          </div>
        </div>
      </div>

      <div className="control-section">
        <button
          className="control-button play-button"
          onClick={handlePlay}
          disabled={isPlaying || !message.trim()}
        >
          {isPlaying ? 'Playing...' : 'Play Message'}
        </button>
        <button
          className="control-button stop-button"
          onClick={handleStop}
          disabled={!isPlaying}
        >
          Stop
        </button>
      </div>

      {isPlaying && (
        <div className="progress-section">
          <div className="progress-label">Transmission Progress</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress / totalTones) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            {progress} / {totalTones} tones
          </div>
        </div>
      )}

      <div className="info-section">
        <div className="info-card">
          <div className="info-card-label">Estimated Duration</div>
          <div className="info-card-value">
            {getEstimatedDuration().toFixed(1)}s
          </div>
        </div>
        <div className="info-card">
          <div className="info-card-label">Total Tones</div>
          <div className="info-card-value">
            {message.trim()
              ? (() => {
                  try {
                    let count = convertFromTextToHz(message).length;
                    return count;
                  } catch {
                    return 0;
                  }
                })()
              : 0}
          </div>
        </div>
      </div>
    </div>
  );
}

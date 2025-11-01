import React, { useState, useRef } from 'react';
import { convertFromTextToHz } from '../conversion/parser/basic.js';
import { getSchema, getConfig } from '../conversion/parser/schemas.js';
import { AudioTonePlayer } from '../conversion/player.js';

export default function VoiceTransmitter({ schemaType = 'voice' }) {
  const schema = getSchema(schemaType);
  const config = getConfig(schemaType);

  const [message, setMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalTones, setTotalTones] = useState(0);
  const [playbackMode, setPlaybackMode] = useState('basic');
  const [toneDuration, setToneDuration] = useState(config.TONE_DURATION_MS);
  const [toneGap, setToneGap] = useState(config.TONE_GAP_MS);

  const playerRef = useRef(null);

  const handlePlay = async () => {
    if (!message.trim()) {
      alert('Please enter a message to send');
      return;
    }

    try {
      const frequencies = convertFromTextToHz(schema, message);
      console.log(`${schemaType} frequencies to play:`, frequencies);

      setTotalTones(frequencies.length);
      setProgress(0);
      setIsPlaying(true);

      if (!playerRef.current) {
        playerRef.current = new AudioTonePlayer({
          toneDuration,
          toneGap,
          volume: 0.3,
          validHz: schema.valid_hz,
        });
      } else {
        playerRef.current.toneDuration = toneDuration;
        playerRef.current.toneGap = toneGap;
      }

      const onProgress = (current, total) => {
        setProgress(Math.round((current / total) * 100));
      };

      const onComplete = () => {
        setIsPlaying(false);
        setProgress(100);
      };

      switch (playbackMode) {
        default:
          await playerRef.current.playSequence(
            frequencies,
            onProgress,
            onComplete
          );
      }
    } catch (error) {
      console.error('Playback error:', error);
      alert(`Error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const getTransmissionInfo = () => {
    if (!message) return 0;
    try {
      const baseFreqs = convertFromTextToHz(schema, message);
      switch (playbackMode) {
        case 'repeat':
          return baseFreqs.length * 2;
        case 'crc':
          return baseFreqs.length + 2;
        case 'ecc':
          return baseFreqs.length * 3 + 2;
        default:
          return baseFreqs.length;
      }
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

        .transmitter-header .badge {
          display: inline-block;
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #333;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
          margin-top: 8px;
        }

        .input-section {
          margin-bottom: 25px;
        }

        .message-input {
          width: 100%;
          min-height: 100px;
          padding: 15px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1em;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.3s;
        }

        .message-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .controls-section {
          margin-bottom: 20px;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-label {
          font-size: 0.9em;
          font-weight: 600;
          color: #555;
          margin-bottom: 8px;
          display: block;
        }

        .mode-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .mode-button {
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-size: 0.9em;
          font-weight: 600;
          transition: all 0.3s;
        }

        .mode-button:hover {
          border-color: #667eea;
          transform: translateY(-2px);
        }

        .mode-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .slider-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .slider-item {
          display: flex;
          flex-direction: column;
        }

        .slider-item input {
          margin-top: 5px;
        }

        .slider-value {
          font-size: 0.85em;
          color: #667eea;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .play-button,
        .stop-button {
          flex: 1;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-size: 1.1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .play-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .play-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        }

        .play-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          transform: none;
        }

        .stop-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .stop-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
        }

        .progress-section {
          margin-top: 20px;
        }

        .progress-bar {
          background: #e0e0e0;
          height: 8px;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
          border-radius: 10px;
        }

        .info-display {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 15px;
        }

        .info-card {
          background: #f9fafb;
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }

        .info-label {
          font-size: 0.75em;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 1.2em;
          font-weight: 700;
          color: #333;
        }
      `}</style>

      <div className="transmitter-header">
        <h2>{config.name} Transmitter</h2>
        <p className="subtitle">
          {config.range} • {config.description}
        </p>
        <span className="badge">
          {config.icon} {config.name}
        </span>
      </div>

      <div className="input-section">
        <textarea
          className="message-input"
          placeholder="Enter your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={isPlaying}
        />
      </div>

      <div className="controls-section">
        {/* <div className="control-group">
          <label className="control-label">Transmission Mode</label>
          <div className="mode-selector">
            <button
              className={`mode-button ${playbackMode === 'basic' ? 'active' : ''}`}
              onClick={() => setPlaybackMode('basic')}
              disabled={isPlaying}
            >
              📡 Basic
            </button>
            <button
              className={`mode-button ${playbackMode === 'repeat' ? 'active' : ''}`}
              onClick={() => setPlaybackMode('repeat')}
              disabled={isPlaying}
            >
              🔁 Repeat (2x)
            </button>
          </div>
        </div> */}

        <div className="control-group">
          <label className="control-label">Timing (ms)</label>
          <div className="slider-group">
            <div className="slider-item">
              <label>
                Tone Duration:{' '}
                <span className="slider-value">{toneDuration}ms</span>
              </label>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={toneDuration}
                onChange={e => setToneDuration(Number(e.target.value))}
                disabled={isPlaying}
              />
            </div>
            <div className="slider-item">
              <label>
                Tone Gap: <span className="slider-value">{toneGap}ms</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={toneGap}
                onChange={e => setToneGap(Number(e.target.value))}
                disabled={isPlaying}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="play-button"
          onClick={handlePlay}
          disabled={isPlaying || !message.trim()}
        >
          {isPlaying ? '⏳ Playing...' : '▶️ Play'}
        </button>
        {isPlaying && (
          <button className="stop-button" onClick={handleStop}>
            ⏹️ Stop
          </button>
        )}
      </div>

      {(isPlaying || progress > 0) && (
        <div className="progress-section">
          <div className="control-label">Progress: {progress}%</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="info-display">
            <div className="info-card">
              <div className="info-label">Total Tones</div>
              <div className="info-value">{totalTones}</div>
            </div>
            <div className="info-card">
              <div className="info-label">Est. Time</div>
              <div className="info-value">
                {((totalTones * (toneDuration + toneGap)) / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        </div>
      )}

      {message && !isPlaying && (
        <div className="info-display" style={{ marginTop: '10px' }}>
          <div className="info-card">
            <div className="info-label">Message Length</div>
            <div className="info-value">{message.length}</div>
          </div>
          <div className="info-card">
            <div className="info-label">Tones to Send</div>
            <div className="info-value">{getTransmissionInfo()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

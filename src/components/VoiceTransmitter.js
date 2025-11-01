import React, { useState, useRef } from 'react';
import { convertTextToVoiceHz, VOICE_CONFIG, voiceSchema } from '../conversion/parser/voice';
import { convertTextToUltrasonicHz, ULTRASONIC_CONFIG, ultrasonicSchema } from '../conversion/parser/ultrasonic';
import { EnhancedAudioPlayer } from '../conversion/player';

export default function VoiceTransmitter({ schemaType = 'voice' }) {
  const isUltrasonic = schemaType === 'ultrasonic';
  const config = isUltrasonic ? ULTRASONIC_CONFIG : VOICE_CONFIG;
  const convertFunction = isUltrasonic ? convertTextToUltrasonicHz : convertTextToVoiceHz;
  const validHz = isUltrasonic ? ultrasonicSchema.valid_hz : voiceSchema.valid_hz;

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
      const frequencies = convertFunction(message);
      console.log(`${schemaType} frequencies to play:`, frequencies);

      setTotalTones(frequencies.length);
      setProgress(0);
      setIsPlaying(true);

      playerRef.current = new EnhancedAudioPlayer({
        toneDuration: toneDuration,
        toneGap: toneGap,
        volume: 0.3,
        validHz: validHz,
      });

      await playerRef.current.initialize();

      const onProgress = (current, total) => {
        setProgress(current);
      };

      const onComplete = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      if (playbackMode === 'basic') {
        await playerRef.current.playSequence(frequencies, onProgress, onComplete);
      } else if (playbackMode === 'repeat') {
        await playerRef.current.playWithRepetition(frequencies, 2, onProgress, onComplete);
      } else if (playbackMode === 'checksum') {
        await playerRef.current.playWithChecksum(frequencies, onProgress, onComplete);
      } else if (playbackMode === 'ecc') {
        await playerRef.current.playWithErrorCorrection(
          frequencies,
          { repetitions: 3, addCRC: true, interleave: true },
          onProgress,
          onComplete
        );
      }
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
      const frequencies = convertFunction(message);
      let toneCount = frequencies.length;

      if (playbackMode === 'repeat') {
        toneCount *= 2;
      } else if (playbackMode === 'checksum') {
        toneCount += 1;
      }

      return (toneCount * (toneDuration + toneGap)) / 1000;
    } catch {
      return 0;
    }
  };

  const schemaLabel = isUltrasonic ? 'Ultrasonic' : 'Voice-Optimized';
  const schemaRange = isUltrasonic ? '8000-17000 Hz' : '300-3500 Hz';
  const schemaIcon = isUltrasonic ? '🚀' : '🎤';

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
          border-color: #10b981;
        }

        .char-count {
          text-align: right;
          font-size: 0.85em;
          color: #999;
          margin-top: 5px;
        }

        .settings-section {
          background: #f0fdf4;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid #d1fae5;
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
          border: 1px solid #d1fae5;
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
          border-color: #10b981;
        }

        .mode-button.active {
          border-color: #10b981;
          background: #10b981;
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .stop-button {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .progress-section {
          background: #f0fdf4;
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
          background: #d1fae5;
          border-radius: 10px;
          height: 10px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
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
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
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
          color: #065f46;
          background: #d1fae5;
          padding: 10px;
          border-radius: 6px;
          margin-top: 10px;
        }
      `}</style>

      <div className="transmitter-header">
        <h2>{schemaLabel} Transmitter</h2>
        <p className="subtitle">{schemaRange} • {isUltrasonic ? 'No voice interference' : 'Speech-friendly'}</p>
        <span className="badge">{schemaIcon} {schemaLabel}</span>
      </div>

      <div className="input-section">
        <textarea
          className="message-input"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isPlaying}
        />
        <div className="char-count">{message.length} characters</div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Transmission Mode</div>
        <div className="mode-selector">
          <button
            className={`mode-button ${playbackMode === 'basic' ? 'active' : ''}`}
            onClick={() => setPlaybackMode('basic')}
            disabled={isPlaying}
          >
            Basic
          </button>
          <button
            className={`mode-button ${playbackMode === 'repeat' ? 'active' : ''}`}
            onClick={() => setPlaybackMode('repeat')}
            disabled={isPlaying}
          >
            Repeat (2x)
          </button>
          <button
            className={`mode-button ${playbackMode === 'checksum' ? 'active' : ''}`}
            onClick={() => setPlaybackMode('checksum')}
            disabled={isPlaying}
          >
            CRC16
          </button>
          <button
            className={`mode-button ${playbackMode === 'ecc' ? 'active' : ''}`}
            onClick={() => setPlaybackMode('ecc')}
            disabled={isPlaying}
          >
            🛡️ ECC
          </button>
        </div>

        {playbackMode === 'basic' && (
          <div className="mode-description">
            ⚡ Fast transmission - Use in quiet environments
          </div>
        )}
        {playbackMode === 'repeat' && (
          <div className="mode-description">
            🔁 Repetition code - Each tone 2x for reliability (2x duration)
          </div>
        )}
        {playbackMode === 'checksum' && (
          <div className="mode-description">
            ✓ CRC16 checksum - Validates data integrity with 2 extra tones
          </div>
        )}
        {playbackMode === 'ecc' && (
          <div className="mode-description">
            🛡️ Full error correction - 3x repetition + CRC16 + interleaving. Best reliability! (3x duration)
          </div>
        )}

        <div className="settings-title" style={{ marginTop: '15px' }}>
          Timing Settings (Voice-Optimized Defaults)
        </div>
        <div className="setting-row">
          <div className="setting-item">
            <label className="setting-label">Tone Duration (ms)</label>
            <input
              type="number"
              className="setting-input"
              value={toneDuration}
              onChange={(e) => setToneDuration(parseInt(e.target.value) || 250)}
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
              onChange={(e) => setToneGap(parseInt(e.target.value) || 40)}
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
          <div className="info-card-value">{getEstimatedDuration().toFixed(1)}s</div>
        </div>
        <div className="info-card">
          <div className="info-card-label">Total Tones</div>
          <div className="info-card-value">
            {message.trim()
              ? (() => {
                  try {
                    let count = convertFunction(message).length;
                    if (playbackMode === 'repeat') count *= 2;
                    if (playbackMode === 'checksum') count += 1;
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

import React, { useState, useEffect, useRef } from 'react';
import {
  findClosestValidFrequency,
  convertFromHzToText,
  processFrequencyDetections,
} from '../conversion/parser/basic.js';
import { getSchema, getConfig } from '../conversion/parser/schemas.js';

export default function VoiceReceiver({
  onMessageReceived,
  schemaType = 'voice',
}) {
  const schema = getSchema(schemaType);
  const config = getConfig(schemaType);

  const [isRecording, setIsRecording] = useState(false);
  const [peakFreq, setPeakFreq] = useState(null);
  const [validFreq, setValidFreq] = useState(null);
  const [peakAmp, setPeakAmp] = useState(0);
  const [detectedMessage, setDetectedMessage] = useState('');
  const [detectionBuffer, setDetectionBuffer] = useState([]);
  const [decodingMode, setDecodingMode] = useState('auto');
  const [eccStatus, setEccStatus] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  const detectionsRef = useRef([]);
  const startTimeRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();

      analyser.fftSize = config.fftSize;
      analyser.smoothingTimeConstant = 0.3;

      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;

      detectionsRef.current = [];
      startTimeRef.current = Date.now();
      setDetectionBuffer([]);
      setDetectedMessage('');
      setEccStatus(null);

      setIsRecording(true);
      detectPeakFrequency();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Process all detections
    if (detectionsRef.current.length > 0) {
      let frequencies = processFrequencyDetections(
        schema,
        config,
        detectionsRef.current
      );
      let message = '';
      let status = null;

      message = convertFromHzToText(schema, frequencies);

      if (message) {
        setDetectedMessage(message);
        setEccStatus(status);
      } else {
        setDetectedMessage('[No message detected]');
        setEccStatus(null);
      }

      if (onMessageReceived && message) {
        onMessageReceived(message);
      }

      console.log(`Processed ${schemaType} frequencies:`, frequencies);
      console.log('Decoded message:', message);
      if (status) {
        console.log('ECC Status:', status);
      }
    } else {
      setDetectedMessage('[No valid tones detected]');
      setEccStatus(null);
    }

    setIsRecording(false);
    setPeakFreq(null);
    setValidFreq(null);
    setPeakAmp(0);
  };

  const detectPeakFrequency = () => {
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detect = () => {
      analyser.getByteFrequencyData(dataArray);

      const sampleRate = audioContextRef.current.sampleRate;
      const binWidth = sampleRate / analyser.fftSize;

      // Use config values for frequency range
      const minBin = Math.floor(config.minFreq / binWidth);
      const maxBin = Math.ceil(config.maxFreq / binWidth);

      let maxAmplitude = 0;
      let peakBin = minBin;

      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        if (dataArray[i] > maxAmplitude) {
          maxAmplitude = dataArray[i];
          peakBin = i;
        }
      }

      const frequency = peakBin * binWidth;
      const timestamp = Date.now() - startTimeRef.current;

      // Store detection with timestamp
      detectionsRef.current.push({
        frequency: frequency,
        amplitude: maxAmplitude,
        timestamp: timestamp,
      });

      // Find closest valid frequency
      const closestValid = findClosestValidFrequency(
        schema,
        frequency,
        config.FREQUENCY_TOLERANCE_PERCENT
      );

      // Update UI
      setPeakFreq(frequency.toFixed(2));
      setValidFreq(closestValid);
      setPeakAmp(maxAmplitude);

      // Update detection buffer for visualization
      if (
        closestValid !== null &&
        maxAmplitude >= config.MIN_AMPLITUDE_THRESHOLD
      ) {
        setDetectionBuffer(prev => {
          const newBuffer = [...prev, closestValid];
          return newBuffer.slice(-20);
        });
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const clearMessage = () => {
    setDetectedMessage('');
    setEccStatus(null);
  };

  return (
    <div className="voice-receiver">
      <style>{`
        .voice-receiver {
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 30px;
          max-width: 600px;
          margin: 20px auto;
        }

        .receiver-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .receiver-header h2 {
          font-size: 1.8em;
          color: #333;
          margin-bottom: 5px;
        }

        .receiver-header .subtitle {
          color: #666;
          font-size: 0.95em;
        }

        .receiver-header .badge {
          display: inline-block;
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #333;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
          margin-top: 8px;
        }

        .button-container {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .mic-button {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .mic-button:hover {
          transform: scale(1.05);
        }

        .mic-button.start {
          background: #10b981;
        }

        .mic-button.stop {
          background: #ef4444;
          animation: pulse 2s infinite;
        }

        .mic-button.clear {
          background: #94a3b8;
        }

        .mic-button.clear:hover {
          background: #64748b;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.8); }
        }

        .mic-icon {
          width: 30px;
          height: 30px;
          fill: white;
        }

        .detection-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-card {
          background: #f9fafb;
          padding: 15px;
          border-radius: 12px;
        }

        .info-card.primary {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
        }

        .info-card.success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        }

        .info-label {
          font-size: 0.75em;
          color: #666;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 1.5em;
          font-weight: 700;
          color: #333;
        }

        .info-value.small {
          font-size: 1.1em;
        }

        .buffer-display {
          background: #f9fafb;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .buffer-label {
          font-size: 0.85em;
          color: #666;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .buffer-content {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .buffer-item {
          background: #667eea;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75em;
          font-weight: 600;
        }

        .message-display {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 2px solid #fbbf24;
        }

        .message-label {
          font-size: 0.85em;
          color: #92400e;
          font-weight: 600;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .message-text {
          font-size: 1.3em;
          font-weight: 700;
          color: #1f2937;
          word-wrap: break-word;
          font-family: monospace;
          background: white;
          padding: 15px;
          border-radius: 8px;
        }

        .decoding-mode-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .mode-option {
          padding: 10px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 0.85em;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s;
        }

        .mode-option:hover {
          border-color: #667eea;
        }

        .mode-option.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .ecc-status {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          margin-top: 10px;
        }

        .status-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75em;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.valid {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.invalid {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.corrected {
          background: #fef3c7;
          color: #92400e;
        }

        .amplitude-bar {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          height: 8px;
          margin-top: 8px;
          overflow: hidden;
        }

        .amplitude-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          transition: width 0.1s;
          border-radius: 10px;
        }
      `}</style>

      <div className="receiver-header">
        <h2>{config.name} Receiver</h2>
        <p className="subtitle">
          {config.range} • {config.description}
        </p>
        <span className="badge">
          {config.icon} {config.name}
        </span>
      </div>

      <div className="button-container">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`mic-button ${isRecording ? 'stop' : 'start'}`}
          title={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <svg
            className="mic-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {isRecording ? (
              <rect x="6" y="6" width="12" height="12" />
            ) : (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </>
            )}
          </svg>
        </button>
        {detectedMessage && !isRecording && (
          <button
            onClick={clearMessage}
            className="mic-button clear"
            title="Clear message"
          >
            <svg
              className="mic-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="detection-info">
          <div className="info-card primary">
            <div className="info-label">Detected Frequency</div>
            <div className="info-value small">
              {peakFreq ? `${peakFreq} Hz` : '---'}
            </div>
          </div>

          <div className="info-card success">
            <div className="info-label">Matched Freq</div>
            <div className="info-value small">
              {validFreq ? `${validFreq} Hz` : 'None'}
            </div>
          </div>

          <div className="info-card" style={{ gridColumn: '1 / -1' }}>
            <div className="info-label">
              Amplitude (min: {config.MIN_AMPLITUDE_THRESHOLD})
            </div>
            <div className="info-value small">{peakAmp} / 255</div>
            <div className="amplitude-bar">
              <div
                className="amplitude-fill"
                style={{ width: `${(peakAmp / 255) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {isRecording && detectionBuffer.length > 0 && (
        <div className="buffer-display">
          <div className="buffer-label">Recent Valid Detections (last 20)</div>
          <div className="buffer-content">
            {detectionBuffer.map((freq, idx) => (
              <span key={idx} className="buffer-item">
                {freq} Hz
              </span>
            ))}
          </div>
        </div>
      )}

      {!isRecording && (
        <div className="decoding-mode-selector">
          <button
            className={`mode-option ${decodingMode === 'auto' ? 'active' : ''}`}
            onClick={() => setDecodingMode('auto')}
          >
            🔄 Auto
          </button>
          <button
            className={`mode-option ${decodingMode === 'ecc' ? 'active' : ''}`}
            onClick={() => setDecodingMode('ecc')}
          >
            🛡️ ECC Only
          </button>
          <button
            className={`mode-option ${decodingMode === 'basic' ? 'active' : ''}`}
            onClick={() => setDecodingMode('basic')}
          >
            📡 Basic
          </button>
        </div>
      )}

      {detectedMessage && (
        <div className="message-display">
          <div className="message-label">📨 Decoded Message</div>
          <div className="message-text">{detectedMessage}</div>

          {eccStatus && (
            <div className="ecc-status">
              <span
                className={`status-badge ${eccStatus.valid ? 'valid' : 'invalid'}`}
              >
                {eccStatus.mode}
              </span>
              {eccStatus.valid && (
                <span className="status-badge valid">✓ CRC Valid</span>
              )}
              {!eccStatus.valid && eccStatus.mode === 'ECC' && (
                <span className="status-badge invalid">✗ CRC Failed</span>
              )}
              {eccStatus.corrected && (
                <span className="status-badge corrected">Errors Corrected</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

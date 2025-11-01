import React, { useState, useEffect, useRef } from 'react';
import {
  findClosestVoiceFrequency,
  processVoiceDetections,
  convertVoiceHzToText,
  VOICE_CONFIG,
  voiceSchema,
} from '../conversion/parser/voice';
import {
  findClosestUltrasonicFrequency,
  processUltrasonicDetections,
  convertUltrasonicHzToText,
  ULTRASONIC_CONFIG,
  ultrasonicSchema,
} from '../conversion/parser/ultrasonic';

export default function VoiceReceiver({ onMessageReceived, schemaType = 'voice' }) {
  const isUltrasonic = schemaType === 'ultrasonic';
  const config = isUltrasonic ? ULTRASONIC_CONFIG : VOICE_CONFIG;
  const findClosestFrequency = isUltrasonic ? findClosestUltrasonicFrequency : findClosestVoiceFrequency;
  const processDetections = isUltrasonic ? processUltrasonicDetections : processVoiceDetections;
  const convertHzToText = isUltrasonic ? convertUltrasonicHzToText : convertVoiceHzToText;
  const validHz = isUltrasonic ? ultrasonicSchema.valid_hz : voiceSchema.valid_hz;

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

      // Very high FFT size for better low-frequency resolution
      analyser.fftSize = 16384;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);

      sourceRef.current = source;
      analyserRef.current = analyser;
      startTimeRef.current = Date.now();
      detectionsRef.current = [];

      setIsRecording(true);
      setDetectedMessage('');
      setDetectionBuffer([]);
      detectPeakFrequency();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone');
    }
  };

  const clearMessage = () => {
    setDetectedMessage('');
    setDetectionBuffer([]);
    detectionsRef.current = [];
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
      let frequencies = processDetections(detectionsRef.current);
      let message = '';
      let status = null;

      // Try error correction decoding if enabled
      if (decodingMode === 'ecc' || decodingMode === 'auto') {
        try {
          const ec = await import('../conversion/errorCorrection.js');

          // Try ECC decoding (deinterleave + remove error correction)
          let decodedFreqs = frequencies;

          // Try deinterleaving
          const deinterleaved = ec.deinterleave(frequencies, 4);

          // Try removing error correction
          const result = ec.removeErrorCorrection(deinterleaved, validHz, {
            repetitions: 3,
            addCRC: true,
            addParity: false,
          });

          if (result.valid) {
            frequencies = result.data;
            status = {
              mode: 'ECC',
              valid: true,
              corrected: result.corrected,
            };
            console.log('✅ ECC decoding successful', result);
          } else if (decodingMode === 'auto') {
            // Fall back to basic decoding
            console.log('⚠️ CRC failed, trying basic decoding');
            status = { mode: 'Basic', valid: false, corrected: false };
          }
        } catch (error) {
          console.warn('ECC decoding failed:', error);
          if (decodingMode === 'auto') {
            status = { mode: 'Basic', valid: null, corrected: false };
          }
        }
      }

      message = convertHzToText(frequencies);

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

      // Focus on appropriate frequency range
      const minFreq = isUltrasonic ? 7500 : 250;
      const maxFreq = isUltrasonic ? 17500 : 3600;
      const minBin = Math.floor(minFreq / binWidth);
      const maxBin = Math.ceil(maxFreq / binWidth);

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
      const closestValid = findClosestFrequency(frequency);

      // Update UI
      setPeakFreq(frequency.toFixed(2));
      setValidFreq(closestValid);
      setPeakAmp(maxAmplitude);

      // Update detection buffer for visualization
      if (closestValid !== null && maxAmplitude >= config.MIN_AMPLITUDE_THRESHOLD) {
        setDetectionBuffer((prev) => {
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

  const schemaLabel = isUltrasonic ? 'Ultrasonic' : 'Voice-Optimized';
  const schemaRange = isUltrasonic ? '8000-17000 Hz' : '300-3500 Hz';
  const schemaIcon = isUltrasonic ? '🚀' : '🎤';

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
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-card {
          background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
          border-radius: 12px;
          padding: 15px;
        }

        .info-card.primary {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }

        .info-card.success {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        }

        .info-label {
          font-size: 0.85em;
          color: #555;
          margin-bottom: 5px;
        }

        .info-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #333;
        }

        .info-value.small {
          font-size: 1.2em;
        }

        .buffer-display {
          background: #f8f9fa;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
          min-height: 60px;
        }

        .buffer-label {
          font-size: 0.85em;
          color: #666;
          margin-bottom: 8px;
        }

        .buffer-content {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .freq-badge {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-family: monospace;
        }

        .message-display {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
          min-height: 80px;
        }

        .message-label {
          font-size: 0.9em;
          color: #555;
          margin-bottom: 10px;
          font-weight: 600;
        }

        .message-content {
          font-size: 1.3em;
          color: #333;
          font-weight: bold;
          word-wrap: break-word;
          font-family: monospace;
        }

        .ecc-status {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }

        .ecc-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8em;
          font-weight: 600;
        }

        .ecc-badge.ecc-valid {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #10b981;
        }

        .ecc-badge.ecc-invalid {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 15px;
          font-size: 0.9em;
          color: #666;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-dot.active {
          background: #10b981;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
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
        <h2>{schemaLabel} Receiver</h2>
        <p className="subtitle">
          {schemaRange} • {isUltrasonic ? 'No voice interference' : 'Speech-optimized'}
        </p>
        <span className="badge">{schemaIcon} {schemaLabel}</span>
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
            <div className="info-value small">{peakFreq ? `${peakFreq} Hz` : '---'}</div>
          </div>

          <div className="info-card success">
            <div className="info-label">Matched Voice Freq</div>
            <div className="info-value small">{validFreq ? `${validFreq} Hz` : 'None'}</div>
          </div>

          <div className="info-card" style={{ gridColumn: '1 / -1' }}>
            <div className="info-label">Amplitude (min: {config.MIN_AMPLITUDE_THRESHOLD})</div>
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
              <span key={idx} className="freq-badge">
                {freq}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="message-display">
        <div className="message-label">Decoded Message:</div>
        <div className="message-content">
          {detectedMessage || (isRecording ? `Listening for ${schemaType} frequencies...` : 'Click microphone to start receiving')}
        </div>
        {eccStatus && (
          <div className="ecc-status">
            {eccStatus.mode === 'ECC' && eccStatus.valid && (
              <span className="ecc-badge ecc-valid">
                ✅ ECC: {eccStatus.corrected ? 'Errors corrected' : 'No errors'}
              </span>
            )}
            {eccStatus.mode === 'Basic' && eccStatus.valid === false && (
              <span className="ecc-badge ecc-invalid">
                ⚠️ CRC failed - using basic decoding
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mode-selector-container" style={{ marginTop: '15px', marginBottom: '15px' }}>
        <div className="mode-label" style={{ fontSize: '0.85em', color: '#666', marginBottom: '8px' }}>
          Decoding Mode:
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`mode-btn ${decodingMode === 'auto' ? 'active' : ''}`}
            onClick={() => setDecodingMode('auto')}
            disabled={isRecording}
            style={{
              flex: 1,
              padding: '8px',
              border: decodingMode === 'auto' ? '2px solid #10b981' : '2px solid #e0e0e0',
              borderRadius: '6px',
              background: decodingMode === 'auto' ? '#d1fae5' : 'white',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
            }}
          >
            🔄 Auto
          </button>
          <button
            className={`mode-btn ${decodingMode === 'ecc' ? 'active' : ''}`}
            onClick={() => setDecodingMode('ecc')}
            disabled={isRecording}
            style={{
              flex: 1,
              padding: '8px',
              border: decodingMode === 'ecc' ? '2px solid #10b981' : '2px solid #e0e0e0',
              borderRadius: '6px',
              background: decodingMode === 'ecc' ? '#d1fae5' : 'white',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
            }}
          >
            🛡️ ECC Only
          </button>
          <button
            className={`mode-btn ${decodingMode === 'basic' ? 'active' : ''}`}
            onClick={() => setDecodingMode('basic')}
            disabled={isRecording}
            style={{
              flex: 1,
              padding: '8px',
              border: decodingMode === 'basic' ? '2px solid #10b981' : '2px solid #e0e0e0',
              borderRadius: '6px',
              background: decodingMode === 'basic' ? '#d1fae5' : 'white',
              cursor: isRecording ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
            }}
          >
            ⚡ Basic
          </button>
        </div>
      </div>

      <div className="status-indicator">
        <div className={`status-dot ${isRecording ? 'active' : ''}`}></div>
        <span>{isRecording ? 'Recording in progress' : detectedMessage ? 'Decoding complete' : 'Ready to receive'}</span>
      </div>
    </div>
  );
}

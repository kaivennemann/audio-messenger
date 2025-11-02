import schema from './schema/basic.json' with { type: 'json' };

import { findClosestValidFrequency } from '../conversion/convert';

const SPECIAL_TOKENS = ['^', '$'];
const START = '^';
const END = '$';
const SPECIAL_LENGTH = 3;

export class AudioToneListener {
  constructor() {
    this.initialized = false;
    this.audioContext = null;
    this.source = null;
    this.analyser = null;
    this.detections = [];

    this.onMessageStart = null;
    this.onMessageEnd = null;
    this.onToken = null;
    this.onErasure = null; // Callback for erasure detection

    // Erasure detection state
    this.isReceivingMessage = false;
    this.symbolPosition = 0;
    this.lastSymbolTime = null;
    this.symbolTimeout = 400; // Expected time per symbol (ms): 200ms tone + 50ms gap + buffer
    this.erasureCheckInterval = null;
    this.consecutiveErasureCount = 0;

    this.current_special = [];
  }

  /**
   * Initialize audio input and analyzer.
   * NOTE: This method must be called immediately after the class is instantiated.
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    console.log(this.initialized);
    this.audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();

    // Higher FFT size for better frequency resolution
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0.3;
    this.source.connect(this.analyser);

    this.detectPeakFrequency();
  }

  detectPeakFrequency() {
    const detect = () => {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      this.analyser.getByteFrequencyData(dataArray);

      const sampleRate = this.audioContext.sampleRate;
      const binWidth = sampleRate / this.analyser.fftSize;

      // Focus on the frequency range used in the schema (400-8000 Hz)
      const minBin = Math.floor(2800 / binWidth);
      const maxBin = Math.ceil(8200 / binWidth);

      let maxAmplitude = 0;
      let peakBin = minBin;

      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        if (dataArray[i] > maxAmplitude) {
          maxAmplitude = dataArray[i];
          peakBin = i;
        }
      }

      const frequency = peakBin * binWidth;

      // Find closest valid frequency
      const closestValid = findClosestValidFrequency(frequency);

      if (closestValid !== null) {
        this.addDetection(closestValid);
        this.checkForToken();
      }

      requestAnimationFrame(detect);
    };

    detect();
  }

  addDetection(frequency) {
    // Avoid consecutive duplicates
    if (
      this.detections.length > 0 &&
      this.detections[this.detections.length - 1] === frequency
    ) {
      return;
    }

    this.detections.push(frequency);
  }

  checkForToken() {
    const TOKEN_LENGTH = 2;
    if (this.detections.length < TOKEN_LENGTH) {
      return;
    }

    if (this.detections.length > TOKEN_LENGTH) {
      // this.detections.shift();
      throw new Error('Detections exceeded token length');
    }

    let token = null;
    for (const [char, frequencies] of Object.entries(schema.frequencyMap)) {
      const first = frequencies[0];
      const second = frequencies[1];

      if (this.detections[0] === first && this.detections[1] === second) {
        token = char;
        this.detections = [];
        break;
      }
    }

    if (token) {
      // TODO: This is hardcoded for now. Change it later.
      if (SPECIAL_TOKENS.includes(token)) {
        this.current_special.push(token);

        // Keep only the last SPECIAL_LENGTH tokens
        while (this.current_special.length > SPECIAL_LENGTH) {
          this.current_special.shift();
        }

        if (token === START) {
          this.handleMessageStart();
          this.current_special = [];
        } else if (token === END) {
          this.handleMessageEnd();
          this.current_special = [];
        }
      } else {
        this.consecutiveErasureCount = 0;
        this.handleSymbol(token);
      }
    } else {
      this.detections.shift();
    }
    if (this.consecutiveErasureCount > 5) {
      this.handleMessageEnd();
      this.current_special = [];
    }
  }

  handleMessageStart() {
    this.isReceivingMessage = true;
    this.symbolPosition = 0;
    this.lastSymbolTime = Date.now();
    this.startErasureMonitoring();

    if (this.onMessageStart) {
      this.onMessageStart();
    }
  }

  handleMessageEnd() {
    this.isReceivingMessage = false;
    this.stopErasureMonitoring();

    if (this.onMessageEnd) {
      this.onMessageEnd();
    }
  }

  handleSymbol(token) {
    if (this.isReceivingMessage) {
      this.lastSymbolTime = Date.now();
      this.symbolPosition++;
    }

    if (this.onToken) {
      this.onToken(token);
    }
  }

  startErasureMonitoring() {
    this.stopErasureMonitoring(); // Clear any existing interval

    this.erasureCheckInterval = setInterval(() => {
      if (!this.isReceivingMessage) {
        return;
      }

      const timeSinceLastSymbol = Date.now() - this.lastSymbolTime;

      // If we haven't received a symbol within the expected timeframe, report erasure
      if (timeSinceLastSymbol > this.symbolTimeout) {
        const erasurePosition = this.symbolPosition;
        this.symbolPosition++;
        this.lastSymbolTime = Date.now(); // Reset to avoid multiple erasures for same position

        this.consecutiveErasureCount++;
        if (this.onErasure) {
          this.onErasure(erasurePosition);
        }
      }
    }, 100); // Check every 100ms
  }

  stopErasureMonitoring() {
    if (this.erasureCheckInterval) {
      clearInterval(this.erasureCheckInterval);
      this.erasureCheckInterval = null;
    }
  }

  cleanup() {
    this.stopErasureMonitoring();
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

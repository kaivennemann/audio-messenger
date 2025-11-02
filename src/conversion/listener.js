import schema from './schema/basic.json' with { type: 'json' };

import { findClosestValidFrequency } from '../conversion/convert';

const SPECIAL_TOKENS = ['^', '$'];
const START = '^';
const END = '$';
const SPECIAL_LENGTH = 3;

export class AudioToneListener {
  constructor(useCauchy = false, redundancy = 4) {
    this.initialized = false;
    this.audioContext = null;
    this.source = null;
    this.analyser = null;
    this.detections = [];
    this.mediaStream = null;

    this.onMessageStart = null;
    this.onMessageEnd = null;
    this.onToken = null;

    this.current_special = [];

    // Cauchy erasure code support
    this.useCauchy = useCauchy;
    this.redundancy = redundancy;
    this.isReceivingMessage = false;
    this.erasureTimeout = null;
    this.consecutiveErasures = 0;
    this.MAX_CONSECUTIVE_ERASURES = 3; // Treat as end code if this many erasures in a row
    // Each character = 2 tones × (200ms tone + 50ms gap) = 500ms
    // Set timeout to 500ms to quickly detect missing characters
    this.ERASURE_TIMEOUT_MS = 500;
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
    this.mediaStream = stream;

    this.source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();

    // Higher FFT size for better frequency resolution
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0.0;
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

      setTimeout(detect, 5);
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

    // Reset erasure timeout when we successfully decode a token
    if (token && this.erasureTimeout) {
      clearTimeout(this.erasureTimeout);
      this.erasureTimeout = null;
    }

    if (token) {
      // Reset consecutive erasures counter on successful decode
      if (this.isReceivingMessage) {
        this.consecutiveErasures = 0;
      }

      // TODO: This is hardcoded for now. Change it later.
      if (SPECIAL_TOKENS.includes(token)) {
        this.current_special.push(token);

        // Keep only the last SPECIAL_LENGTH tokens
        while (this.current_special.length > SPECIAL_LENGTH) {
          this.current_special.shift();
        }

        if (token === START) {
          this.isReceivingMessage = true;
          this.consecutiveErasures = 0;
          this.onMessageStart();
          this.current_special = [];
        } else if (token === END) {
          console.log('asdasd', token);
          this.onMessageEnd();

          if (this.erasureTimeout) {
            clearTimeout(this.erasureTimeout);
            this.erasureTimeout = null;
          }

          this.current_special = [];
        }
      } else {
        // Always call onToken to show incoming characters
        this.onToken(token);
      }

      // Set up erasure timeout for next token
      if (this.isReceivingMessage) {
        this.setupErasureTimeout();
      }
    } else {
      this.detections.shift();
    }
  }

  /**
   * Set up timeout to detect erasures (missing characters)
   */
  setupErasureTimeout() {
    if (this.erasureTimeout) {
      clearTimeout(this.erasureTimeout);
    }

    this.erasureTimeout = setTimeout(() => {
      if (this.isReceivingMessage) {
        // Increment consecutive erasures
        this.consecutiveErasures++;
        console.warn(
          `Erasure detected - character missing (${this.consecutiveErasures} consecutive)`
        );

        // Check if too many consecutive erasures - treat as end of message
        if (this.consecutiveErasures >= this.MAX_CONSECUTIVE_ERASURES) {
          console.log(
            'Multiple consecutive erasures detected - treating as end of message'
          );
          if (this.onMessageEnd) {
            this.onMessageEnd();
          }
          if (this.useCauchy) {
            this.handleCauchyDecode();
          }

          return; // Don't continue the timeout
        }

        // Continue waiting for next character
        this.setupErasureTimeout();
      }
    }, this.ERASURE_TIMEOUT_MS);
  }
}

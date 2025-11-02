import schema from './schema/basic.json' with { type: 'json' };

import { findClosestValidFrequency } from '../conversion/convert';

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
      if (token === '^') {
        this.onMessageStart();
      } else if (token === '$') {
        this.onMessageEnd();
      } else {
        this.onToken(token);
      }
    } else {
      this.detections.shift();
    }
  }
}

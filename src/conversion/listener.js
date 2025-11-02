import schema from './schema/basic.json' with { type: 'json' };

import { findClosestValidFrequency } from '../conversion/convert';

const SPECIAL_TOKENS = ['^', '$', '#', '!', '&', '*'];
const START = '^#!';
const END = '$&*';
const SPECIAL_LENGTH = 3;

export class AudioToneListener {
  constructor() {
    this.initialized = false;
    this.audioContext = null;
    this.source = null;
    this.analyser = null;
    // this.detections = [];
    this.lastDetection = [0, 0];

    this.onMessageStart = null;
    this.onMessageEnd = null;
    this.onToken = null;

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

      let maxAmplitude = [0, 0];
      let peakBin = [0, 0];

      for (let i = minBin; i < maxBin && i < bufferLength; i++) {
        if (dataArray[i] > maxAmplitude[0]) {
          maxAmplitude[1] = maxAmplitude[0];
          peakBin[1] = peakBin[0];
          maxAmplitude[0] = dataArray[i];
          peakBin[0] = i;
        } else if (dataArray[i] > maxAmplitude[1]) {
          maxAmplitude[1] = dataArray[i];
          peakBin[1] = i;
        }
      }

      const frequency0 = peakBin[0] * binWidth;
      const frequency1 = peakBin[1] * binWidth;

      // Find closest valid frequency
      const closestValid0 = findClosestValidFrequency(frequency0);
      const closestValid1 = findClosestValidFrequency(frequency1);

      // if (closestValid !== null) {
      //   this.addDetection(closestValid);
      //   this.checkForToken();
      // }
      if (closestValid0 !== null && closestValid1 !== null) {
        this.addDetection([closestValid0, closestValid1]);
        // this.checkForToken();
      }

      setTimeout(detect, 5);
    };

    detect();
  }

  addDetection(frequencys) {
    // Avoid consecutive duplicates
    if (
      // this.detections.length > 0 &&
      // this.detections[this.detections.length - 1][0] === frequencys[0] &&
      // this.detections[this.detections.length - 1][1] === frequencys[1]
      this.lastDetection[0] === frequencys[0] &&
      this.lastDetection[1] === frequencys[1]
    ) {
      return;
    }

    console.log('Detected frequencies:', frequencys);

    this.lastDetection = frequencys;

    let token = null;
    for (const [char, frequencies] of Object.entries(schema.frequencyMap)) {
      const first = frequencies[0];
      const second = frequencies[1];

      if (this.lastDetection[0] === first && this.lastDetection[1] === second) {
        token = char;
        break;
      }
    }

    if (token === null) {
      return;
    }

    if (token === '^') {
      this.onMessageStart();
    } else if (token === '$') {
      this.onMessageEnd();
    } else {
      this.onToken(token);
    }

    // this.detections.push(frequencys);
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

        if (this.current_special.join('') === START) {
          this.onMessageStart();
          this.current_special = [];
        } else if (this.current_special.join('') === END) {
          this.onMessageEnd();
          this.current_special = [];
        }
      } else {
        this.onToken(token);
      }
    } else {
      this.detections.shift();
    }
  }
}

/**
 * Audio player for generating tones from frequency arrays
 * Uses Web Audio API for precise frequency generation
 */

export class AudioTonePlayer {
  constructor(options = {}) {
    this.toneDuration = options.toneDuration || 200; // ms
    this.toneGap = options.toneGap || 50; // ms
    this.volume = options.volume || 0.3; // 0-1
    this.audioContext = null;
    this.isPlaying = false;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a single tone at specified frequency
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in milliseconds
   * @param {number} startTime - When to start (in audio context time)
   * @returns {number} - End time of this tone
   */
  playTone(frequency, duration, startTime) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Add slight fade in/out to reduce clicking
    // const fadeTime = 0.01; // 10ms fade
    const startTimeSeconds = startTime;
    const endTimeSeconds = startTime + duration / 1000;

    gainNode.gain.setValueAtTime(this.volume, startTimeSeconds);

    // gainNode.gain.setValueAtTime(0, startTimeSeconds);
    // gainNode.gain.linearRampToValueAtTime(
    //   this.volume,
    //   startTimeSeconds + fadeTime
    // );
    // gainNode.gain.setValueAtTime(this.volume, endTimeSeconds - fadeTime);
    // gainNode.gain.linearRampToValueAtTime(0, endTimeSeconds);

    oscillator.start(startTimeSeconds);
    oscillator.stop(endTimeSeconds);

    return endTimeSeconds;
  }

  /**
   * Play a sequence of frequencies
   * @param {Array<number>} frequencies - Array of frequencies to play
   * @param {Function} onProgress - Callback for progress updates (index, total)
   * @param {Function} onComplete - Callback when complete
   */
  async playSequence(frequencies, onProgress = null, onComplete = null) {
    if (!this.audioContext) {
      await this.initialize();
    }

    this.isPlaying = true;
    let currentTime = this.audioContext.currentTime + 0.1; // Small delay to start

    const totalDuration =
      frequencies.length * (this.toneDuration + this.toneGap);

    frequencies.forEach((freq, index) => {
      currentTime = this.playTone(freq, this.toneDuration, currentTime);
      currentTime += this.toneGap / 1000; // Add gap between tones

      // Schedule progress callback
      if (onProgress) {
        setTimeout(
          () => {
            if (this.isPlaying) {
              onProgress(index + 1, frequencies.length);
            }
          },
          (index + 1) * (this.toneDuration + this.toneGap)
        );
      }
    });

    // Schedule completion callback
    if (onComplete) {
      setTimeout(() => {
        this.isPlaying = false;
        onComplete();
      }, totalDuration);
    }
  }

  /**
   * Stop all currently playing tones
   */
  stop() {
    this.isPlaying = false;
    if (this.audioContext) {
      // Close and recreate context to stop all sounds
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Get estimated duration for a frequency array
   * @param {Array<number>} frequencies
   * @returns {number} - Duration in milliseconds
   */
  estimateDuration(frequencies) {
    return frequencies.length * (this.toneDuration + this.toneGap);
  }
}

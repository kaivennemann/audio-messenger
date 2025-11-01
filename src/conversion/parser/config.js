export const CONFIG = {
  // Frequency tolerance as percentage (e.g., 0.05 = 5%)
  FREQUENCY_TOLERANCE_PERCENT: 0.08,
  // Minimum amplitude threshold (0-255)
  MIN_AMPLITUDE_THRESHOLD: 30,
  // Tone duration in milliseconds
  TONE_DURATION_MS: 200,
  // Gap between tones in milliseconds
  TONE_GAP_MS: 50,
};

export const SINGLE_CONFIG = {
  // Standard tolerance
  FREQUENCY_TOLERANCE_PERCENT: 0.08,
  // Standard amplitude threshold
  MIN_AMPLITUDE_THRESHOLD: 30,
  // Shorter duration since we have fewer tones
  TONE_DURATION_MS: 120,
  // Minimal gap for speed
  TONE_GAP_MS: 30,
};

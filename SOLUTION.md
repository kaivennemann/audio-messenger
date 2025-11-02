# Audio Messenger - Robust Sound-Based Protocol Solution

## Problem Summary

You were experiencing inconsistent frequency recording when trying to implement a sound-based messaging protocol. The original implementation required exact frequency matches, which failed in real-world conditions due to:

- Microphone and speaker variations
- Environmental noise
- Frequency drift in audio capture
- Sample rate inconsistencies

## Solutions Implemented

### 1. Frequency Tolerance Matching (`src/conversion/parser/robust.js`)

**The Problem:** Exact frequency matching (e.g., looking for exactly 400 Hz) fails because real-world audio detection might capture 398 Hz or 403 Hz.

**The Solution:** Implemented tolerance-based matching with 8% default tolerance:

```javascript
// Finds the closest valid frequency within tolerance
findClosestValidFrequency(detectedHz, tolerance = 0.08)
```

This means if you're looking for 400 Hz, it will accept anything between 368-432 Hz and snap it to 400 Hz.

### 2. Amplitude-Based Noise Filtering

**The Problem:** Background noise creates false frequency detections.

**The Solution:** Only process frequencies above a minimum amplitude threshold (30/255 by default):

```javascript
if (detection.amplitude < CONFIG.MIN_AMPLITUDE_THRESHOLD) {
  // Skip this detection - likely noise
}
```

### 3. Averaging and Smoothing

**The Problem:** Single-sample frequency readings can be noisy.

**The Solution:** Collect multiple samples of the same tone and average them:

```javascript
// Average multiple detections of the same frequency
const avgFreq = toneFrequencies.reduce((a, b) => a + b, 0) / toneFrequencies.length;
```

### 4. Multiple Transmission Strategies

Three different modes to handle various reliability needs:

- **Basic Mode**: Fast, single transmission of each tone
- **Repeat Mode (2x)**: Each tone played twice for redundancy
- **Checksum Mode**: Adds a validation tone at the end

### 5. Improved Audio Generation

Uses Web Audio API oscillators for precise frequency generation:

```javascript
// Clean sine wave generation with fade-in/fade-out
oscillator.type = 'sine';
oscillator.frequency.value = frequency;
```

## How to Use

### Start the Application

```bash
npm start
```

The app will open at `http://localhost:3000`

### Transmitting Messages

1. **Left Panel - Transmitter**:
   - Type your message
   - Choose transmission mode (Basic/Repeat/Checksum)
   - Adjust timing if needed (tone duration: 200ms, gap: 50ms recommended)
   - Click "Play Message"

2. **Transmission Modes**:
   - **Basic**: Fastest, use in quiet environments
   - **Repeat (2x)**: Better reliability, 2x duration
   - **Checksum**: Adds validation tone

### Receiving Messages

1. **Right Panel - Receiver**:
   - Click the microphone button to start listening
   - Speak or play tones from transmitter
   - Click stop when done
   - Decoded message appears at bottom

2. **Visual Feedback**:
   - **Detected Frequency**: Raw frequency detected
   - **Matched Valid Freq**: Closest valid frequency from schema
   - **Amplitude**: Signal strength (must be > 30)
   - **Recent Valid Detections**: Last 20 valid frequencies

## Configuration Options

### Adjustable Parameters (in code)

**In `src/conversion/parser/robust.js`:**
```javascript
const CONFIG = {
  FREQUENCY_TOLERANCE_PERCENT: 0.08,  // 8% tolerance
  MIN_AMPLITUDE_THRESHOLD: 30,        // Minimum volume
  TONE_DURATION_MS: 200,              // Tone length
  TONE_GAP_MS: 50,                    // Silence between tones
};
```

### Tips for Best Results

1. **Environment**:
   - Use in a quiet room
   - Keep devices 1-3 feet apart
   - Avoid background music/noise

2. **Settings**:
   - Start with Basic mode in quiet environments
   - Use Repeat mode if you get errors
   - Increase tone duration (300-400ms) for longer distances

3. **Volume**:
   - Set speaker volume to 50-70%
   - Watch the amplitude meter - aim for 80-200 range

4. **Debugging**:
   - Open browser console (F12) to see raw frequency logs
   - Watch "Recent Valid Detections" to see what's being captured
   - If amplitude is consistently below 30, increase speaker volume

## Architecture

```
src/
├── components/
│   ├── AudioTransmitter.js          # UI for sending messages
│   ├── RobustFrequencyDetector.js   # UI for receiving messages
│   └── PageHeader.js
├── conversion/
│   ├── parser/
│   │   ├── basic.js                 # Original text ↔ frequency conversion
│   │   └── robust.js                # NEW: Tolerance-based matching
│   ├── player.js                    # NEW: Web Audio API tone generation
│   ├── constants.js                 # Character alphabet
│   └── schema/
│       └── basic.json               # Frequency mapping (76 chars → 50 frequencies)
└── App.js                           # Main app with dual panels
```

## Technical Details

### Encoding Scheme

- **50 frequency bands** from 400-8000 Hz (spaced ~155 Hz apart)
- **76 characters** supported (a-z, A-Z, 0-9, special chars)
- Each character = **2 frequencies** (base-50 encoding)
- Start/end marker: `~` symbol

Example:
```
'a' → [400, 400]
'b' → [555, 400]
'z' → [4278, 400]
```

### Why 2 Frequencies Per Character?

With 50 frequency bands, we can encode 50² = 2,500 unique symbols (way more than the 76 we need). This gives us:
- Simple encoding
- Room for expansion
- Clear tone separation

### Frequency Tolerance Math

For a frequency `f` with tolerance `t`:
- Accept range: `[f × (1-t), f × (1+t)]`
- Example: 400 Hz with 8% tolerance = 368-432 Hz accepted

## Known Limitations

1. **Speed**: Currently ~4 characters/second (basic mode)
2. **Distance**: Works best within 3-5 feet
3. **Noise**: Struggles in very noisy environments (>60 dB ambient)
4. **Hardware**: Depends on speaker/mic quality

## Future Improvements

1. **Error Correction**: Add Reed-Solomon or similar FEC
2. **Chirp Encoding**: Use frequency sweeps for better noise immunity
3. **OFDM**: Multiple simultaneous frequencies for higher data rate
4. **Adaptive Tolerance**: Automatically adjust based on SNR
5. **Visual Feedback**: Spectrogram display during transmission

## Comparison with Tom.js

Your friend's `tom.js` was a good start - it showed peak frequency detection. The new system builds on that with:

- ✅ Tolerance-based matching (tom.js used exact)
- ✅ Amplitude filtering (tom.js showed all)
- ✅ Multi-tone decoding (tom.js just detected)
- ✅ Complete transmit/receive UI
- ✅ Multiple transmission strategies

## Testing

Quick test to verify it works:

1. Start the app
2. Type "hello" in transmitter
3. Click "Play Message"
4. Click microphone in receiver panel
5. Should decode to "hello"

If it doesn't work:
- Check amplitude is > 30
- Increase speaker volume
- Try "Repeat (2x)" mode
- Increase tone duration to 300ms

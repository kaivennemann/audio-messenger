# Cauchy Erasure Codes for Audio Messenger

This implementation adds erasure correction to your audio messenger system using XOR-based erasure codes.

## How It Works

The system works at the **alphabet level** - it adds redundancy characters to your message that allow recovery from missing (erased) characters during transmission.

### Key Features

- **Works with your existing schema**: Uses characters from `src/conversion/schema/basic.json`
- **Configurable redundancy**: Default is 4 parity symbols (can recover up to 4 erasures)
- **Automatic erasure detection**: The listener detects missing characters and marks them
- **No tone changes**: Only the input/output strings are affected, tones remain the same

## Files

- **[src/conversion/cauchy.js](src/conversion/cauchy.js)** - Core encoding/decoding logic
- **[src/conversion/convert.js](src/conversion/convert.js)** - Updated to support Cauchy encoding
- **[src/conversion/listener.js](src/conversion/listener.js)** - Updated to detect and recover erasures
- **[test-cauchy.js](test-cauchy.js)** - Test file demonstrating usage

## Usage

### Encoding (Sender Side)

```javascript
import { convertFromTextToHz } from './src/conversion/convert.js';

// Without Cauchy (original)
const frequencies = convertFromTextToHz('hello');

// With Cauchy encoding (adds redundancy)
const frequenciesWithRedundancy = convertFromTextToHz('hello', true, 4);
// Message becomes: 'hello' + 4 parity chars = 9 chars total
```

### Decoding (Receiver Side)

```javascript
import { AudioToneListener } from './src/conversion/listener.js';

// Without Cauchy
const listener1 = new AudioToneListener();

// With Cauchy (detects and recovers erasures)
const listener2 = new AudioToneListener(true, 4);
// First param: enable Cauchy
// Second param: redundancy level (must match sender!)

await listener2.initialize();

listener2.onMessageStart = () => console.log('Message started');
listener2.onToken = (char) => console.log('Received:', char);
listener2.onMessageEnd = () => console.log('Message ended');
```

## How Erasure Detection Works

The listener tracks character timing. If no valid tone is detected within the timeout period (default 500ms), it marks that position as an erasure:

```
Expected: h e l l o
Received: h e _ l o  (third char missing)
                ^
         Erasure marker
```

The Cauchy decoder then attempts to recover the missing character using the redundancy symbols.

## Configuration

### Adjusting Redundancy

Higher redundancy = more erasures can be recovered, but longer messages:

```javascript
// Can recover up to 2 erasures
const encoded = cauchyEncode('hello', 2); // 'hello' + 2 parity = 7 chars

// Can recover up to 6 erasures
const encoded = cauchyEncode('hello', 6); // 'hello' + 6 parity = 11 chars
```

### Adjusting Erasure Timeout

In `listener.js`, change the timeout value:

```javascript
this.ERASURE_TIMEOUT_MS = 500; // Increase if chars are slow
```

## Testing

Run the test file to see erasure recovery in action:

```bash
node test-cauchy.js
```

## Example Output

```
Original message: "hello"
Redundancy: 4 symbols

Encoded message: "hellojplp"
Length: 5 -> 9

--- Single erasure recovery ---
Received: "he_lojplp"  (char at position 2 is missing)
Decoded: "hello"       (successfully recovered!)
Match: true
```

## Technical Details

### XOR Parity Groups

The encoder creates multiple overlapping XOR parity groups. Each parity symbol protects a different subset of data characters:

- Parity 0: protects chars at positions 0, 4, 8, ... (and overlaps)
- Parity 1: protects chars at positions 1, 5, 9, ... (and overlaps)
- Parity 2: protects chars at positions 2, 6, 10, ... (and overlaps)
- Parity 3: protects chars at positions 3, 7, 11, ... (and overlaps)

### Decoder Algorithm

The decoder iteratively solves XOR equations:
1. Find parity groups with exactly one unknown (erased) character
2. XOR all known characters in that group with the parity
3. The result is the missing character
4. Repeat until all erasures are recovered or no progress is made

### Limitations

- Can only recover erasures in the data portion (not parity symbols)
- Maximum recoverable erasures = redundancy level
- Some patterns of multiple erasures may not be recoverable depending on how they align with parity groups

## Integration Tips

1. **Both sides must agree**: Sender and receiver must use the same redundancy level
2. **Start with redundancy=4**: Good balance between overhead and recovery
3. **Monitor erasure rates**: Check console logs for erasure warnings
4. **Adjust timeout**: If you see false erasures, increase `ERASURE_TIMEOUT_MS`

## Performance

| Message Length | Redundancy | Total Length | Overhead |
|----------------|------------|--------------|----------|
| 5 chars        | 4          | 9 chars      | 80%      |
| 10 chars       | 4          | 14 chars     | 40%      |
| 20 chars       | 4          | 24 chars     | 20%      |

Overhead decreases for longer messages.

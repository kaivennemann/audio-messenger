// import React, { useState, useEffect, useRef } from 'react';

// export default function FrequencyDetector() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [peakFreq, setPeakFreq] = useState(null);
//   const [peakAmp, setPeakAmp] = useState(0);
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const sourceRef = useRef(null);
//   const animationRef = useRef(null);

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
//       audioContextRef.current = new AudioContext();
//       const source = audioContextRef.current.createMediaStreamSource(stream);
//       const analyser = audioContextRef.current.createAnalyser();
      
//       analyser.fftSize = 8192;
//       source.connect(analyser);
      
//       sourceRef.current = source;
//       analyserRef.current = analyser;
      
//       setIsRecording(true);
//       detectPeakFrequency();
//     } catch (err) {
//       console.error('Error accessing microphone:', err);
//       alert('Could not access microphone');
//     }
//   };

//   const stopRecording = () => {
//     if (animationRef.current) {
//       cancelAnimationFrame(animationRef.current);
//     }
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//     }
//     setIsRecording(false);
//     setPeakFreq(null);
//     setPeakAmp(0);
//   };

//   const detectPeakFrequency = () => {
//     const analyser = analyserRef.current;
//     const bufferLength = analyser.frequencyBinCount;
//     const dataArray = new Uint8Array(bufferLength);
    
//     const detect = () => {
//       analyser.getByteFrequencyData(dataArray);
      
//       const sampleRate = audioContextRef.current.sampleRate;
//       const binWidth = sampleRate / (analyser.fftSize);
      
//       const minBin = Math.floor(2000 / binWidth);
//       const maxBin = Math.ceil(5000 / binWidth);
      
//       let maxAmplitude = 0;
//       let peakBin = minBin;
      
//       for (let i = minBin; i < maxBin && i < bufferLength; i++) {
//         if (dataArray[i] > maxAmplitude) {
//           maxAmplitude = dataArray[i];
//           peakBin = i;
//         }
//       }
      
//       const frequency = peakBin * binWidth;
      
//       console.log(`Peak: ${frequency.toFixed(2)} Hz, Amplitude: ${maxAmplitude}`);
      
//       setPeakFreq(frequency.toFixed(2));
//       setPeakAmp(maxAmplitude);
      
//       animationRef.current = requestAnimationFrame(detect);
//     };
    
//     detect();
//   };

//   useEffect(() => {
//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//       if (audioContextRef.current) {
//         audioContextRef.current.close();
//       }
//     };
//   }, []);

//   return (
//     <>
//       <style>{`
//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }

//         body {
//           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           min-height: 100vh;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//         }

//         .container {
//           background: white;
//           border-radius: 20px;
//           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//           padding: 40px;
//           max-width: 500px;
//           width: 100%;
//         }

//         h1 {
//           font-size: 2em;
//           color: #333;
//           text-align: center;
//           margin-bottom: 10px;
//         }

//         .subtitle {
//           text-align: center;
//           color: #666;
//           margin-bottom: 40px;
//           font-size: 1.1em;
//         }

//         .button-container {
//           display: flex;
//           justify-content: center;
//           margin-bottom: 40px;
//         }

//         .mic-button {
//           width: 80px;
//           height: 80px;
//           border-radius: 50%;
//           border: none;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.3s;
//           box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
//         }

//         .mic-button:hover {
//           transform: scale(1.05);
//         }

//         .mic-button.inactive {
//           background: #667eea;
//         }

//         .mic-button.active {
//           background: #e74c3c;
//           animation: pulse 2s infinite;
//         }

//         @keyframes pulse {
//           0%, 100% { box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4); }
//           50% { box-shadow: 0 4px 25px rgba(231, 76, 60, 0.8); }
//         }

//         .mic-icon {
//           width: 35px;
//           height: 35px;
//           fill: white;
//         }

//         .info-card {
//           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
//           border-radius: 15px;
//           padding: 25px;
//           margin-bottom: 20px;
//         }

//         .info-card.frequency {
//           background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%);
//         }

//         .info-card.amplitude {
//           background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
//         }

//         .label {
//           font-size: 0.9em;
//           color: #555;
//           margin-bottom: 5px;
//         }

//         .value {
//           font-size: 2.5em;
//           font-weight: bold;
//           color: #333;
//         }

//         .amplitude-value {
//           font-size: 1.8em;
//         }

//         .progress-bar {
//           background: rgba(0, 0, 0, 0.1);
//           border-radius: 10px;
//           height: 12px;
//           margin-top: 15px;
//           overflow: hidden;
//         }

//         .progress-fill {
//           height: 100%;
//           background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
//           transition: width 0.1s;
//           border-radius: 10px;
//         }

//         .hint {
//           text-align: center;
//           color: #999;
//           font-size: 0.85em;
//           margin-top: 20px;
//         }

//         .inactive-message {
//           text-align: center;
//           color: #666;
//           font-size: 1.1em;
//         }
//       `}</style>

//       <div className="container">
//         <h1>Frequency Detector</h1>
//         <p className="subtitle">2000-3000 Hz Range</p>
        
//         <div className="button-container">
//           <button 
//             onClick={isRecording ? stopRecording : startRecording}
//             className={`mic-button ${isRecording ? 'active' : 'inactive'}`}
//           >
//             <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//               {isRecording ? (
//                 <>
//                   <line x1="18" y1="6" x2="6" y2="18"></line>
//                   <line x1="6" y1="6" x2="18" y2="18"></line>
//                 </>
//               ) : (
//                 <>
//                   <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
//                   <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
//                   <line x1="12" y1="19" x2="12" y2="23"></line>
//                   <line x1="8" y1="23" x2="16" y2="23"></line>
//                 </>
//               )}
//             </svg>
//           </button>
//         </div>

//         {isRecording ? (
//           <div>
//             <div className="info-card frequency">
//               <div className="label">Peak Frequency</div>
//               <div className="value">{peakFreq ? `${peakFreq} Hz` : '---'}</div>
//             </div>
            
//             <div className="info-card amplitude">
//               <div className="label">Amplitude</div>
//               <div className="amplitude-value">{peakAmp} / 255</div>
//               <div className="progress-bar">
//                 <div 
//                   className="progress-fill"
//                   style={{ width: `${(peakAmp / 255) * 100}%` }}
//                 />
//               </div>
//             </div>

//             <div className="hint">Check console for continuous logs</div>
//           </div>
//         ) : (
//           <div className="inactive-message">
//             Click the microphone to start detecting frequencies
//           </div>
//         )}
//       </div>
//     </>
//   );
// }
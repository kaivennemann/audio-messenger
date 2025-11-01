import './styles/App.css';
// import background from "./static/background.jpg";
import logo from './static/logo.svg';
import PageHeader from './components/PageHeader.js';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

function App() {
  // instantiate analyzer

  const do_thing = () => {
    if (navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: false })
        .then(stream => {
          const audioMotion = new AudioMotionAnalyzer(null, {
            useCanvas: false,
            onCanvasDraw: instance => {
              const active_freqs = instance
                .getBars()
                .filter(bar => bar.value[0] > 0.7)
                .filter(
                  bar =>
                    (2990 < bar.freq && bar.freq < 3010) ||
                    (3990 < bar.freq && bar.freq < 4010)
                )
                .map(bar => bar.freq);
              console.log(active_freqs.toString());
            },
            minFreq: 2000,
            maxFreq: 5000,
            maxFPS: 100,
          });
          const micStream =
            audioMotion.audioCtx.createMediaStreamSource(stream);
          // connect microphone stream to analyzer
          audioMotion.connectInput(micStream);
          // mute output to prevent feedback loops from the speakers
          audioMotion.volume = 0;
        });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <PageHeader className="page-header" />
      </header>
      <div id="container"></div>
      <input type="checkbox" onChange={do_thing}></input>
    </div>
  );
}

// let micStream;

// // instantiate analyzer
// const audioMotion = new AudioMotionAnalyzer(
//     document.getElementById("container"),
//     {
//         gradient: "rainbow",
//         height: window.innerHeight - 40,
//         showScaleY: true,
//     }
// );

// // toggle microphone on/off
// const micButton = document.getElementById("mic");

// micButton.addEventListener("change", () => {
//     if (micButton.checked) {
//         if (navigator.mediaDevices) {
//             navigator.mediaDevices
//                 .getUserMedia({ audio: true, video: false })
//                 .then((stream) => {
//                     // create stream using audioMotion audio context
//                     micStream =
//                         audioMotion.audioCtx.createMediaStreamSource(stream);
//                     // connect microphone stream to analyzer
//                     audioMotion.connectInput(micStream);
//                     // mute output to prevent feedback loops from the speakers
//                     audioMotion.volume = 0;
//                 })
//                 .catch((err) => {
//                     alert("Microphone access denied by user");
//                 });
//         } else {
//             alert("User mediaDevices not available");
//         }
//     } else {
//         // disconnect and release microphone stream
//         audioMotion.disconnectInput(micStream, true);
//     }
// });

export default App;

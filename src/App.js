import './styles/App.css';
import VoiceTransmitter from './components/VoiceTransmitter.js';
import VoiceReceiver from './components/VoiceReceiver.js';
import { useState } from 'react';

function App() {
  const [schemaMode, setSchemaMode] = useState('ultrasonic');

  return (
    <div className="App">
      <style>{`
        .App {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }

        .App-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .App-logo {
          height: 80px;
          pointer-events: none;
        }

        .page-header {
          margin: 20px 0;
        }

        .components-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .mode-toggle {
          text-align: center;
          margin-bottom: 30px;
        }

        .mode-button {
          background: white;
          border: none;
          padding: 12px 30px;
          margin: 0 10px;
          border-radius: 25px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .mode-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .mode-button.active {
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
        }

        .dual-mode {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .dual-mode {
            grid-template-columns: 1fr;
          }
        }

        .section-header {
          text-align: center;
          color: white;
          font-size: 1.3em;
          margin-bottom: 15px;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <PageHeader className='page-header' />
      </header> */}

      <div className="mode-toggle">
        <button
          className={`mode-button ${schemaMode === 'single' ? 'active' : ''}`}
          onClick={() => setSchemaMode('single')}
        >
          ⚡ Single-Tone (2-6kHz) - FASTEST
        </button>
        <button
          className={`mode-button ${schemaMode === 'quad' ? 'active' : ''}`}
          onClick={() => setSchemaMode('quad')}
        >
          🎯 Quad-Tone (1-5kHz) - MAX DENSITY
        </button>
        <button
          className={`mode-button ${schemaMode === 'ultrasonic' ? 'active' : ''}`}
          onClick={() => setSchemaMode('ultrasonic')}
        >
          🚀 Ultrasonic (8-17kHz)
        </button>
        <button
          className={`mode-button ${schemaMode === 'voice' ? 'active' : ''}`}
          onClick={() => setSchemaMode('voice')}
        >
          🎤 Voice (300-3500Hz)
        </button>
        <button
          className={`mode-button ${schemaMode === 'basic' ? 'active' : ''}`}
          onClick={() => setSchemaMode('basic')}
        >
          📻 Basic (3-8kHz)
        </button>
      </div>

      <div className="components-container">
        <div className="dual-mode">
          <div>
            <h3 className="section-header">Transmit</h3>
            {schemaMode === 'single' && (
              <VoiceTransmitter schemaType="single" />
            )}
            {schemaMode === 'quad' && <VoiceTransmitter schemaType="quad" />}
            {schemaMode === 'ultrasonic' && (
              <VoiceTransmitter schemaType="ultrasonic" />
            )}
            {schemaMode === 'voice' && <VoiceTransmitter schemaType="voice" />}
            {schemaMode === 'basic' && <VoiceTransmitter schemaType="basic" />}
          </div>
          <div>
            <h3 className="section-header">Receive</h3>
            {schemaMode === 'single' && <VoiceReceiver schemaType="single" />}
            {schemaMode === 'quad' && <VoiceReceiver schemaType="quad" />}
            {schemaMode === 'ultrasonic' && (
              <VoiceReceiver schemaType="ultrasonic" />
            )}
            {schemaMode === 'voice' && <VoiceReceiver schemaType="voice" />}
            {schemaMode === 'basic' && <VoiceReceiver schemaType="basic" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

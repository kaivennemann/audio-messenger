import "./styles/App.css";
// import background from "./static/background.jpg";
import logo from "./static/logo.svg";
import PageHeader from "./components/PageHeader.js";
import SoundCreator from "./components/SoundCreator.js";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <PageHeader className="page-header" />
        <SoundCreator className="sound-creator" />
      </header>
    </div>
  );
}

export default App;

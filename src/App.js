import './styles/App.css';
// import background from "./static/background.jpg";
import logo from './static/logo.svg';
import PageHeader from './components/PageHeader.js'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      <PageHeader className='page-header' />
      </header>
    </div>
  );
}

export default App;

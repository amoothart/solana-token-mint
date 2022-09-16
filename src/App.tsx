import './App.css';
import MintNft from './MintNft';
import MintToken from './MintToken';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MintToken></MintToken>
        <MintNft></MintNft>
      </header>
    </div>
  );
}

export default App;

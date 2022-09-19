import './App.css';
import MintNft from './MintNft';
import MintToken from './MintToken';
import SendSol from './SendSol';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <MintToken></MintToken>
        <MintNft></MintNft>
        <SendSol></SendSol>
      </header>
    </div>
  );
}

export default App;

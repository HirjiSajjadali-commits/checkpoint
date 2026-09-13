import Board from './components/Board';
import GameStatus from './components/GameStatus';
import OpponentPanel from './components/OpponentPanel';
import CpuController from './components/CpuController';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Checkpoint</h1>
        <p>Real chess. Play a friend by link, or the computer.</p>
      </header>
      <OpponentPanel />
      <GameStatus />
      <Board />
      <CpuController />
    </div>
  );
}

export default App;

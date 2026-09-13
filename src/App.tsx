import Board from './components/Board';
import GameStatus from './components/GameStatus';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Checkpoint</h1>
        <p>Real chess. Play a friend by link, or the computer.</p>
      </header>
      <GameStatus />
      <Board />
    </div>
  );
}

export default App;

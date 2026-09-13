import Board from './components/Board';
import GameStatus from './components/GameStatus';
import OpponentPanel from './components/OpponentPanel';
import TimeControlPanel from './components/TimeControlPanel';
import CpuController from './components/CpuController';
import ClockRunner from './components/ClockRunner';
import PlayerBar from './components/PlayerBar';
import GameControls from './components/GameControls';
import MoveList from './components/MoveList';
import GameOverModal from './components/GameOverModal';
import { useGameStore } from './store/gameStore';

function App() {
  const orientation = useGameStore((s) => s.orientation);
  const topColor = orientation === 'w' ? 'b' : 'w';
  const bottomColor = orientation;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Checkpoint</h1>
        <p>Real chess. Play a friend by link, or the computer.</p>
      </header>
      <OpponentPanel />
      <TimeControlPanel />
      <GameStatus />
      <PlayerBar side={topColor} />
      <Board />
      <PlayerBar side={bottomColor} />
      <GameControls />
      <MoveList />
      <CpuController />
      <ClockRunner />
      <GameOverModal />
    </div>
  );
}

export default App;

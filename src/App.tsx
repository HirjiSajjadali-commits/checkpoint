import { lazy, Suspense, useState } from 'react';
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
import ThemeToggle from './components/ThemeToggle';
import { useGameStore } from './store/gameStore';
import { roomCodeFromUrl } from './online/roomStorage';

// Online play pulls in @supabase/supabase-js — a meaningful chunk of weight
// that local/CPU games never need. Load it only once it's actually wanted:
// the user picked "Play online", or the page was opened via a shared
// room link (checked with a dependency-free helper, so this decision
// itself never pulls the heavy module in).
const OnlinePanel = lazy(() => import('./components/OnlinePanel'));
const OnlineSync = lazy(() => import('./components/OnlineSync'));

function App() {
  const orientation = useGameStore((s) => s.orientation);
  const uiTab = useGameStore((s) => s.uiTab);
  const topColor = orientation === 'w' ? 'b' : 'w';
  const bottomColor = orientation;

  const [openedWithRoomLink] = useState(() => roomCodeFromUrl() !== null);
  const needsOnlineModule = uiTab === 'online' || openedWithRoomLink;

  return (
    <div className="app">
      <header className="app-header">
        <ThemeToggle />
        <h1>Checkpoint</h1>
        <p>Real chess. Play a friend by link, or the computer.</p>
      </header>
      <OpponentPanel />
      {uiTab === 'online' ? (
        needsOnlineModule && (
          <Suspense fallback={null}>
            <OnlinePanel />
          </Suspense>
        )
      ) : (
        <TimeControlPanel />
      )}
      <GameStatus />
      <PlayerBar side={topColor} />
      <Board />
      <PlayerBar side={bottomColor} />
      <GameControls />
      <MoveList />
      <CpuController />
      {needsOnlineModule && (
        <Suspense fallback={null}>
          <OnlineSync />
        </Suspense>
      )}
      <ClockRunner />
      <GameOverModal />
    </div>
  );
}

export default App;

import { useGameStore } from '../store/gameStore';

export default function GameStatus() {
  const turn = useGameStore((s) => s.turn);
  const result = useGameStore((s) => s.result);
  const announcement = useGameStore((s) => s.announcement);
  const flipBoard = useGameStore((s) => s.flipBoard);
  const reset = useGameStore((s) => s.reset);
  const opponent = useGameStore((s) => s.opponent);
  const cpuColor = useGameStore((s) => s.cpuColor);
  const engineStatus = useGameStore((s) => s.engineStatus);

  const isCpuTurn = opponent === 'cpu' && turn === cpuColor;

  let statusText: string;
  if (result.reason === 'checkmate') {
    statusText = `Checkmate — ${result.winner === 'w' ? 'White' : 'Black'} wins`;
  } else if (result.reason === 'stalemate') {
    statusText = 'Stalemate — draw';
  } else if (result.reason === 'draw') {
    statusText = 'Draw';
  } else if (isCpuTurn && engineStatus === 'thinking') {
    statusText = 'Computer is thinking…';
  } else {
    statusText = `${turn === 'w' ? 'White' : 'Black'} to move`;
  }

  return (
    <div className="game-status">
      <p className="status-text">{statusText}</p>
      <div className="status-actions">
        <button className="btn" onClick={flipBoard}>
          Flip board
        </button>
        <button className="btn btn-accent" onClick={reset}>
          New game
        </button>
      </div>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}

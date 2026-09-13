import { useState } from 'react';
import { useGameStore, type GameResultReason } from '../store/gameStore';

const REASON_TEXT: Record<NonNullable<GameResultReason>, string> = {
  checkmate: 'Checkmate',
  stalemate: 'Stalemate',
  draw: 'Draw',
  'draw-agreed': 'Draw agreed',
  resignation: 'Resignation',
  timeout: 'Time out',
};

export default function GameOverModal() {
  const result = useGameStore((s) => s.result);
  const gameId = useGameStore((s) => s.gameId);
  const reset = useGameStore((s) => s.reset);
  const [dismissedGameId, setDismissedGameId] = useState<number | null>(null);

  if (!result.over || dismissedGameId === gameId) return null;

  const winnerName = result.winner === 'w' ? 'White' : result.winner === 'b' ? 'Black' : null;
  const headline = winnerName ? `${winnerName} wins` : 'Draw';

  return (
    <div className="modal-backdrop" onClick={() => setDismissedGameId(gameId)}>
      <div
        className="game-over-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Game over"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="game-over-reason">{result.reason ? REASON_TEXT[result.reason] : 'Game over'}</p>
        <h2 className="game-over-headline">{headline}</h2>
        <div className="game-over-actions">
          <button className="btn" onClick={() => setDismissedGameId(gameId)}>
            Review board
          </button>
          <button className="btn btn-accent" onClick={reset}>
            Rematch
          </button>
        </div>
      </div>
    </div>
  );
}

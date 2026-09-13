import type { Color } from 'chess.js';
import { useGameStore } from '../store/gameStore';
import { computeMaterial } from '../game/material';
import { formatClock } from '../game/timeControls';
import { pieceImages } from '../game/pieceImages';

export default function PlayerBar({ side }: { side: Color }) {
  const board = useGameStore((s) => s.board);
  const clockMs = useGameStore((s) => s.clockMs);
  const turn = useGameStore((s) => s.turn);
  const over = useGameStore((s) => s.result.over);
  const opponent = useGameStore((s) => s.opponent);
  const cpuColor = useGameStore((s) => s.cpuColor);

  const { capturedBy, advantage } = computeMaterial(board);
  const captured = capturedBy[side];
  const showAdvantage = side === 'w' ? advantage > 0 : advantage < 0;
  const opponentColor: Color = side === 'w' ? 'b' : 'w';

  const label =
    opponent === 'cpu' ? (side === cpuColor ? 'Computer' : 'You') : side === 'w' ? 'White' : 'Black';
  const isActive = turn === side && !over;
  const time = clockMs?.[side] ?? null;

  return (
    <div className={`player-bar${isActive ? ' active' : ''}`}>
      <div className="player-info">
        <span className="player-label">{label}</span>
        <div className="captured-tray">
          {captured.map((type, i) => (
            <img
              key={i}
              src={pieceImages[opponentColor][type]}
              className="captured-piece"
              alt=""
              aria-hidden="true"
            />
          ))}
          {showAdvantage && <span className="advantage">+{Math.abs(advantage)}</span>}
        </div>
      </div>
      {time !== null && (
        <div
          className={`clock${isActive ? ' clock-active' : ''}${time <= 30_000 ? ' clock-low' : ''}`}
        >
          {formatClock(time)}
        </div>
      )}
    </div>
  );
}

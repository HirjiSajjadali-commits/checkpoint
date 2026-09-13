import type { Color } from 'chess.js';
import { useGameStore } from '../store/gameStore';

export default function GameControls() {
  const opponent = useGameStore((s) => s.opponent);
  const cpuColor = useGameStore((s) => s.cpuColor);
  const over = useGameStore((s) => s.result.over);
  const drawOffer = useGameStore((s) => s.drawOffer);
  const resign = useGameStore((s) => s.resign);
  const offerDraw = useGameStore((s) => s.offerDraw);
  const acceptDraw = useGameStore((s) => s.acceptDraw);
  const declineDraw = useGameStore((s) => s.declineDraw);

  if (over) return null;

  const humanColor: Color = cpuColor === 'w' ? 'b' : 'w';

  if (drawOffer) {
    if (opponent === 'cpu' && drawOffer === humanColor) {
      return (
        <div className="game-controls">
          <p className="draw-pending">Draw offer sent — waiting for the computer…</p>
        </div>
      );
    }
    const offererName = drawOffer === 'w' ? 'White' : 'Black';
    return (
      <div className="game-controls">
        <p className="draw-pending">{offererName} offers a draw.</p>
        <button className="btn" onClick={acceptDraw}>
          Accept
        </button>
        <button className="btn" onClick={declineDraw}>
          Decline
        </button>
      </div>
    );
  }

  if (opponent === 'cpu') {
    return (
      <div className="game-controls">
        <button className="btn" onClick={() => offerDraw(humanColor)}>
          Offer draw
        </button>
        <button className="btn btn-danger" onClick={() => resign(humanColor)}>
          Resign
        </button>
      </div>
    );
  }

  return (
    <div className="game-controls">
      <button className="btn" onClick={() => offerDraw('w')}>
        White: offer draw
      </button>
      <button className="btn btn-danger" onClick={() => resign('w')}>
        White resigns
      </button>
      <button className="btn" onClick={() => offerDraw('b')}>
        Black: offer draw
      </button>
      <button className="btn btn-danger" onClick={() => resign('b')}>
        Black resigns
      </button>
    </div>
  );
}

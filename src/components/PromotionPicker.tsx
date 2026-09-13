import { useEffect, useRef } from 'react';
import type { Color } from 'chess.js';
import { pieceImages, pieceName } from '../game/pieceImages';

const CHOICES = ['q', 'r', 'b', 'n'] as const;

export default function PromotionPicker({
  color,
  onChoose,
  onCancel,
}: {
  color: Color;
  onChoose: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="promotion-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Choose promotion piece"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="promotion-title">Promote to</p>
        <div className="promotion-choices">
          {CHOICES.map((piece, i) => (
            <button
              key={piece}
              ref={i === 0 ? firstButtonRef : undefined}
              className="promotion-choice"
              aria-label={pieceName[piece]}
              onClick={() => onChoose(piece)}
            >
              <img src={pieceImages[color][piece]} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

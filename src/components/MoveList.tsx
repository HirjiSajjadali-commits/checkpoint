import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export default function MoveList() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [moveHistory.length]);

  const rows: { num: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    rows.push({ num: i / 2 + 1, white: moveHistory[i], black: moveHistory[i + 1] });
  }

  return (
    <div className="move-list" ref={scrollRef} aria-label="Move list">
      {rows.length === 0 ? (
        <p className="move-list-empty">No moves yet.</p>
      ) : (
        <ol className="move-rows">
          {rows.map((row) => (
            <li key={row.num} className="move-row">
              <span className="move-num">{row.num}.</span>
              <span className="move-san">{row.white}</span>
              <span className="move-san">{row.black ?? ''}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

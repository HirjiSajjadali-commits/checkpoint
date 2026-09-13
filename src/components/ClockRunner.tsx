import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export default function ClockRunner() {
  const timeControl = useGameStore((s) => s.timeControl);
  const hasClock = useGameStore((s) => s.clockMs !== null);
  const turn = useGameStore((s) => s.turn);
  const over = useGameStore((s) => s.result.over);
  const tickClock = useGameStore((s) => s.tickClock);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeControl === 'untimed' || over || !hasClock) return;
    lastTickRef.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const delta = now - (lastTickRef.current ?? now);
      lastTickRef.current = now;
      tickClock(turn, delta);
    }, 200);
    return () => clearInterval(id);
  }, [timeControl, over, turn, hasClock, tickClock]);

  return null;
}

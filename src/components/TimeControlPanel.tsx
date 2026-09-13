import { useGameStore } from '../store/gameStore';
import { TIME_CONTROLS } from '../game/timeControls';

export default function TimeControlPanel() {
  const timeControl = useGameStore((s) => s.timeControl);
  const setTimeControl = useGameStore((s) => s.setTimeControl);

  return (
    <div className="time-controls" role="radiogroup" aria-label="Time control">
      {TIME_CONTROLS.map((tc) => (
        <button
          key={tc.id}
          className="level-btn"
          aria-pressed={timeControl === tc.id}
          onClick={() => setTimeControl(tc.id)}
        >
          {tc.label}
        </button>
      ))}
    </div>
  );
}

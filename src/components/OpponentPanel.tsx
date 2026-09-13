import { useGameStore } from '../store/gameStore';
import { CPU_LEVELS } from '../engine/cpuLevels';

export default function OpponentPanel() {
  const uiTab = useGameStore((s) => s.uiTab);
  const online = useGameStore((s) => s.online);
  const cpuColor = useGameStore((s) => s.cpuColor);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const engineStatus = useGameStore((s) => s.engineStatus);
  const setOpponent = useGameStore((s) => s.setOpponent);
  const setCpuColor = useGameStore((s) => s.setCpuColor);
  const setCpuLevel = useGameStore((s) => s.setCpuLevel);
  const setOrientation = useGameStore((s) => s.setOrientation);
  const setUiTab = useGameStore((s) => s.setUiTab);
  const reset = useGameStore((s) => s.reset);
  const leaveOnlineSession = useGameStore((s) => s.leaveOnlineSession);

  function goLocal() {
    if (online) leaveOnlineSession();
    setUiTab('local');
    setOpponent('human');
    setOrientation('w');
    reset();
  }

  function goCpu() {
    if (online) leaveOnlineSession();
    setUiTab('cpu');
    setOpponent('cpu');
    setOrientation(cpuColor === 'w' ? 'b' : 'w');
    reset();
  }

  function goOnline() {
    setOpponent('human');
    setUiTab('online');
  }

  return (
    <div className="opponent-panel">
      <div className="segmented" role="radiogroup" aria-label="Opponent">
        <button className="segmented-btn" aria-pressed={uiTab === 'local'} onClick={goLocal}>
          Play a friend
        </button>
        <button className="segmented-btn" aria-pressed={uiTab === 'online'} onClick={goOnline}>
          Play online
        </button>
        <button className="segmented-btn" aria-pressed={uiTab === 'cpu'} onClick={goCpu}>
          Play the computer
        </button>
      </div>

      {uiTab === 'cpu' && (
        <div className="cpu-options">
          <div className="cpu-levels" role="radiogroup" aria-label="Computer strength">
            {CPU_LEVELS.map((level) => (
              <button
                key={level.id}
                className="level-btn"
                aria-pressed={cpuLevel === level.id}
                onClick={() => setCpuLevel(level.id)}
              >
                {level.label}
                <span className="rating">{level.ratingLabel}</span>
              </button>
            ))}
          </div>
          <div className="segmented" role="radiogroup" aria-label="Play as">
            <button
              className="segmented-btn"
              aria-pressed={cpuColor === 'b'}
              onClick={() => {
                setCpuColor('b');
                setOrientation('w');
                reset();
              }}
            >
              Play as White
            </button>
            <button
              className="segmented-btn"
              aria-pressed={cpuColor === 'w'}
              onClick={() => {
                setCpuColor('w');
                setOrientation('b');
                reset();
              }}
            >
              Play as Black
            </button>
          </div>
          {engineStatus === 'loading' && <p className="engine-note">Loading engine…</p>}
        </div>
      )}
    </div>
  );
}

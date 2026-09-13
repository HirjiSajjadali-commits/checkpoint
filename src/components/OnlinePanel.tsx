import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import { useGameStore, type RemoteSnapshot } from '../store/gameStore';
import { isSupabaseConfigured, generateRoomCode } from '../online/supabaseClient';
import { createRoom } from '../online/roomApi';
import {
  saveRoomColor,
  loadRoomColor,
  roomUrlFor,
  roomCodeFromUrl,
  clearRoomFromUrl,
} from '../online/roomStorage';
import { timeControlConfig } from '../game/timeControls';

const STATUS_TEXT: Record<string, string> = {
  connecting: 'Connecting…',
  waiting: 'Waiting for your friend to open the link…',
  connected: 'Connected',
  disconnected: 'Reconnecting…',
  error: "Couldn't connect",
};

export default function OnlinePanel() {
  const online = useGameStore((s) => s.online);
  const timeControl = useGameStore((s) => s.timeControl);
  const startOnlineSession = useGameStore((s) => s.startOnlineSession);
  const leaveOnlineSession = useGameStore((s) => s.leaveOnlineSession);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);

  useEffect(() => {
    if (online) return;
    const code = roomCodeFromUrl();
    if (!code) return;
    const savedColor = loadRoomColor(code);
    if (savedColor) {
      startOnlineSession(code, savedColor);
    } else {
      setPendingJoinCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="online-panel">
        <p className="online-note">
          Online play needs a Supabase project configured — see the README.
        </p>
      </div>
    );
  }

  async function handleCreate() {
    setBusy(true);
    const code = generateRoomCode();
    const initialMs = timeControlConfig(timeControl).initialMs;
    const snapshot: RemoteSnapshot = {
      fen: new Chess().fen(),
      lastMove: null,
      moveHistory: [],
      clockMs: initialMs === null ? null : { w: initialMs, b: initialMs },
      result: { over: false, reason: null, winner: null },
      drawOffer: null,
      timeControl,
    };
    const ok = await createRoom(code, snapshot);
    setBusy(false);
    if (!ok) return;
    saveRoomColor(code, 'w');
    startOnlineSession(code, 'w');
    window.history.replaceState({}, '', roomUrlFor(code));
  }

  function handleJoin() {
    if (!pendingJoinCode) return;
    saveRoomColor(pendingJoinCode, 'b');
    startOnlineSession(pendingJoinCode, 'b');
    setPendingJoinCode(null);
  }

  function handleLeave() {
    clearRoomFromUrl();
    leaveOnlineSession();
  }

  async function handleCopyLink() {
    if (!online) return;
    try {
      await navigator.clipboard.writeText(roomUrlFor(online.roomCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the link is still visible to copy manually
    }
  }

  if (pendingJoinCode && !online) {
    return (
      <div className="online-panel">
        <p>You've been invited to room {pendingJoinCode}.</p>
        <button className="btn btn-accent" onClick={handleJoin}>
          Join game
        </button>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="online-panel">
        <button className="btn btn-accent" onClick={handleCreate} disabled={busy}>
          {busy ? 'Creating…' : 'Create online game'}
        </button>
      </div>
    );
  }

  return (
    <div className="online-panel">
      <div className="online-status-row">
        <span className={`online-status online-status-${online.status}`}>
          {STATUS_TEXT[online.status]}
        </span>
        <span className="online-note">Playing as {online.myColor === 'w' ? 'White' : 'Black'}</span>
      </div>
      {online.status === 'waiting' && (
        <div className="online-link-row">
          <code className="online-link">{roomUrlFor(online.roomCode)}</code>
          <button className="btn" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
      <button className="btn btn-danger" onClick={handleLeave}>
        Leave online game
      </button>
    </div>
  );
}

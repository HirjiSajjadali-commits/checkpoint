import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore, type RemoteSnapshot } from '../store/gameStore';
import { supabase } from '../online/supabaseClient';
import { fetchRoom, pushRoomState } from '../online/roomApi';
import { loadRoomColor, roomCodeFromUrl } from '../online/roomStorage';

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000];

export default function OnlineSync() {
  const online = useGameStore((s) => s.online);
  const fen = useGameStore((s) => s.fen);
  const lastMove = useGameStore((s) => s.lastMove);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const clockMs = useGameStore((s) => s.clockMs);
  const result = useGameStore((s) => s.result);
  const drawOffer = useGameStore((s) => s.drawOffer);
  const timeControl = useGameStore((s) => s.timeControl);
  const setOnlineStatus = useGameStore((s) => s.setOnlineStatus);
  const applyRemoteState = useGameStore((s) => s.applyRemoteState);
  const startOnlineSession = useGameStore((s) => s.startOnlineSession);
  const setUiTab = useGameStore((s) => s.setUiTab);
  const setPendingJoinCode = useGameStore((s) => s.setPendingJoinCode);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSyncedRef = useRef<string>('');
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against pushing our just-reset local state before the initial
  // fetch has had a chance to restore the room's real, in-progress position.
  const readyToPushRef = useRef(false);

  // On first load, a room code in the URL means someone opened a shared
  // link (or is reloading mid-game). Auto-rejoin if we know our color
  // already, otherwise surface a join prompt.
  useEffect(() => {
    const code = roomCodeFromUrl();
    if (!code) return;
    const savedColor = loadRoomColor(code);
    if (savedColor) {
      startOnlineSession(code, savedColor);
    } else {
      setPendingJoinCode(code);
      setUiTab('online');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to the room's realtime channel whenever we join/leave a room.
  useEffect(() => {
    if (!online || !supabase) return;
    const { roomCode } = online;
    let cancelled = false;
    readyToPushRef.current = false;

    function connect() {
      if (cancelled || !supabase) return;
      const channel = supabase.channel(`room:${roomCode}`, {
        config: { presence: { key: online!.myColor } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        setOnlineStatus(count >= 2 ? 'connected' : 'waiting');
      });

      channel.on('broadcast', { event: 'state' }, ({ payload }) => {
        lastSyncedRef.current = JSON.stringify(payload);
        applyRemoteState(payload as RemoteSnapshot);
      });

      channel.subscribe(async (status) => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') {
          retryRef.current = 0;
          await channel.track({ joined_at: Date.now() });
          const remote = await fetchRoom(roomCode);
          if (cancelled) return;
          if (remote) {
            lastSyncedRef.current = JSON.stringify(remote);
            applyRemoteState(remote);
          }
          readyToPushRef.current = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setOnlineStatus('disconnected');
          if (cancelled) return;
          const delay = RECONNECT_DELAYS_MS[Math.min(retryRef.current, RECONNECT_DELAYS_MS.length - 1)];
          retryRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => {
            supabase?.removeChannel(channel);
            connect();
          }, delay);
        }
      });

      channelRef.current = channel;
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (channelRef.current) supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.roomCode]);

  // Push local state changes out to Postgres + the live channel.
  useEffect(() => {
    if (!online || !readyToPushRef.current) return;
    const snapshot: RemoteSnapshot = {
      fen,
      lastMove,
      moveHistory,
      clockMs,
      result,
      drawOffer,
      timeControl,
    };
    const signature = JSON.stringify(snapshot);
    if (signature === lastSyncedRef.current) return;
    lastSyncedRef.current = signature;

    void pushRoomState(online.roomCode, snapshot);
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: snapshot });
  }, [online, fen, lastMove, moveHistory, clockMs, result, drawOffer, timeControl]);

  return null;
}

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useGameStore, type RemoteSnapshot } from '../store/gameStore';
import { supabase } from '../online/supabaseClient';
import { fetchRoom, pushRoomState } from '../online/roomApi';

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

  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSyncedRef = useRef<string>('');
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect to the room's realtime channel whenever we join/leave a room.
  useEffect(() => {
    if (!online || !supabase) return;
    const { roomCode } = online;
    let cancelled = false;

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
          if (remote && !cancelled) {
            lastSyncedRef.current = JSON.stringify(remote);
            applyRemoteState(remote);
          }
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
    if (!online) return;
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

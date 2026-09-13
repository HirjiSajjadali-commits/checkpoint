import type { Color } from 'chess.js';

const KEY_PREFIX = 'checkpoint-room-';

export function saveRoomColor(roomCode: string, myColor: Color) {
  try {
    localStorage.setItem(`${KEY_PREFIX}${roomCode}`, JSON.stringify({ myColor }));
  } catch {
    // ignore storage failures (private browsing, etc.)
  }
}

export function loadRoomColor(roomCode: string): Color | null {
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${roomCode}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { myColor: Color };
    return parsed.myColor ?? null;
  } catch {
    return null;
  }
}

export function roomUrlFor(code: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set('room', code);
  return url.toString();
}

export function roomCodeFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('room');
}

export function clearRoomFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('room');
  window.history.replaceState({}, '', url.toString());
}

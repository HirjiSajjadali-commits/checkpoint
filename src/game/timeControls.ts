export type TimeControlId = 'untimed' | 'bullet' | 'blitz' | 'rapid';

export type TimeControlConfig = {
  id: TimeControlId;
  label: string;
  initialMs: number | null;
};

export const TIME_CONTROLS: TimeControlConfig[] = [
  { id: 'untimed', label: 'Untimed', initialMs: null },
  { id: 'bullet', label: 'Bullet · 1 min', initialMs: 60_000 },
  { id: 'blitz', label: 'Blitz · 5 min', initialMs: 5 * 60_000 },
  { id: 'rapid', label: 'Rapid · 10 min', initialMs: 10 * 60_000 },
];

export function timeControlConfig(id: TimeControlId): TimeControlConfig {
  return TIME_CONTROLS.find((t) => t.id === id) ?? TIME_CONTROLS[0];
}

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.ceil(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

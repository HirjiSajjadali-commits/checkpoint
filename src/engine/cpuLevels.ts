import type { CpuLevelId } from '../store/gameStore';
import { ENGINE_MULTI_THREADED_URL, ENGINE_SINGLE_THREADED_URL } from './stockfishEngine';

export type CpuLevelConfig = {
  id: CpuLevelId;
  label: string;
  ratingLabel: string;
  movetimeMs: number;
  options: Record<string, string | number | boolean>;
  /** Prefers the multi-threaded build when the page is cross-origin isolated. */
  preferMultiThreaded?: boolean;
};

// Club/Strong/Expert use Stockfish's own UCI_Elo strength-limiting option
// (its documented range is ~1320-3190), so those ratings are Stockfish's own
// calibration, not a guess. Two levels are intentionally NOT that: Stockfish's
// Elo floor (~1320) can't reach true beginner strength, so "Beginner" instead
// uses Skill Level 0 with a very short search — the "~800" is an estimate,
// not measured. And "Full strength" turns strength-limiting off entirely, so
// there's no Elo figure to show at all — labeled "Uncapped" rather than
// quoting the "3200+" some computer-chess rating lists give Stockfish under
// very different conditions (full-size net, multiple threads, longer
// thinking time) than this lite/single-threaded/2s-per-move browser build.
export const CPU_LEVELS: CpuLevelConfig[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    ratingLabel: '~800',
    movetimeMs: 100,
    options: { 'UCI_LimitStrength': false, 'Skill Level': 0 },
  },
  {
    id: 'club',
    label: 'Club',
    ratingLabel: '~1320',
    movetimeMs: 400,
    options: { 'UCI_LimitStrength': true, 'UCI_Elo': 1320 },
  },
  {
    id: 'strong',
    label: 'Strong',
    ratingLabel: '~1800',
    movetimeMs: 800,
    options: { 'UCI_LimitStrength': true, 'UCI_Elo': 1800 },
  },
  {
    id: 'expert',
    label: 'Expert',
    ratingLabel: '~2400',
    movetimeMs: 1200,
    options: { 'UCI_LimitStrength': true, 'UCI_Elo': 2400 },
  },
  {
    id: 'full',
    label: 'Full strength',
    ratingLabel: 'Uncapped',
    movetimeMs: 2000,
    options: { 'UCI_LimitStrength': false, 'Skill Level': 20 },
    preferMultiThreaded: true,
  },
];

export function cpuLevelConfig(id: CpuLevelId): CpuLevelConfig {
  return CPU_LEVELS.find((l) => l.id === id) ?? CPU_LEVELS[1];
}

/** True when the page is cross-origin isolated, so SharedArrayBuffer (and
 * therefore the multi-threaded engine build) is actually usable. */
export function canUseMultiThreadedEngine(): boolean {
  return typeof self !== 'undefined' && self.crossOriginIsolated === true;
}

export function engineUrlFor(level: CpuLevelConfig): string {
  if (level.preferMultiThreaded && canUseMultiThreadedEngine()) return ENGINE_MULTI_THREADED_URL;
  return ENGINE_SINGLE_THREADED_URL;
}

export function threadsFor(level: CpuLevelConfig): number {
  if (!(level.preferMultiThreaded && canUseMultiThreadedEngine())) return 1;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1;
  return Math.max(1, Math.min(cores - 1, 4));
}

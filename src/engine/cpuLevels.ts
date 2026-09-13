import type { CpuLevelId } from '../store/gameStore';

export type CpuLevelConfig = {
  id: CpuLevelId;
  label: string;
  ratingLabel: string;
  movetimeMs: number;
  options: Record<string, string | number | boolean>;
};

// Approximate mappings onto Stockfish's own strength-limiting UCI options.
// Stockfish's UCI_Elo floor (~1320) can't reach true beginner strength on its
// own, so "Beginner" instead uses Skill Level 0 with a very short search.
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
    ratingLabel: '~1200',
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
    ratingLabel: '3200+',
    movetimeMs: 2000,
    options: { 'UCI_LimitStrength': false, 'Skill Level': 20 },
  },
];

export function cpuLevelConfig(id: CpuLevelId): CpuLevelConfig {
  return CPU_LEVELS.find((l) => l.id === id) ?? CPU_LEVELS[1];
}

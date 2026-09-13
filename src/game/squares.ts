import type { Square, Color } from 'chess.js';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

// row/col are 0-7, row 0 = rank 8, col 0 = file a (i.e. chess.board() order)
export function squareAt(row: number, col: number): Square {
  const file = FILES[col];
  const rank = 8 - row;
  return `${file}${rank}` as Square;
}

export function squareToRowCol(square: Square): { row: number; col: number } {
  const file = square[0];
  const rank = Number(square[1]);
  return { row: 8 - rank, col: FILES.indexOf(file as (typeof FILES)[number]) };
}

// Convert a "visual" position (as displayed on screen) to a board row/col,
// accounting for board orientation. Visual row/col 0,0 is always the
// top-left square as rendered.
export function visualToRowCol(
  visualRow: number,
  visualCol: number,
  orientation: Color,
): { row: number; col: number } {
  if (orientation === 'w') return { row: visualRow, col: visualCol };
  return { row: 7 - visualRow, col: 7 - visualCol };
}

export function rowColToVisual(
  row: number,
  col: number,
  orientation: Color,
): { visualRow: number; visualCol: number } {
  if (orientation === 'w') return { visualRow: row, visualCol: col };
  return { visualRow: 7 - row, visualCol: 7 - col };
}

export function squareColor(square: Square): 'light' | 'dark' {
  const { row, col } = squareToRowCol(square);
  return (row + col) % 2 === 0 ? 'light' : 'dark';
}

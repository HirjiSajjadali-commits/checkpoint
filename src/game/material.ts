import type { Color, PieceSymbol } from 'chess.js';
import type { BoardSquare } from '../store/gameStore';

const STARTING_COUNTS: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const PIECE_VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const CAPTURABLE_TYPES: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

export type MaterialInfo = {
  capturedBy: Record<Color, PieceSymbol[]>;
  advantage: number; // positive = white ahead
};

export function computeMaterial(board: BoardSquare[][]): MaterialInfo {
  const onBoard: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of board) {
    for (const cell of row) {
      if (cell) onBoard[cell.color][cell.type] += 1;
    }
  }

  const capturedBy: Record<Color, PieceSymbol[]> = { w: [], b: [] };
  let whiteValue = 0;
  let blackValue = 0;

  for (const type of CAPTURABLE_TYPES) {
    const blackLost = STARTING_COUNTS[type] - onBoard.b[type];
    const whiteLost = STARTING_COUNTS[type] - onBoard.w[type];
    for (let i = 0; i < blackLost; i++) capturedBy.w.push(type);
    for (let i = 0; i < whiteLost; i++) capturedBy.b.push(type);
    whiteValue += blackLost * PIECE_VALUE[type];
    blackValue += whiteLost * PIECE_VALUE[type];
  }

  const byValueDesc = (a: PieceSymbol, b: PieceSymbol) => PIECE_VALUE[b] - PIECE_VALUE[a];
  capturedBy.w.sort(byValueDesc);
  capturedBy.b.sort(byValueDesc);

  return { capturedBy, advantage: whiteValue - blackValue };
}

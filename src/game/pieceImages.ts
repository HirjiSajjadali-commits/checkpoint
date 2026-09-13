import wP from '../assets/pieces/wP.svg';
import wN from '../assets/pieces/wN.svg';
import wB from '../assets/pieces/wB.svg';
import wR from '../assets/pieces/wR.svg';
import wQ from '../assets/pieces/wQ.svg';
import wK from '../assets/pieces/wK.svg';
import bP from '../assets/pieces/bP.svg';
import bN from '../assets/pieces/bN.svg';
import bB from '../assets/pieces/bB.svg';
import bR from '../assets/pieces/bR.svg';
import bQ from '../assets/pieces/bQ.svg';
import bK from '../assets/pieces/bK.svg';
import type { Color, PieceSymbol } from 'chess.js';

export const pieceImages: Record<Color, Record<PieceSymbol, string>> = {
  w: { p: wP, n: wN, b: wB, r: wR, q: wQ, k: wK },
  b: { p: bP, n: bN, b: bB, r: bR, q: bQ, k: bK },
};

export const pieceName: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

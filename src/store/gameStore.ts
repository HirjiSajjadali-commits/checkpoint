import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { Color, PieceSymbol, Square } from 'chess.js';
import { pieceName } from '../game/pieceImages';

export type BoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

export type GameResult = {
  over: boolean;
  reason: 'checkmate' | 'stalemate' | 'draw' | null;
  winner: Color | null;
};

export type PendingPromotion = { from: Square; to: Square; color: Color };

interface GameState {
  chess: Chess;
  fen: string;
  board: BoardSquare[][];
  turn: Color;
  orientation: Color;
  selectedSquare: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  checkSquare: Square | null;
  pendingPromotion: PendingPromotion | null;
  result: GameResult;
  announcement: string;

  selectSquare: (square: Square) => void;
  clearSelection: () => void;
  tryMove: (from: Square, to: Square) => void;
  resolvePromotion: (piece: 'q' | 'r' | 'b' | 'n') => void;
  cancelPromotion: () => void;
  flipBoard: () => void;
  reset: () => void;
}

function findKingSquare(chess: Chess, color: Color): Square | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square;
    }
  }
  return null;
}

function deriveStateFromChess(chess: Chess, lastMove: { from: Square; to: Square } | null) {
  const turn = chess.turn();
  const inCheck = chess.inCheck();
  let reason: GameResult['reason'] = null;
  let winner: Color | null = null;
  if (chess.isCheckmate()) {
    reason = 'checkmate';
    winner = turn === 'w' ? 'b' : 'w';
  } else if (chess.isStalemate()) {
    reason = 'stalemate';
  } else if (chess.isDraw()) {
    reason = 'draw';
  }
  return {
    fen: chess.fen(),
    board: chess.board(),
    turn,
    lastMove,
    checkSquare: inCheck ? findKingSquare(chess, turn) : null,
    result: { over: reason !== null, reason, winner },
  };
}

function describeMove(chess: Chess, san: string, moverColor: Color, result: GameResult): string {
  const colorName = moverColor === 'w' ? 'White' : 'Black';
  let text = `${colorName} plays ${san}.`;
  if (result.reason === 'checkmate') {
    text += ` Checkmate. ${colorName} wins.`;
  } else if (result.reason === 'stalemate') {
    text += ' Stalemate. Game drawn.';
  } else if (result.reason === 'draw') {
    text += ' Draw.';
  } else if (chess.inCheck()) {
    text += ' Check.';
  }
  return text;
}

function executeMove(
  chess: Chess,
  from: Square,
  to: Square,
  promotion?: 'q' | 'r' | 'b' | 'n',
) {
  const moverColor = chess.turn();
  const move = chess.move({ from, to, promotion });
  const derived = deriveStateFromChess(chess, { from, to });
  const announcement = describeMove(chess, move.san, moverColor, derived.result);
  return { derived, announcement };
}

export const useGameStore = create<GameState>((set, get) => ({
  chess: new Chess(),
  fen: new Chess().fen(),
  board: new Chess().board(),
  turn: 'w',
  orientation: 'w',
  selectedSquare: null,
  legalTargets: [],
  lastMove: null,
  checkSquare: null,
  pendingPromotion: null,
  result: { over: false, reason: null, winner: null },
  announcement: '',

  selectSquare: (square) => {
    const { chess, result } = get();
    if (result.over) return;
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      set({ selectedSquare: null, legalTargets: [] });
      return;
    }
    const moves = chess.moves({ square, verbose: true });
    set({ selectedSquare: square, legalTargets: moves.map((m) => m.to as Square) });
  },

  clearSelection: () => set({ selectedSquare: null, legalTargets: [] }),

  tryMove: (from, to) => {
    const { chess, result } = get();
    if (result.over) return;
    const moves = chess.moves({ square: from, verbose: true });
    const candidate = moves.find((m) => m.to === to);
    if (!candidate) {
      // Not a legal destination for this piece — cancel drag, keep selection.
      return;
    }
    if (candidate.promotion) {
      set({
        pendingPromotion: { from, to, color: chess.turn() },
        selectedSquare: from,
        legalTargets: moves.map((m) => m.to as Square),
      });
      return;
    }
    const { derived, announcement } = executeMove(chess, from, to);
    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      announcement,
    });
  },

  resolvePromotion: (piece) => {
    const { chess, pendingPromotion } = get();
    if (!pendingPromotion) return;
    const { derived, announcement } = executeMove(
      chess,
      pendingPromotion.from,
      pendingPromotion.to,
      piece,
    );
    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      announcement,
    });
  },

  cancelPromotion: () => set({ pendingPromotion: null, selectedSquare: null, legalTargets: [] }),

  flipBoard: () => set((s) => ({ orientation: s.orientation === 'w' ? 'b' : 'w' })),

  reset: () => {
    const chess = new Chess();
    set({
      chess,
      fen: chess.fen(),
      board: chess.board(),
      turn: 'w',
      selectedSquare: null,
      legalTargets: [],
      lastMove: null,
      checkSquare: null,
      pendingPromotion: null,
      result: { over: false, reason: null, winner: null },
      announcement: 'New game. White to move.',
    });
  },
}));

export { pieceName };

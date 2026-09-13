import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { Color, PieceSymbol, Square } from 'chess.js';
import { pieceName } from '../game/pieceImages';
import { timeControlConfig, type TimeControlId } from '../game/timeControls';
import { playCaptureSound, playCheckSound, playGameEndSound, playMoveSound } from '../audio/sounds';

export type BoardSquare = { square: Square; type: PieceSymbol; color: Color } | null;

export type GameResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'draw-agreed'
  | 'resignation'
  | 'timeout'
  | null;

export type GameResult = {
  over: boolean;
  reason: GameResultReason;
  winner: Color | null;
};

export type PendingPromotion = { from: Square; to: Square; color: Color };

export type CpuLevelId = 'beginner' | 'club' | 'strong' | 'expert' | 'full';
export type EngineStatus = 'idle' | 'loading' | 'ready' | 'thinking';

export type OnlineStatus = 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'error';
export type OnlineSession = { roomCode: string; myColor: Color; status: OnlineStatus } | null;

export type RemoteSnapshot = {
  fen: string;
  lastMove: { from: Square; to: Square } | null;
  moveHistory: string[];
  clockMs: { w: number; b: number } | null;
  result: GameResult;
  drawOffer: Color | null;
  timeControl: TimeControlId;
};

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
  moveHistory: string[];

  opponent: 'human' | 'cpu';
  cpuColor: Color;
  cpuLevel: CpuLevelId;
  engineStatus: EngineStatus;
  gameId: number;

  timeControl: TimeControlId;
  clockMs: { w: number; b: number } | null;
  drawOffer: Color | null;

  online: OnlineSession;
  uiTab: 'local' | 'cpu' | 'online';
  pendingJoinCode: string | null;

  selectSquare: (square: Square) => void;
  clearSelection: () => void;
  tryMove: (from: Square, to: Square) => void;
  resolvePromotion: (piece: 'q' | 'r' | 'b' | 'n') => void;
  cancelPromotion: () => void;
  flipBoard: () => void;
  setOrientation: (color: Color) => void;
  reset: () => void;
  setOpponent: (mode: 'human' | 'cpu') => void;
  setCpuColor: (color: Color) => void;
  setCpuLevel: (level: CpuLevelId) => void;
  setEngineStatus: (status: EngineStatus) => void;
  playEngineMove: (from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n') => void;
  setTimeControl: (id: TimeControlId) => void;
  tickClock: (color: Color, deltaMs: number) => void;
  offerDraw: (by: Color) => void;
  acceptDraw: () => void;
  declineDraw: () => void;
  resign: (by: Color) => void;
  startOnlineSession: (roomCode: string, myColor: Color) => void;
  setOnlineStatus: (status: OnlineStatus) => void;
  leaveOnlineSession: () => void;
  applyRemoteState: (snapshot: RemoteSnapshot) => void;
  setUiTab: (tab: 'local' | 'cpu' | 'online') => void;
  setPendingJoinCode: (code: string | null) => void;
}

function findKingSquare(chess: Chess, color: Color): Square | null {
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === color) return cell.square;
    }
  }
  return null;
}

function deriveBoardState(chess: Chess, lastMove: { from: Square; to: Square } | null) {
  const turn = chess.turn();
  const inCheck = chess.inCheck();
  let reason: GameResultReason = null;
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

function playSoundForMove(capture: boolean, result: GameResult, inCheck: boolean) {
  if (result.over) playGameEndSound();
  else if (inCheck) playCheckSound();
  else if (capture) playCaptureSound();
  else playMoveSound();
}

function executeMove(
  chess: Chess,
  from: Square,
  to: Square,
  previousHistory: string[],
  promotion?: 'q' | 'r' | 'b' | 'n',
) {
  const moverColor = chess.turn();
  const move = chess.move({ from, to, promotion });
  const derived = deriveBoardState(chess, { from, to });
  const moveHistory = [...previousHistory, move.san];
  const announcement = describeMove(chess, move.san, moverColor, derived.result);
  playSoundForMove(move.captured !== undefined, derived.result, chess.inCheck());
  return { derived, moveHistory, announcement };
}

function initialClock(timeControl: TimeControlId): GameState['clockMs'] {
  const initialMs = timeControlConfig(timeControl).initialMs;
  return initialMs === null ? null : { w: initialMs, b: initialMs };
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
  moveHistory: [],

  opponent: 'human',
  cpuColor: 'b',
  cpuLevel: 'club',
  engineStatus: 'idle',
  gameId: 0,

  timeControl: 'untimed',
  clockMs: null,
  drawOffer: null,

  online: null,
  uiTab: 'local',
  pendingJoinCode: null,

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
    const { chess, result, moveHistory } = get();
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
    const { derived, moveHistory: newHistory, announcement } = executeMove(
      chess,
      from,
      to,
      moveHistory,
    );
    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      announcement,
      drawOffer: null,
      moveHistory: newHistory,
    });
  },

  resolvePromotion: (piece) => {
    const { chess, pendingPromotion, moveHistory } = get();
    if (!pendingPromotion) return;
    const { derived, moveHistory: newHistory, announcement } = executeMove(
      chess,
      pendingPromotion.from,
      pendingPromotion.to,
      moveHistory,
      piece,
    );
    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      announcement,
      drawOffer: null,
      moveHistory: newHistory,
    });
  },

  cancelPromotion: () => set({ pendingPromotion: null, selectedSquare: null, legalTargets: [] }),

  flipBoard: () => set((s) => ({ orientation: s.orientation === 'w' ? 'b' : 'w' })),
  setOrientation: (color) => set({ orientation: color }),

  reset: () => {
    const chess = new Chess();
    set((s) => ({
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
      moveHistory: [],
      gameId: s.gameId + 1,
      clockMs: initialClock(s.timeControl),
      drawOffer: null,
    }));
  },

  setOpponent: (mode) => set({ opponent: mode }),
  setCpuColor: (color) => set({ cpuColor: color }),
  setCpuLevel: (level) => set({ cpuLevel: level }),
  setEngineStatus: (status) => set({ engineStatus: status }),

  playEngineMove: (from, to, promotion) => {
    const { chess, result, moveHistory } = get();
    if (result.over) return;
    const { derived, moveHistory: newHistory, announcement } = executeMove(
      chess,
      from,
      to,
      moveHistory,
      promotion,
    );
    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      announcement,
      drawOffer: null,
      moveHistory: newHistory,
    });
  },

  setTimeControl: (id) => {
    set({ timeControl: id });
    get().reset();
  },

  tickClock: (color, deltaMs) => {
    const { clockMs, result } = get();
    if (!clockMs || result.over) return;
    const remaining = Math.max(0, clockMs[color] - deltaMs);
    const newClockMs = { ...clockMs, [color]: remaining };
    if (remaining <= 0) {
      const winner = color === 'w' ? 'b' : 'w';
      const colorName = color === 'w' ? 'White' : 'Black';
      const winnerName = winner === 'w' ? 'White' : 'Black';
      playGameEndSound();
      set({
        clockMs: newClockMs,
        result: { over: true, reason: 'timeout', winner },
        announcement: `${colorName} ran out of time. ${winnerName} wins.`,
      });
    } else {
      set({ clockMs: newClockMs });
    }
  },

  offerDraw: (by) => set({ drawOffer: by }),
  declineDraw: () => set({ drawOffer: null }),

  acceptDraw: () => {
    playGameEndSound();
    set({
      drawOffer: null,
      result: { over: true, reason: 'draw-agreed', winner: null },
      announcement: 'Draw agreed.',
    });
  },

  resign: (by) => {
    const winner = by === 'w' ? 'b' : 'w';
    const colorName = by === 'w' ? 'White' : 'Black';
    const winnerName = winner === 'w' ? 'White' : 'Black';
    playGameEndSound();
    set({
      drawOffer: null,
      result: { over: true, reason: 'resignation', winner },
      announcement: `${colorName} resigns. ${winnerName} wins.`,
    });
  },

  startOnlineSession: (roomCode, myColor) => {
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
      announcement: 'Waiting for opponent…',
      moveHistory: [],
      opponent: 'human',
      orientation: myColor,
      online: { roomCode, myColor, status: 'connecting' },
      uiTab: 'online',
    });
  },

  setOnlineStatus: (status) =>
    set((s) => (s.online ? { online: { ...s.online, status } } : {})),

  leaveOnlineSession: () => {
    set({ online: null });
    get().reset();
  },

  applyRemoteState: (snapshot) => {
    const { chess, moveHistory: prevHistory, result: prevResult } = get();
    try {
      chess.load(snapshot.fen);
    } catch {
      return;
    }
    const derived = deriveBoardState(chess, snapshot.lastMove);
    const newlyOver = snapshot.result.over && !prevResult.over;
    let announcement = '';

    if (snapshot.moveHistory.length > prevHistory.length) {
      const san = snapshot.moveHistory[snapshot.moveHistory.length - 1];
      const moverName = derived.turn === 'w' ? 'Black' : 'White';
      announcement = `${moverName} plays ${san}.`;
      if (snapshot.result.reason === 'checkmate') {
        announcement += ` Checkmate. ${moverName} wins.`;
      } else if (snapshot.result.reason === 'stalemate') {
        announcement += ' Stalemate. Game drawn.';
      } else if (snapshot.result.reason === 'draw') {
        announcement += ' Draw.';
      } else if (derived.checkSquare) {
        announcement += ' Check.';
      }
      if (newlyOver) playGameEndSound();
      else if (derived.checkSquare) playCheckSound();
      else playMoveSound();
    } else if (newlyOver) {
      const winnerName = snapshot.result.winner === 'w' ? 'White' : 'Black';
      const loserName = snapshot.result.winner === 'w' ? 'Black' : 'White';
      if (snapshot.result.reason === 'resignation') {
        announcement = `${loserName} resigns. ${winnerName} wins.`;
      } else if (snapshot.result.reason === 'draw-agreed') {
        announcement = 'Draw agreed.';
      } else if (snapshot.result.reason === 'timeout') {
        announcement = `${loserName} ran out of time. ${winnerName} wins.`;
      }
      playGameEndSound();
    }

    set({
      ...derived,
      selectedSquare: null,
      legalTargets: [],
      pendingPromotion: null,
      moveHistory: snapshot.moveHistory,
      clockMs: snapshot.clockMs,
      drawOffer: snapshot.drawOffer,
      timeControl: snapshot.timeControl,
      result: snapshot.result,
      announcement: announcement || get().announcement,
    });
  },

  setUiTab: (tab) => set({ uiTab: tab }),
  setPendingJoinCode: (code) => set({ pendingJoinCode: code }),
}));

export { pieceName };

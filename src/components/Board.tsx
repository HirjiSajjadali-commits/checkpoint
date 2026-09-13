import { useMemo, useRef, useState } from 'react';
import type { Square } from 'chess.js';
import { useGameStore, type BoardSquare } from '../store/gameStore';
import { pieceImages, pieceName } from '../game/pieceImages';
import {
  rowColToVisual,
  squareAt,
  squareToRowCol,
  visualToRowCol,
} from '../game/squares';
import PromotionPicker from './PromotionPicker';

type DragState = { from: Square; piece: NonNullable<BoardSquare>; x: number; y: number };

export default function Board() {
  const board = useGameStore((s) => s.board);
  const orientation = useGameStore((s) => s.orientation);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalTargets = useGameStore((s) => s.legalTargets);
  const lastMove = useGameStore((s) => s.lastMove);
  const checkSquare = useGameStore((s) => s.checkSquare);
  const pendingPromotion = useGameStore((s) => s.pendingPromotion);
  const result = useGameStore((s) => s.result);
  const turn = useGameStore((s) => s.turn);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const tryMove = useGameStore((s) => s.tryMove);
  const resolvePromotion = useGameStore((s) => s.resolvePromotion);
  const cancelPromotion = useGameStore((s) => s.cancelPromotion);
  const opponent = useGameStore((s) => s.opponent);
  const cpuColor = useGameStore((s) => s.cpuColor);
  const isCpuTurn = opponent === 'cpu' && turn === cpuColor;

  const boardMap = useMemo(() => {
    const m = new Map<Square, NonNullable<BoardSquare>>();
    board.flat().forEach((cell) => {
      if (cell) m.set(cell.square, cell);
    });
    return m;
  }, [board]);

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragMoved = useRef(false);
  const [focusSquare, setFocusSquare] = useState<Square>('e1' as Square);
  const squareRefs = useRef(new Map<Square, HTMLDivElement>());
  const legalTargetSet = useMemo(() => new Set(legalTargets), [legalTargets]);

  function handlePointerDown(e: React.PointerEvent, square: Square) {
    if (result.over || pendingPromotion || isCpuTurn) return;
    const cell = boardMap.get(square);
    if (cell && cell.color === turn) {
      selectSquare(square);
      dragMoved.current = false;
      setDrag({ from: square, piece: cell, x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } else if (selectedSquare && legalTargetSet.has(square)) {
      tryMove(selectedSquare, square);
    } else {
      clearSelection();
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag) return;
    dragMoved.current = true;
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const targetEl = el?.closest<HTMLElement>('[data-square]');
    const targetSquare = targetEl?.dataset.square as Square | undefined;
    if (dragMoved.current && targetSquare && targetSquare !== drag.from) {
      tryMove(drag.from, targetSquare);
    }
    setDrag(null);
  }

  function focusVisual(visualRow: number, visualCol: number) {
    const { row, col } = visualToRowCol(visualRow, visualCol, orientation);
    const target = squareAt(row, col);
    squareRefs.current.get(target)?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, square: Square) {
    const { row, col } = squareToRowCol(square);
    const { visualRow, visualCol } = rowColToVisual(row, col, orientation);
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        focusVisual(Math.max(0, visualRow - 1), visualCol);
        return;
      case 'ArrowDown':
        e.preventDefault();
        focusVisual(Math.min(7, visualRow + 1), visualCol);
        return;
      case 'ArrowLeft':
        e.preventDefault();
        focusVisual(visualRow, Math.max(0, visualCol - 1));
        return;
      case 'ArrowRight':
        e.preventDefault();
        focusVisual(visualRow, Math.min(7, visualCol + 1));
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (result.over || pendingPromotion || isCpuTurn) return;
        if (selectedSquare === square) {
          clearSelection();
        } else if (selectedSquare && legalTargetSet.has(square)) {
          tryMove(selectedSquare, square);
        } else {
          selectSquare(square);
        }
        return;
      case 'Escape':
        clearSelection();
        return;
      default:
        return;
    }
  }

  const rows = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="board-wrap">
      <div
        className={`board${isCpuTurn ? ' board--locked' : ''}`}
        role="grid"
        aria-label="Chess board"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {rows.map((visualRow) => (
          <div key={visualRow} role="row" className="board-row">
            {rows.map((visualCol) => {
              const { row, col } = visualToRowCol(visualRow, visualCol, orientation);
              const square = squareAt(row, col);
              const cell = boardMap.get(square);
              const isLight = (row + col) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isLegal = legalTargetSet.has(square);
              const isLastMove = lastMove?.from === square || lastMove?.to === square;
              const isCheck = checkSquare === square;
              const isBeingDragged = drag?.from === square;
              const isFocused = focusSquare === square;

              const label = [
                square,
                cell ? `${cell.color === 'w' ? 'white' : 'black'} ${pieceName[cell.type]}` : 'empty',
                isCheck ? 'king in check' : '',
                isSelected ? 'selected' : '',
                isLegal ? 'legal move' : '',
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={square}
                  ref={(el) => {
                    if (el) squareRefs.current.set(square, el);
                    else squareRefs.current.delete(square);
                  }}
                  data-square={square}
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  aria-label={label}
                  className={[
                    'square',
                    isLight ? 'light' : 'dark',
                    isSelected ? 'selected' : '',
                    isLastMove ? 'last-move' : '',
                    isCheck ? 'check' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onFocus={() => setFocusSquare(square)}
                  onKeyDown={(e) => handleKeyDown(e, square)}
                  onPointerDown={(e) => handlePointerDown(e, square)}
                >
                  {isLegal && (
                    <span className={cell ? 'legal-ring' : 'legal-dot'} aria-hidden="true" />
                  )}
                  {cell && !isBeingDragged && (
                    <img
                      className="piece"
                      src={pieceImages[cell.color][cell.type]}
                      alt=""
                      draggable={false}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {drag && (
        <img
          className="piece dragging-piece"
          src={pieceImages[drag.piece.color][drag.piece.type]}
          alt=""
          draggable={false}
          style={{ left: drag.x, top: drag.y }}
        />
      )}

      {pendingPromotion && (
        <PromotionPicker
          color={pendingPromotion.color}
          onChoose={resolvePromotion}
          onCancel={cancelPromotion}
        />
      )}
    </div>
  );
}

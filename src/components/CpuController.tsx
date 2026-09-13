import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { StockfishEngine } from '../engine/stockfishEngine';
import { cpuLevelConfig } from '../engine/cpuLevels';
import { computeMaterial } from '../game/material';

export default function CpuController() {
  const opponent = useGameStore((s) => s.opponent);
  const cpuColor = useGameStore((s) => s.cpuColor);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const turn = useGameStore((s) => s.turn);
  const fen = useGameStore((s) => s.fen);
  const over = useGameStore((s) => s.result.over);
  const gameId = useGameStore((s) => s.gameId);
  const drawOffer = useGameStore((s) => s.drawOffer);
  const setEngineStatus = useGameStore((s) => s.setEngineStatus);
  const playEngineMove = useGameStore((s) => s.playEngineMove);
  const acceptDraw = useGameStore((s) => s.acceptDraw);
  const declineDraw = useGameStore((s) => s.declineDraw);

  const engineRef = useRef<StockfishEngine | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (opponent !== 'cpu' || engineRef.current) return;
    setEngineStatus('loading');
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine.whenReady().then(() => setEngineStatus('ready'));
  }, [opponent, setEngineStatus]);

  useEffect(
    () => () => {
      engineRef.current?.terminate();
      engineRef.current = null;
    },
    [],
  );

  useEffect(() => {
    engineRef.current?.newGame();
  }, [gameId]);

  useEffect(() => {
    const engine = engineRef.current;
    if (opponent !== 'cpu' || over || turn !== cpuColor || !engine) return;

    let cancelled = false;
    const requestId = ++requestIdRef.current;
    const level = cpuLevelConfig(cpuLevel);

    setEngineStatus('thinking');
    engine
      .configure(level.options)
      .then(() => engine.findBestMove(fen, level.movetimeMs))
      .then((move) => {
        if (cancelled || requestId !== requestIdRef.current || !move) return;
        setEngineStatus('ready');
        playEngineMove(move.from, move.to, move.promotion);
      });

    return () => {
      cancelled = true;
    };
  }, [opponent, cpuColor, cpuLevel, turn, fen, over, playEngineMove, setEngineStatus]);

  useEffect(() => {
    const humanColor = cpuColor === 'w' ? 'b' : 'w';
    if (opponent !== 'cpu' || drawOffer !== humanColor) return;

    const timeout = setTimeout(() => {
      const { advantage } = computeMaterial(useGameStore.getState().board);
      const cpuAdvantage = cpuColor === 'w' ? advantage : -advantage;
      if (cpuAdvantage < 2) acceptDraw();
      else declineDraw();
    }, 900);

    return () => clearTimeout(timeout);
  }, [opponent, cpuColor, drawOffer, acceptDraw, declineDraw]);

  return null;
}

import type { Square } from 'chess.js';

export type EngineMove = { from: Square; to: Square; promotion?: 'q' | 'r' | 'b' | 'n' };

export const ENGINE_SINGLE_THREADED_URL = '/engine/stockfish-18-lite-single.js';
export const ENGINE_MULTI_THREADED_URL = '/engine/stockfish-18-lite-multi.js';

function parseUciMove(uci: string): EngineMove {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promotion = uci.length > 4 ? (uci.slice(4, 5) as 'q' | 'r' | 'b' | 'n') : undefined;
  return { from, to, promotion };
}

export class StockfishEngine {
  private worker: Worker;
  private ready: Promise<void>;
  private bestMoveResolvers: Array<(move: EngineMove | null) => void> = [];

  readonly engineUrl: string;

  constructor(engineUrl: string = ENGINE_SINGLE_THREADED_URL) {
    this.engineUrl = engineUrl;
    this.worker = new Worker(engineUrl);
    this.ready = new Promise((resolve) => {
      const onMessage = (e: MessageEvent<string>) => {
        if (e.data === 'readyok') {
          this.worker.removeEventListener('message', onMessage);
          resolve();
        }
      };
      this.worker.addEventListener('message', onMessage);
    });
    this.worker.addEventListener('message', (e: MessageEvent<string>) => {
      this.handleMessage(e.data);
    });
    this.worker.postMessage('uci');
    this.worker.postMessage('isready');
  }

  private handleMessage(line: string) {
    if (typeof line !== 'string' || !line.startsWith('bestmove')) return;
    const uci = line.split(' ')[1];
    const resolver = this.bestMoveResolvers.shift();
    if (!resolver) return;
    resolver(!uci || uci === '(none)' ? null : parseUciMove(uci));
  }

  async whenReady(): Promise<void> {
    await this.ready;
  }

  async configure(options: Record<string, string | number | boolean>): Promise<void> {
    await this.ready;
    for (const [name, value] of Object.entries(options)) {
      this.worker.postMessage(`setoption name ${name} value ${value}`);
    }
  }

  newGame() {
    this.worker.postMessage('ucinewgame');
  }

  async findBestMove(fen: string, movetimeMs: number): Promise<EngineMove | null> {
    await this.ready;
    return new Promise((resolve) => {
      this.bestMoveResolvers.push(resolve);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go movetime ${movetimeMs}`);
    });
  }

  terminate() {
    this.worker.postMessage('quit');
    this.worker.terminate();
  }
}

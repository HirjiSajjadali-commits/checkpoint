# Checkpoint

A real, fully-playable chess site. Play a friend over a shareable link, or
play the computer at a rating you choose. No accounts, no login — pick up a
link and play.

This is a portfolio piece: everything in it is real and fully working (legal
moves enforced by an actual rules engine, a real chess engine for the
computer, real multiplayer sync), scoped as a demo rather than a
persistent-account product.

## Features

- **Real rules engine** — [chess.js](https://github.com/jhlywa/chess.js)
  enforces legal moves, check, checkmate, stalemate, and draws. Nothing here
  is a visual approximation.
- **Computer opponent** — [Stockfish 18](https://github.com/nmrugg/stockfish.js)
  compiled to WASM, running entirely in a Web Worker on your device. Five
  strength presets from Beginner to Full strength.
- **Play a friend online** — create a room, share the link, and moves sync
  live over [Supabase](https://supabase.com) Realtime. Reload mid-game and
  you rejoin where you left off.
- **Play a friend locally** — pass-and-play on one device.
- Click-to-move and drag-and-drop, both touch-friendly.
- Time controls (Bullet/Blitz/Rapid/Untimed) with a per-side clock.
- Move list in algebraic notation, captured-pieces tray, material-advantage
  badge.
- Resign and draw offer/accept.
- Move, capture, check, and game-end sounds — synthesized in-browser via the
  Web Audio API, so there are no audio files to license.
- Light/dark theme, matching your system by default.
- Full keyboard navigation (arrow keys + Enter, roving-tabindex grid) and an
  ARIA live region announcing moves, for accessibility.

## Stack

- Vite + React + TypeScript
- [chess.js](https://github.com/jhlywa/chess.js) for rules/legality
- [Stockfish.js](https://github.com/nmrugg/stockfish.js) (WASM, lite
  single-threaded build) for the CPU opponent
- [Supabase](https://supabase.com) (Postgres + Realtime, free tier, no auth)
  for online multiplayer — a "room" is just a short random code, not an
  account
- [Zustand](https://github.com/pmndrs/zustand) for state
- Deployed on [Vercel](https://vercel.com)

## Running locally

```bash
npm install
npm run dev
```

Local/CPU play works immediately. Online play needs a Supabase project —
see below.

### Setting up online play

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your project and run [`supabase/schema.sql`](supabase/schema.sql).
   That creates the one `rooms` table this app needs, with row-level-security
   policies scoped to "anyone who knows the room code."
3. Copy your project's URL and anon/publishable key (**Settings → API**).
4. Create a `.env.local` file (see [`.env.example`](.env.example)):

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

5. Restart the dev server. Without these variables, everything else works
   normally — the "Play online" tab just shows a short explanation instead
   of the create/join UI.

### Scripts

```bash
npm run dev      # dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
```

## How online play works

There's no login: a room is a short random code in the URL
(`?room=XXXXX`). Whoever creates a room plays White; whoever opens the link
plays Black. Game state (position, move list, clock, draw offers) is synced
two ways — written to Postgres so a reload can restore the game in progress,
and broadcast over a Realtime channel for instant delivery to whoever's
connected. Which color you are in a given room is remembered in
`localStorage`, so refreshing the page rejoins you to the same seat.

This is intentionally lightweight: good enough for two friends sharing a
link, not a general-purpose backend. Anyone with a room's code can read or
write that room — there's no way around that without adding real accounts,
which was out of scope for this project.

## Project structure

```
src/
  components/   UI components (board, panels, modals)
  store/        zustand game state
  game/         chess helpers (squares, material, time controls) — pure, no React
  engine/       Stockfish worker wrapper + strength presets
  online/       Supabase client, room API, localStorage helpers
  audio/        synthesized sound effects
  hooks/        small reusable hooks (focus trap, theme)
supabase/
  schema.sql    one-time table + RLS setup for online play
public/
  engine/       vendored Stockfish WASM build
  assets/pieces/  cburnett piece set (see CREDITS.txt)
```

## Credits

Third-party assets (piece set, chess engine) are listed with their licenses
in [`CREDITS.txt`](CREDITS.txt).

## Build history

Built in phases, each committed separately:

0. Board rendering, click/drag movement, full chess.js legality
1. Stockfish CPU opponent + rating selector
2. Clock, move list, captured pieces, sound, game-over modal
3. Online multiplayer via Supabase Realtime
4. Polish: accessibility, mobile, theme toggle, docs, CI, deploy

-- Checkpoint — online multiplayer room state.
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL Editor → New query).
--
-- There is no auth/accounts in this app: a "room" is just a short random code
-- in the URL, and anyone who knows the code can read and write that one row.
-- That's an intentional, minimal security model for a demo/portfolio project,
-- not one that would be appropriate for anything sensitive.

create table if not exists public.rooms (
  code text primary key,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

-- Anyone with the anon key can read or write any room row. Combined with a
-- random, hard-to-guess room code, this is enough for casual friend-to-friend
-- games without needing real authentication.
create policy "rooms are readable by anyone" on public.rooms
  for select using (true);

create policy "rooms are insertable by anyone" on public.rooms
  for insert with check (true);

create policy "rooms are updatable by anyone" on public.rooms
  for update using (true);

-- Optional housekeeping: rooms older than a day are safe to prune, since
-- games are ephemeral and nothing else references a room's code. Run this
-- manually, or wire it to a Supabase scheduled function if you want it automatic.
-- delete from public.rooms where updated_at < now() - interval '1 day';

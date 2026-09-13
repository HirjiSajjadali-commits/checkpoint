import { supabase } from './supabaseClient';
import type { RemoteSnapshot } from '../store/gameStore';

type RoomRow = { code: string; state: RemoteSnapshot };

export async function fetchRoom(code: string): Promise<RemoteSnapshot | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('rooms')
    .select('state')
    .eq('code', code)
    .maybeSingle<{ state: RemoteSnapshot }>();
  if (error || !data) return null;
  return data.state;
}

export async function createRoom(code: string, state: RemoteSnapshot): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('rooms').insert({ code, state } satisfies RoomRow);
  return !error;
}

export async function pushRoomState(code: string, state: RemoteSnapshot): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('rooms')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('code', code);
  return !error;
}

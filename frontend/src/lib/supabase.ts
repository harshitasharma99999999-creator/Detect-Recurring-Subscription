import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

function createSupabaseClient(): SupabaseClient {
  if (!url || !anon) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'subscription-tracker-auth',
    },
  });
}

export const supabase: SupabaseClient | null = url && anon ? createSupabaseClient() : null;

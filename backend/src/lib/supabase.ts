import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn('Supabase URL or service key missing. Auth and DB will fail.');
}

export const supabaseAdmin: SupabaseClient = createClient(url ?? '', serviceKey ?? '', {
  auth: { persistSession: false },
});

export function createSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? '', {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }
    const init = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        try {
          await api.auth.session(session.access_token);
          setUser(session.user);
        } catch {
          // Backend unreachable (e.g. 404) — still trust Supabase session so login works
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

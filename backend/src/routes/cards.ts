import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const cardsRouter = Router();

function requireAuth(req: import('express').Request, res: import('express').Response, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? (req.body && 'access_token' in req.body ? (req as any).body.access_token : null);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as any).accessToken = token;
  next();
}

async function getUserId(token: string): Promise<string | null> {
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user?.id ?? null;
}

const NO_CARD_ID = '00000000-0000-0000-0000-000000000000';

cardsRouter.use(requireAuth);

cardsRouter.get('/', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });
    const { data, error } = await supabaseAdmin
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

cardsRouter.post('/', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });
    const { last_four, cardholder_name, nickname } = req.body || {};
    const lastFour = String(last_four ?? '').replace(/\D/g, '').slice(-4);
    if (lastFour.length !== 4) {
      return res.status(400).json({ error: 'Last 4 digits must be exactly 4 digits' });
    }
    const name = String(cardholder_name ?? '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Cardholder name is required' });
    }
    const { data, error } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: userId,
        last_four: lastFour,
        cardholder_name: name,
        nickname: nickname ? String(nickname).trim() : null,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

cardsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export { NO_CARD_ID };

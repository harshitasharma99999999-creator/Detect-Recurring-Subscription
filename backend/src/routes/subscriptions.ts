import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const subscriptionsRouter = Router();

function requireAuth(req: import('express').Request, res: import('express').Response, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? (req.body && 'access_token' in req.body ? req.body.access_token : null);
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

subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get('/', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_false_positive', false)
      .order('next_expected_charge', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

subscriptionsRouter.get('/upcoming', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const today = new Date().toISOString().split('T')[0];
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);
    const end = in7.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_false_positive', false)
      .gte('next_expected_charge', today)
      .lte('next_expected_charge', end)
      .order('next_expected_charge');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? []);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

subscriptionsRouter.get('/export', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_false_positive', false);

    if (error) return res.status(500).json({ error: error.message });

    const rows = (data ?? []).map((s: any) => ({
      merchant: s.merchant_name,
      amount: s.amount,
      frequency: s.frequency,
      next_charge: s.next_expected_charge,
      monthly_equivalent: s.monthly_equivalent,
    }));

    const header = 'Merchant,Amount,Frequency,Next Charge,Monthly Equivalent\n';
    const csv = header + rows.map((r: any) => `"${r.merchant}",${r.amount},${r.frequency},${r.next_charge},${r.monthly_equivalent}`).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscriptions.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

subscriptionsRouter.patch('/:id/false-positive', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({ is_false_positive: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

subscriptionsRouter.delete('/:id', async (req, res) => {
  try {
    const userId = await getUserId((req as any).accessToken);
    if (!userId) return res.status(401).json({ error: 'Invalid token' });

    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

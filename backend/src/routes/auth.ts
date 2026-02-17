import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const authRouter = Router();

authRouter.post('/session', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(401).json({ error: 'Missing access_token' });
    }
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ error: error?.message ?? 'Invalid token' });
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

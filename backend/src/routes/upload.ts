import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { parseCSV } from '../utils/csvParser.js';
import {
  detectRecurringSubscriptions,
  type ParsedTransaction,
  type DetectedSubscription,
} from '../subscriptionDetector.js';

export const uploadRouter = Router();

function requireAuth(req: import('express').Request, res: import('express').Response, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '') ?? req.body?.access_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  (req as any).accessToken = token;
  next();
}

uploadRouter.post('/analyze', requireAuth, async (req, res) => {
  try {
    const { csv_content } = req.body;
    const token = (req as any).accessToken;

    if (!csv_content || typeof csv_content !== 'string') {
      return res.status(400).json({ error: 'Missing csv_content' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { rows, errors } = parseCSV(csv_content);
    const transactions: ParsedTransaction[] = rows
      .filter((r) => r.amount > 0)
      .map((r, i) => ({
        id: `tx-${user.id}-${Date.now()}-${i}`,
        date: r.date,
        merchant: r.description,
        amount: r.amount,
        rawDescription: r.description,
      }));

    const detected = detectRecurringSubscriptions(transactions);

    const toInsert = detected.map((d) => ({
      user_id: user.id,
      merchant_name: d.merchantName,
      normalized_merchant: d.normalizedMerchant,
      amount: d.amount,
      frequency: d.frequency,
      interval_days: d.intervalDays,
      last_charge_date: d.lastChargeDate,
      next_expected_charge: d.nextExpectedCharge,
      monthly_equivalent: d.monthlyEquivalent,
      transaction_ids: d.transactionIds,
      is_false_positive: false,
    }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from('subscriptions').upsert(toInsert, {
        onConflict: 'user_id,normalized_merchant',
        ignoreDuplicates: false,
      });
      if (insertError) console.error('Subscription insert error:', insertError);
    }

    res.json({
      transactionsProcessed: transactions.length,
      parseErrors: errors,
      detected: detected.length,
      subscriptions: detected,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: (e as Error).message });
  }
});

-- Subscriptions table: stores detected recurring charges per user
-- No raw card numbers; only transaction metadata

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  normalized_merchant TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  interval_days INT NOT NULL,
  last_charge_date DATE NOT NULL,
  next_expected_charge DATE NOT NULL,
  monthly_equivalent DECIMAL(12,2) NOT NULL,
  transaction_ids JSONB DEFAULT '[]',
  is_false_positive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, normalized_merchant)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_charge ON public.subscriptions(next_expected_charge);
CREATE INDEX IF NOT EXISTS idx_subscriptions_false_positive ON public.subscriptions(is_false_positive);

-- RLS: users can only see/edit their own rows
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do anything (backend uses service key for server-side operations)
-- RLS still applies to anon key when used from client.

COMMENT ON TABLE public.subscriptions IS 'Detected recurring subscriptions per user; no card numbers stored';

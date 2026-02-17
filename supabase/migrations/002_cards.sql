-- Cards: user identifies a card by last 4 digits + name only. No full card number stored.
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_four VARCHAR(4) NOT NULL,
  cardholder_name TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, last_four)
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cards"
  ON public.cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cards"
  ON public.cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards"
  ON public.cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards"
  ON public.cards FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.cards IS 'Card identifiers: last 4 digits + name only; no full card number stored';

-- Link subscriptions to a card (optional). No FK so we can use sentinel UUID for "no card".
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS card_id UUID;

UPDATE public.subscriptions SET card_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE card_id IS NULL;

ALTER TABLE public.subscriptions ALTER COLUMN card_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
ALTER TABLE public.subscriptions ALTER COLUMN card_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_card_id ON public.subscriptions(card_id);

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_normalized_merchant_key;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_merchant_card_key UNIQUE (user_id, normalized_merchant, card_id);

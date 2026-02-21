-- ============================================================
-- Stripe Integration: subscriptions, credits, credit_transactions
-- Phase 5C/5D/5F – Wonderelo
-- ============================================================

-- Subscriptions table (one per organizer)
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  capacity_tier TEXT NOT NULL DEFAULT '50',
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT DEFAULT 'premium',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for looking up by Stripe subscription ID (webhook handler)
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
  ON subscriptions(stripe_subscription_id);

-- Credits table (one per organizer – single event payment balance)
CREATE TABLE IF NOT EXISTS credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  capacity_tier TEXT DEFAULT '50',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,                     -- 'purchase', 'consumed', 'refund'
  capacity_tier TEXT,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  session_id TEXT,                        -- networking session ID (not Stripe session)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON credit_transactions(user_id, created_at DESC);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (backend uses service_role key)
CREATE POLICY "Service role full access on subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on credits"
  ON credits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on credit_transactions"
  ON credit_transactions FOR ALL
  USING (true)
  WITH CHECK (true);

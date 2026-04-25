-- Track Stripe webhook event IDs to make handler idempotent.
--
-- Without this, Stripe's at-least-once delivery (retries on 5xx, network
-- timeouts, accidental double-fire) can credit a user twice or create a
-- second subscription for the same checkout session. Stripe gives every
-- event a stable ID — we just need to remember the ones we've processed.
--
-- Rows aren't user-facing; we periodically prune anything older than 30 days
-- (Stripe retries up to 3 days, so 30d is generous headroom).

CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events (processed_at);

-- RLS: only service-role writes, no public reads
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

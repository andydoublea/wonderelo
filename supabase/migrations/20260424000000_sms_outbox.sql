-- SMS delivery: two-table design for variant B (batched).
--
-- sms_schedules: ONE row per (round × kind). Represents the QStash schedule.
--   Created when a round is created/published with a date/time.
--   When QStash fires at target_send_at, it POSTs to /sms/dispatch, which
--   reads current eligible registrations and fans out Twilio SMS.
--
-- sms_outbox: ONE row per actual send (per participant × kind × round).
--   Created at dispatch time. Tracks Twilio SID, delivery status, retries.
--   The Twilio StatusCallback webhook updates rows keyed by twilio_sid.
--
-- Split design chosen over one-table-null-participant because:
--   * Clean querying ("find overdue schedules" vs "find failed deliveries")
--   * Clean indexes
--   * Clear separation of concerns: schedule = our promise to fire at T;
--     outbox = the individual delivery record after fan-out.

-- ============================================================================
-- sms_schedules: per-round × per-kind scheduler record
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('round-starting-soon', 'round-ended')),
  round_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  target_send_at TIMESTAMPTZ NOT NULL,

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','scheduled','dispatched','canceled','failed')),
  qstash_message_id TEXT,
  last_error TEXT,

  -- Timeline
  scheduled_at TIMESTAMPTZ,      -- when QStash accepted the schedule
  dispatched_at TIMESTAMPTZ,     -- when QStash fired and we began fan-out
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (kind, round_id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_due
  ON public.sms_schedules (target_send_at)
  WHERE status IN ('pending','scheduled');

ALTER TABLE public.sms_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- sms_outbox: per-send delivery record
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sms_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.sms_schedules(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('round-starting-soon', 'round-ended')),
  participant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  target_send_at TIMESTAMPTZ NOT NULL,

  status TEXT NOT NULL DEFAULT 'attempting'
    CHECK (status IN ('attempting','sent','delivered','undelivered','failed','canceled')),

  -- Twilio correlation
  twilio_sid TEXT,
  twilio_delivery_status TEXT, -- 'queued','sending','sent','delivered','undelivered','failed'
  twilio_error_code TEXT,

  -- Phone used (snapshot for audit — participant may change phone later)
  phone_sent_to TEXT,

  -- Retry bookkeeping
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  last_error TEXT,

  -- Timeline
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency: one row per (kind, participant, round). Re-dispatch
  -- hits ON CONFLICT and the row is updated in place.
  UNIQUE (kind, participant_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_outbox_round_kind_status
  ON public.sms_outbox (round_id, kind, status);

CREATE INDEX IF NOT EXISTS idx_outbox_twilio_sid
  ON public.sms_outbox (twilio_sid)
  WHERE twilio_sid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_needs_delivery_check
  ON public.sms_outbox (sent_at)
  WHERE status = 'sent';

ALTER TABLE public.sms_outbox ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sms_schedules_touch_updated ON public.sms_schedules;
CREATE TRIGGER sms_schedules_touch_updated
  BEFORE UPDATE ON public.sms_schedules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS sms_outbox_touch_updated ON public.sms_outbox;
CREATE TRIGGER sms_outbox_touch_updated
  BEFORE UPDATE ON public.sms_outbox
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

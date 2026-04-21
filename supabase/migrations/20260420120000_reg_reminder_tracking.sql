-- Track SMS reminder on the REGISTRATION level, not the round level.
-- Previous behaviour: cron marked round.reminder_sms_sent_at the first time it
-- processed a round, even when no participants were registered yet. Anyone who
-- registered after that first cron tick never got an SMS.
-- Fix: add a per-registration column. Cron now sends SMS to any reg where
-- reminder_sms_sent_at IS NULL inside the 7-min window, and marks the
-- registration (not the round) afterwards.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS reminder_sms_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill from rounds.reminder_sms_sent_at if that column exists (prod has it;
-- staging/local may not). This prevents the first cron run after deploy from
-- resending reminders that were already delivered.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rounds' AND column_name='reminder_sms_sent_at'
  ) THEN
    UPDATE public.registrations reg
    SET reminder_sms_sent_at = r.reminder_sms_sent_at
    FROM public.rounds r
    WHERE reg.round_id = r.id
      AND r.reminder_sms_sent_at IS NOT NULL
      AND reg.reminder_sms_sent_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_registrations_reminder_sms_sent_at
  ON public.registrations(reminder_sms_sent_at)
  WHERE reminder_sms_sent_at IS NULL;

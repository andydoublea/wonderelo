-- Cascade-clean sms_schedules and sms_outbox when their parent session/round is
-- deleted. Without these FKs:
--   * Session delete leaves orphan sms_schedules rows (with no
--     matching session_id), and on next dispatch they'd 404 silently.
--   * sms_outbox rows survive even after their parent registration is
--     cascade-deleted by the session — bulkUpsertOutboxAttempting then sees
--     a "previously sent" row for a participant who no longer exists in the
--     round, and incorrectly skips that participant on re-dispatch.
--
-- We use ON DELETE CASCADE on the session_id FKs (rounds also cascade from
-- session, so the round_id reference becomes implicit). round_id has no FK
-- target table because the round-with-id may already be cascade-removed by
-- the time the FK validates; we keep round_id as plain TEXT.
--
-- Idempotent: each ALTER uses IF EXISTS / IF NOT EXISTS where Postgres allows.

-- Step 1: drop any orphans BEFORE adding the constraint so the FK creation
-- doesn't fail on environments that already have stale rows.
DELETE FROM public.sms_outbox
WHERE session_id NOT IN (SELECT id FROM public.sessions);

DELETE FROM public.sms_schedules
WHERE session_id NOT IN (SELECT id FROM public.sessions);

-- Step 2: add the cascade FKs (idempotent).
DO $$
BEGIN
  -- sms_schedules.session_id → sessions.id  (ON DELETE CASCADE)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sms_schedules_session_id_fkey'
  ) THEN
    ALTER TABLE public.sms_schedules
      ADD CONSTRAINT sms_schedules_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.sessions(id)
      ON DELETE CASCADE;
  END IF;

  -- sms_outbox.session_id → sessions.id  (ON DELETE CASCADE)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sms_outbox_session_id_fkey'
  ) THEN
    ALTER TABLE public.sms_outbox
      ADD CONSTRAINT sms_outbox_session_id_fkey
      FOREIGN KEY (session_id)
      REFERENCES public.sessions(id)
      ON DELETE CASCADE;
  END IF;
END $$;

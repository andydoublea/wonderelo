-- Add 'round-before-confirmation' kind to sms_schedules + sms_outbox.
-- User expanded the notification model to 3 types per round:
--   1. before confirmation time (early warning, ~10 min before round)
--   2. at confirmation time       (when Confirm button appears, ~5 min before)
--   3. after networking           (when round ends)
-- Each can be enabled independently as SMS and/or email.

ALTER TABLE public.sms_schedules DROP CONSTRAINT IF EXISTS sms_schedules_kind_check;
ALTER TABLE public.sms_schedules ADD CONSTRAINT sms_schedules_kind_check
  CHECK (kind IN ('round-before-confirmation', 'round-starting-soon', 'round-ended'));

ALTER TABLE public.sms_outbox DROP CONSTRAINT IF EXISTS sms_outbox_kind_check;
ALTER TABLE public.sms_outbox ADD CONSTRAINT sms_outbox_kind_check
  CHECK (kind IN ('round-before-confirmation', 'round-starting-soon', 'round-ended'));

-- Round-ended SMS: per-registration tracking column + index.
-- Sent by the same send-round-reminders cron when smsRoundEndedEnabled is true
-- (admin parameter). Goes only to participants who actually took part (status
-- matched / checked-in / met) and links to their /contact-sharing page.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS end_reminder_sms_sent_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_end_reminder_sms_sent_at
  ON public.registrations(end_reminder_sms_sent_at)
  WHERE end_reminder_sms_sent_at IS NULL;

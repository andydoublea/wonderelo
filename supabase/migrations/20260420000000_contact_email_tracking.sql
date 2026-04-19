-- Track when contact sharing email was sent to a participant for a match
-- Used to ensure we don't send duplicate emails when contacts are exchanged.
ALTER TABLE contact_sharing
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_sharing_email_sent_at
  ON contact_sharing (email_sent_at)
  WHERE email_sent_at IS NULL;

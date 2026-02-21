-- Registration drafts table for progressive save during organizer signup
CREATE TABLE IF NOT EXISTS registration_drafts (
  email TEXT PRIMARY KEY,
  current_step INTEGER NOT NULL DEFAULT 1,
  form_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE registration_drafts ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on registration_drafts') THEN
    CREATE POLICY "Service role full access on registration_drafts" ON registration_drafts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Auto-cleanup: delete drafts older than 30 days (can be run as a cron)
-- For now, we rely on the signup handler to delete drafts after successful registration

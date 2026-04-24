-- Track site visits (not just password entries) for access passwords

-- 1. Add visit tracking columns to access_passwords
ALTER TABLE access_passwords
  ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ;

-- 2. Add log_type to distinguish password entries from visits
ALTER TABLE access_password_logs
  ADD COLUMN IF NOT EXISTS log_type TEXT NOT NULL DEFAULT 'password_entry';

-- Backfill existing logs as password entries (already default)

-- 3. Atomic increment for visit count
CREATE OR REPLACE FUNCTION increment_visit_count(pwd_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE access_passwords
  SET visit_count = visit_count + 1,
      last_visited_at = now(),
      updated_at = now()
  WHERE id = pwd_id;
END;
$$ LANGUAGE plpgsql;

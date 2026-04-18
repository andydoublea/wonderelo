-- Add optional social-network profile fields for participants.
-- Shown/shared ONLY if participant filled them in their Profile page.
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS other_social TEXT;

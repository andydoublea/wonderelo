-- Add onboarding_completed_at to organizer_profiles
-- Tracks when the organizer completed/dismissed the onboarding tour
-- NULL = tour not completed yet, timestamp = completed/dismissed
ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add event_type column to organizer_profiles (required by createOrganizerProfile in db.ts)
ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS event_type TEXT;

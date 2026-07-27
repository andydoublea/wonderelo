-- Add a dedicated event_name column to organizer_profiles.
--
-- Rationale: the Event Page Settings screen edits the EVENT name
-- (e.g. "Founder Summit 2026"), which is a distinct field from the
-- organizer's personal name (organizer_name, e.g. "Andy Abel") edited on
-- Account Settings. Previously both screens wrote to organizer_name, so
-- editing one clobbered the other. This column gives the event name its
-- own home so the two fields are independent.
ALTER TABLE organizer_profiles ADD COLUMN IF NOT EXISTS event_name TEXT;

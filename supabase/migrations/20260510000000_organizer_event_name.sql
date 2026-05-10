-- Split "organizer name" into two distinct fields:
--   organizer_name → personal name shown in Account Settings
--   event_name     → public-facing event display name shown in OrganizerHeader
--
-- Existing rows keep organizer_name; event_name starts NULL. The frontend
-- falls back to organizer_name when event_name is null, so existing event
-- pages continue to render the same name until the organizer customizes it.

ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS event_name TEXT;

-- Add missing columns to sessions table
-- These fields were used in the frontend but never persisted to the database
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS round_duration INTEGER DEFAULT 10;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS number_of_rounds INTEGER DEFAULT 1;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gap_between_rounds INTEGER DEFAULT 5;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS limit_groups BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS max_groups INTEGER;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS frequency TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS allow_multiple_teams BOOLEAN DEFAULT false;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS live_sub_status TEXT;

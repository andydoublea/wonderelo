-- Add identification number system to registrations
-- Each participant gets a stable random number (1-99) when matched
-- identification_options stores the shuffled array of 3 numbers (1 correct + 2 wrong)
-- that the OTHER participant sees as choices

ALTER TABLE registrations ADD COLUMN IF NOT EXISTS identification_number INTEGER DEFAULT NULL;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS identification_options JSONB DEFAULT NULL;

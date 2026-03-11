-- Participant Status System Redesign
-- Adds round_completed_at column and CHECK constraint on registration status
-- Valid statuses: registered, confirmed, matched, checked-in, met, unconfirmed, no-match, missed, cancelled

-- 1. First, clean up any invalid status values that might exist
-- Map old phantom statuses to their closest valid equivalent
UPDATE registrations SET status = 'registered' WHERE status = 'verification_pending';
UPDATE registrations SET status = 'matched' WHERE status = 'walking-to-meeting-point';
UPDATE registrations SET status = 'matched' WHERE status = 'waiting-for-match';
UPDATE registrations SET status = 'checked-in' WHERE status = 'waiting-for-meet-confirmation';
UPDATE registrations SET status = 'missed' WHERE status = 'no-show';
UPDATE registrations SET status = 'missed' WHERE status = 'left-alone';
UPDATE registrations SET status = 'missed' WHERE status = 'excluded';
-- 'completed' status → keep last active status, we'll set round_completed_at separately
UPDATE registrations SET status = 'met' WHERE status = 'completed';

-- 2. Add round_completed_at column
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS round_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 3. Add CHECK constraint for valid statuses
ALTER TABLE registrations ADD CONSTRAINT registrations_status_check
  CHECK (status IN ('registered', 'confirmed', 'matched', 'checked-in', 'met', 'unconfirmed', 'no-match', 'missed', 'cancelled'));

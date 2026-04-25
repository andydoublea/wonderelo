-- Fix rounds whose group_size doesn't match their session's group_size.
--
-- Background: SessionForm in the frontend builds rounds without an explicit
-- groupSize, expecting session-level groupSize to apply. The previous
-- db.createSession path passed the round through to db.createRound which
-- defaulted group_size to 2 if not specified — silently making any
-- "session.groupSize=3" event behave like pairs.
--
-- This migration re-aligns existing rounds with their session's setting.
-- The application code (db.ts createSession + syncRounds) now propagates
-- session.groupSize to rounds at write time, so this is a one-time backfill.

UPDATE rounds r
SET group_size = s.group_size
FROM sessions s
WHERE r.session_id = s.id
  AND r.group_size <> s.group_size;

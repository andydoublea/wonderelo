-- Wonderelo Initial Schema
-- Generated from production on 2026-02-16
-- 10 tables: organizer_profiles, admin_settings, sessions, rounds, participants,
--            registrations, matches, matching_locks, contact_sharing, participant_audit_log

-- ============================================================
-- 1. organizer_profiles (referenced by sessions, registrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizer_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  url_slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'organizer',
  phone TEXT,
  website TEXT,
  description TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizer_profiles_email ON organizer_profiles (email);

-- ============================================================
-- 2. admin_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  limit_participants BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 20,
  group_size INTEGER DEFAULT 2,
  enable_teams BOOLEAN DEFAULT false,
  matching_type TEXT DEFAULT 'across-teams',
  teams JSONB DEFAULT '[]'::jsonb,
  enable_topics BOOLEAN DEFAULT false,
  allow_multiple_topics BOOLEAN DEFAULT false,
  topics JSONB DEFAULT '[]'::jsonb,
  meeting_points JSONB DEFAULT '[]'::jsonb,
  ice_breakers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_status ON sessions (user_id, status);

-- ============================================================
-- 4. rounds
-- ============================================================
CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE,
  start_time TEXT,
  duration INTEGER DEFAULT 10,
  group_size INTEGER DEFAULT 2,
  meeting_points JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'scheduled',
  confirmation_window INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON rounds (session_id);
CREATE INDEX IF NOT EXISTS idx_rounds_date_start_time ON rounds (date, start_time);

-- ============================================================
-- 5. participants
-- ============================================================
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  phone_country TEXT DEFAULT '+421',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id),
  status TEXT NOT NULL DEFAULT 'registered',
  team TEXT,
  topics JSONB DEFAULT '[]'::jsonb,
  meeting_point TEXT,
  match_id TEXT,
  match_partner_names JSONB,
  meeting_point_id TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  matched_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  met_at TIMESTAMPTZ,
  last_status_update TIMESTAMPTZ NOT NULL DEFAULT now(),
  notifications_enabled BOOLEAN DEFAULT true,
  unconfirmed_reason TEXT,
  no_match_reason TEXT,
  UNIQUE(participant_id, session_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_participant_id ON registrations (participant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_session_round ON registrations (session_id, round_id);
CREATE INDEX IF NOT EXISTS idx_registrations_round_status ON registrations (round_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_session_round_status ON registrations (session_id, round_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_match_id ON registrations (match_id);

-- ============================================================
-- 7. matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  meeting_point TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matches_session_round ON matches (session_id, round_id);

-- ============================================================
-- 8. matching_locks
-- ============================================================
CREATE TABLE IF NOT EXISTS matching_locks (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  match_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  solo_participant BOOLEAN DEFAULT false,
  PRIMARY KEY (session_id, round_id)
);

-- ============================================================
-- 9. contact_sharing
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_sharing (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_sharing_match ON contact_sharing (match_id);

-- ============================================================
-- 10. participant_audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS participant_audit_log (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_participant ON participant_audit_log (participant_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON participant_audit_log (created_at);

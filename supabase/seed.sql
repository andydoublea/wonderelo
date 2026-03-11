-- Wonderelo Test Seed Data
-- Organizer accounts (survive `supabase db reset`):
--   admin@test.com / test123456 (organizer, slug: test-event)
--   andy.double.a+org@gmail.com / Rukuku (admin, slug: andyconf)
--
-- CRITICAL: NEVER remove these auth user inserts. The organizer login
-- breaks every time auth.users are missing. This has been reported many times.

-- ============================================================
-- 0. Auth users (MUST be created before organizer_profiles)
-- ============================================================
-- admin@test.com / test123456
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('test123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@test.com'),
  'email',
  '00000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- andy.double.a+org@gmail.com / Rukuku (primary dev/admin account)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role, confirmation_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'andy.double.a+org@gmail.com',
  crypt('Rukuku', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  'authenticated',
  'authenticated',
  '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at, last_sign_in_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'andy.double.a+org@gmail.com'),
  'email',
  '00000000-0000-0000-0000-000000000002',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================
-- 1. Organizer profiles
-- ============================================================
INSERT INTO organizer_profiles (id, email, organizer_name, url_slug, role, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@test.com',
  'Test Organizer',
  'test-event',
  'organizer',
  'Speed networking events for tech professionals'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO organizer_profiles (id, email, organizer_name, url_slug, role, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'andy.double.a+org@gmail.com',
  'Andyho konfera',
  'andyconf',
  'admin',
  'Primary dev/admin account'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Published session with 3 rounds (today, starting soon)
-- ============================================================
INSERT INTO sessions (id, user_id, name, description, date, status, limit_participants, max_participants, group_size, enable_teams, enable_topics, meeting_points, ice_breakers)
VALUES (
  'session-published-001',
  '00000000-0000-0000-0000-000000000001',
  'Tech Networking Prague',
  'Connect with fellow developers and designers in a fun speed networking format!',
  CURRENT_DATE,
  'published',
  false,
  20,
  2,
  false,
  false,
  '["Table A", "Table B", "Table C", "Table D", "Table E"]'::jsonb,
  '["What project are you most excited about?", "What tech stack do you use daily?", "What''s the best advice you ever received?", "If you could learn one new skill instantly, what would it be?"]'::jsonb
);

-- Round 1: starts in 30 min
INSERT INTO rounds (id, session_id, name, date, start_time, duration, group_size, meeting_points, status, confirmation_window, sort_order)
VALUES (
  'round-001',
  'session-published-001',
  'Round 1',
  CURRENT_DATE,
  to_char((now() + interval '30 minutes'), 'HH24:MI'),
  10,
  2,
  '["Table A", "Table B", "Table C", "Table D", "Table E"]'::jsonb,
  'scheduled',
  5,
  0
);

-- Round 2: starts 20 min after round 1
INSERT INTO rounds (id, session_id, name, date, start_time, duration, group_size, meeting_points, status, confirmation_window, sort_order)
VALUES (
  'round-002',
  'session-published-001',
  'Round 2',
  CURRENT_DATE,
  to_char((now() + interval '50 minutes'), 'HH24:MI'),
  10,
  2,
  '["Table A", "Table B", "Table C", "Table D", "Table E"]'::jsonb,
  'scheduled',
  5,
  1
);

-- Round 3: starts 20 min after round 2
INSERT INTO rounds (id, session_id, name, date, start_time, duration, group_size, meeting_points, status, confirmation_window, sort_order)
VALUES (
  'round-003',
  'session-published-001',
  'Round 3',
  CURRENT_DATE,
  to_char((now() + interval '70 minutes'), 'HH24:MI'),
  10,
  2,
  '["Table A", "Table B", "Table C", "Table D", "Table E"]'::jsonb,
  'scheduled',
  5,
  2
);

-- ============================================================
-- 3. Draft session (future date)
-- ============================================================
INSERT INTO sessions (id, user_id, name, description, date, status, limit_participants, max_participants, group_size, enable_teams, enable_topics, meeting_points, ice_breakers)
VALUES (
  'session-draft-001',
  '00000000-0000-0000-0000-000000000001',
  'Startup Founders Meetup',
  'A networking session for startup founders and aspiring entrepreneurs.',
  CURRENT_DATE + interval '7 days',
  'draft',
  true,
  10,
  2,
  false,
  false,
  '["Lounge 1", "Lounge 2", "Lounge 3"]'::jsonb,
  '["What problem is your startup solving?", "What''s your biggest challenge right now?"]'::jsonb
);

INSERT INTO rounds (id, session_id, name, date, start_time, duration, group_size, meeting_points, status, confirmation_window, sort_order)
VALUES (
  'round-draft-001',
  'session-draft-001',
  'Round 1',
  CURRENT_DATE + interval '7 days',
  '18:00',
  15,
  2,
  '["Lounge 1", "Lounge 2", "Lounge 3"]'::jsonb,
  'scheduled',
  5,
  0
);

-- ============================================================
-- 4. Participants (6 people for matching)
-- ============================================================
INSERT INTO participants (id, email, token, first_name, last_name, phone, phone_country) VALUES
  ('p-alice',   'alice@test.com',   'tok-alice-001',   'Alice',   'Novak',    '+421900111001', '+421'),
  ('p-bob',     'bob@test.com',     'tok-bob-001',     'Bob',     'Kovac',    '+421900111002', '+421'),
  ('p-carol',   'carol@test.com',   'tok-carol-001',   'Carol',   'Horvat',   '+421900111003', '+421'),
  ('p-dave',    'dave@test.com',    'tok-dave-001',    'Dave',    'Szabo',    '+421900111004', '+421'),
  ('p-eve',     'eve@test.com',     'tok-eve-001',     'Eve',     'Tomasova', '+421900111005', '+421'),
  ('p-frank',   'frank@test.com',   'tok-frank-001',   'Frank',   'Molnar',   '+421900111006', '+421')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Registrations - all 6 for round 1, 4 for round 2, 2 for round 3
-- ============================================================

-- Round 1: all 6 registered
INSERT INTO registrations (participant_id, session_id, round_id, organizer_id, status) VALUES
  ('p-alice',  'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-bob',    'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-carol',  'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-dave',   'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-eve',    'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-frank',  'session-published-001', 'round-001', '00000000-0000-0000-0000-000000000001', 'registered');

-- Round 2: 4 registered
INSERT INTO registrations (participant_id, session_id, round_id, organizer_id, status) VALUES
  ('p-alice',  'session-published-001', 'round-002', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-bob',    'session-published-001', 'round-002', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-carol',  'session-published-001', 'round-002', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-dave',   'session-published-001', 'round-002', '00000000-0000-0000-0000-000000000001', 'registered');

-- Round 3: 2 registered (minimum for matching)
INSERT INTO registrations (participant_id, session_id, round_id, organizer_id, status) VALUES
  ('p-alice',  'session-published-001', 'round-003', '00000000-0000-0000-0000-000000000001', 'registered'),
  ('p-bob',    'session-published-001', 'round-003', '00000000-0000-0000-0000-000000000001', 'registered');

-- ============================================================
-- 6. System parameters
-- ============================================================
INSERT INTO admin_settings (key, value) VALUES
  ('system_parameters', '{
    "confirmationWindowMinutes": 5,
    "safetyWindowMinutes": 6,
    "walkingTimeMinutes": 3,
    "notificationEarlyMinutes": 10,
    "notificationEarlyEnabled": true,
    "notificationLateMinutes": 5,
    "notificationLateEnabled": true,
    "minimalGapBetweenRounds": 10,
    "minimalRoundDuration": 5,
    "maximalRoundDuration": 240,
    "minimalTimeToFirstRound": 10,
    "findingTimeMinutes": 1,
    "networkingDurationMinutes": 15,
    "fireThreshold1": 5,
    "fireThreshold2": 10,
    "fireThreshold3": 15,
    "defaultRoundDuration": 10,
    "defaultGapBetweenRounds": 10,
    "defaultNumberOfRounds": 1,
    "defaultMaxParticipants": 20,
    "defaultGroupSize": 2,
    "defaultLimitParticipants": false,
    "defaultLimitGroups": false
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO admin_settings (key, value) VALUES
  ('free_tier_max_participants', '5'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

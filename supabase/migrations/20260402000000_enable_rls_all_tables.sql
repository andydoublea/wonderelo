-- Enable Row Level Security on all public tables that exist.
-- No policies are added — this blocks all direct API access via the anon key.
-- The edge function uses the service_role key, which bypasses RLS entirely.
--
-- Wrapped in a loop that checks pg_tables so the migration works across all
-- environments (local dev may not have legacy tables like kv_store or
-- lead_magnet_submissions; prod/staging have them).

DO $$
DECLARE
  t text;
  tbl text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'access_password_logs',
    'access_passwords',
    'admin_settings',
    'contact_sharing',
    'kv_store_ce05600a',
    'lead_magnet_submissions',
    'matches',
    'matching_locks',
    'organizer_profiles',
    'participant_audit_log',
    'participants',
    'registrations',
    'rounds',
    'sessions'
  ] LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      tbl := quote_ident(t);
      EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

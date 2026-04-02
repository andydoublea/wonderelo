-- Enable Row Level Security on all public tables that don't have it yet.
-- No policies are added — this blocks all direct API access via the anon key.
-- The edge function uses the service_role key, which bypasses RLS entirely.

ALTER TABLE public.access_password_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store_ce05600a ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_magnet_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Slug history table for tracking old URL slugs and enabling redirects
CREATE TABLE IF NOT EXISTS slug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by slug (used in availability check and redirects)
CREATE INDEX IF NOT EXISTS idx_slug_history_slug ON slug_history(slug);

-- Index for rate limiting queries (slug changes per organizer in last N days)
CREATE INDEX IF NOT EXISTS idx_slug_history_organizer_created ON slug_history(organizer_id, created_at);

-- RLS
ALTER TABLE slug_history ENABLE ROW LEVEL SECURITY;

-- Anon can read (needed for slug availability check)
CREATE POLICY "anon_read_slug_history" ON slug_history
  FOR SELECT TO anon USING (true);

-- Service role has full access (edge functions use service role)
CREATE POLICY "service_role_all_slug_history" ON slug_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

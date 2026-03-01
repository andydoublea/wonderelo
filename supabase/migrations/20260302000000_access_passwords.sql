-- Access passwords for site gate + access logging
-- Replaces hardcoded password in PasswordGate.tsx

-- ============================================================
-- 1. access_passwords
-- ============================================================
CREATE TABLE IF NOT EXISTS access_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  password TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_passwords_password ON access_passwords (password);
CREATE INDEX idx_access_passwords_active ON access_passwords (is_active, created_at DESC);

-- ============================================================
-- 2. access_password_logs (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS access_password_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_id UUID NOT NULL REFERENCES access_passwords(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE INDEX idx_access_password_logs_password_id ON access_password_logs (password_id, accessed_at DESC);

-- ============================================================
-- 3. Helper function for atomic increment
-- ============================================================
CREATE OR REPLACE FUNCTION increment_access_count(pwd_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE access_passwords
  SET access_count = access_count + 1,
      last_accessed_at = now(),
      updated_at = now()
  WHERE id = pwd_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Seed: migrate the existing hardcoded password
-- ============================================================
INSERT INTO access_passwords (person_name, password, is_active)
VALUES ('Default (migrated)', 'rukuku', true);

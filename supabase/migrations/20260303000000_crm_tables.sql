-- ============================================
-- CRM System Tables + Data Migration
-- ============================================

-- 1. Pipeline Stages (needed before contacts for lead_stage reference)
CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL,
  color TEXT,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default stages
INSERT INTO crm_pipeline_stages (name, sort_order, color, is_won, is_lost) VALUES
  ('New Lead', 1, '#6366f1', false, false),
  ('Contacted', 2, '#8b5cf6', false, false),
  ('Qualified', 3, '#a855f7', false, false),
  ('Demo Scheduled', 4, '#d946ef', false, false),
  ('Proposal Sent', 5, '#ec4899', false, false),
  ('Negotiation', 6, '#f43f5e', false, false),
  ('Won', 7, '#22c55e', true, false),
  ('Lost', 8, '#6b7280', false, true);

-- 2. Tags
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Companies
CREATE TABLE IF NOT EXISTS crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  size TEXT,
  address TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Contacts (unified)
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  phone_country TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  job_title TEXT,
  contact_types TEXT[] DEFAULT '{}',
  organizer_id UUID,
  participant_id TEXT,
  lead_source TEXT,
  lead_stage TEXT,
  lead_score INTEGER DEFAULT 0,
  lead_expected_value INTEGER,
  lead_expected_close DATE,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  discovery_source TEXT,
  event_type TEXT,
  company_size TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_organizer ON crm_contacts(organizer_id);
CREATE INDEX idx_crm_contacts_participant ON crm_contacts(participant_id);
CREATE INDEX idx_crm_contacts_lead_stage ON crm_contacts(lead_stage);
CREATE INDEX idx_crm_contacts_types ON crm_contacts USING GIN(contact_types);
CREATE INDEX idx_crm_contacts_tags ON crm_contacts USING GIN(tags);
CREATE INDEX idx_crm_contacts_last_activity ON crm_contacts(last_activity_at DESC);

-- 5. Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id BIGSERIAL PRIMARY KEY,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_company ON crm_activities(company_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(type);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at DESC);

-- 6. Tasks
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_tasks_contact ON crm_tasks(contact_id);
CREATE INDEX idx_crm_tasks_due ON crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_open ON crm_tasks(completed_at) WHERE completed_at IS NULL;

-- 7. Email Templates
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  category TEXT DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Segments
CREATE TABLE IF NOT EXISTS crm_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'dynamic',
  filters JSONB DEFAULT '{}',
  contact_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Website Visits
CREATE TABLE IF NOT EXISTS crm_website_visits (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  duration_seconds INTEGER,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_crm_visits_visitor ON crm_website_visits(visitor_id);
CREATE INDEX idx_crm_visits_contact ON crm_website_visits(contact_id);
CREATE INDEX idx_crm_visits_created ON crm_website_visits(created_at DESC);
CREATE INDEX idx_crm_visits_session ON crm_website_visits(session_id);

-- ============================================
-- DATA MIGRATION: Populate CRM contacts from existing tables
-- ============================================

-- Step 1: Import organizers
INSERT INTO crm_contacts (email, first_name, phone, contact_types, organizer_id, lead_source, lead_stage, created_at, updated_at, last_activity_at)
SELECT
  op.email,
  op.organizer_name,
  op.phone,
  ARRAY['organizer'],
  op.id,
  'signup',
  'Won',
  op.created_at,
  COALESCE(op.updated_at, op.created_at),
  COALESCE(op.updated_at, op.created_at)
FROM organizer_profiles op
WHERE op.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Step 2: Import participants (merge if email exists)
INSERT INTO crm_contacts (email, first_name, last_name, phone, phone_country, contact_types, participant_id, lead_source, created_at, updated_at, last_activity_at)
SELECT
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.phone_country,
  ARRAY['participant'],
  p.id,
  'signup',
  p.created_at,
  COALESCE(p.updated_at, p.created_at),
  COALESCE(p.updated_at, p.created_at)
FROM participants p
WHERE p.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  first_name = COALESCE(crm_contacts.first_name, EXCLUDED.first_name),
  last_name = COALESCE(crm_contacts.last_name, EXCLUDED.last_name),
  phone = COALESCE(crm_contacts.phone, EXCLUDED.phone),
  phone_country = COALESCE(crm_contacts.phone_country, EXCLUDED.phone_country),
  participant_id = EXCLUDED.participant_id,
  contact_types = ARRAY(SELECT DISTINCT unnest(crm_contacts.contact_types || ARRAY['participant'])),
  updated_at = now();

-- Step 3: Import lead magnet submissions (merge if email exists) — only if table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_magnet_submissions') THEN
    EXECUTE '
      INSERT INTO crm_contacts (email, first_name, contact_types, lead_source, lead_stage, event_type, created_at, updated_at, last_activity_at)
      SELECT
        lms.email,
        lms.name,
        ARRAY[''lead''],
        ''lead_magnet'',
        ''New Lead'',
        lms.event_type,
        lms.created_at,
        lms.created_at,
        lms.created_at
      FROM lead_magnet_submissions lms
      WHERE lms.email IS NOT NULL
      ON CONFLICT (email) DO UPDATE SET
        first_name = COALESCE(crm_contacts.first_name, EXCLUDED.first_name),
        lead_source = COALESCE(crm_contacts.lead_source, EXCLUDED.lead_source),
        event_type = COALESCE(crm_contacts.event_type, EXCLUDED.event_type),
        contact_types = ARRAY(SELECT DISTINCT unnest(crm_contacts.contact_types || ARRAY[''lead''])),
        updated_at = now()';
  END IF;
END $$;

-- Step 4: Import abandoned signups from registration_drafts
INSERT INTO crm_contacts (email, first_name, contact_types, lead_source, lead_stage, event_type, company_size, discovery_source, custom_fields, created_at, updated_at)
SELECT
  rd.email,
  COALESCE(rd.form_data->>'organizerName', rd.form_data->>'name'),
  ARRAY['lead'],
  'signup',
  'New Lead',
  rd.form_data->>'eventType',
  rd.form_data->>'companySize',
  rd.form_data->>'discoverySource',
  jsonb_build_object('signup_step_reached', rd.current_step, 'abandoned_signup', true),
  rd.created_at,
  COALESCE(rd.updated_at, rd.created_at)
FROM registration_drafts rd
WHERE rd.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  custom_fields = crm_contacts.custom_fields || jsonb_build_object('signup_step_reached', (SELECT current_step FROM registration_drafts WHERE email = EXCLUDED.email), 'abandoned_signup', true),
  contact_types = ARRAY(SELECT DISTINCT unnest(crm_contacts.contact_types || ARRAY['lead'])),
  updated_at = now();

-- Step 5: Backfill activities from participant_audit_log
INSERT INTO crm_activities (contact_id, type, title, description, metadata, created_by, created_at)
SELECT
  cc.id,
  'system',
  pal.action,
  pal.action,
  COALESCE(pal.details, '{}'),
  'system',
  pal.created_at
FROM participant_audit_log pal
JOIN participants p ON p.id = pal.participant_id
JOIN crm_contacts cc ON cc.email = p.email
WHERE p.email IS NOT NULL;

-- Step 6: Backfill activities from credit_transactions
INSERT INTO crm_activities (contact_id, type, title, description, metadata, created_by, created_at)
SELECT
  cc.id,
  'billing',
  CASE ct.type
    WHEN 'purchase' THEN 'Credit purchase'
    WHEN 'consumed' THEN 'Credit consumed'
    WHEN 'refund' THEN 'Credit refund'
    ELSE ct.type
  END,
  COALESCE(ct.description, ct.type || ' ' || ct.amount || ' credits'),
  jsonb_build_object('amount', ct.amount, 'type', ct.type, 'capacity_tier', ct.capacity_tier),
  'system',
  ct.created_at
FROM credit_transactions ct
JOIN organizer_profiles op ON op.id = ct.user_id
JOIN crm_contacts cc ON cc.email = op.email
WHERE op.email IS NOT NULL;

-- RLS: service role only (admin operations)
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_website_visits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access" ON crm_pipeline_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON crm_website_visits FOR ALL USING (true) WITH CHECK (true);

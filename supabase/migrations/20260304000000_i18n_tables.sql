-- ============================================
-- i18n System Tables
-- ============================================

-- 1. Languages registry
CREATE TABLE IF NOT EXISTS i18n_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  flag_emoji TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Translation keys (master list of all translatable strings)
CREATE TABLE IF NOT EXISTS i18n_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  namespace TEXT NOT NULL,
  default_text TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Translations (one row per key per language)
CREATE TABLE IF NOT EXISTS i18n_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES i18n_keys(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES i18n_languages(code) ON DELETE CASCADE,
  translated_text TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ai_translated', 'reviewed', 'approved')),
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key_id, language_code)
);

-- Indexes
CREATE INDEX idx_i18n_translations_lang ON i18n_translations(language_code);
CREATE INDEX idx_i18n_translations_key ON i18n_translations(key_id);
CREATE INDEX idx_i18n_keys_namespace ON i18n_keys(namespace);

-- RLS
ALTER TABLE i18n_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE i18n_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON i18n_languages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON i18n_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON i18n_translations FOR ALL USING (true) WITH CHECK (true);

-- Seed default language
INSERT INTO i18n_languages (code, name, native_name, flag_emoji, is_default, is_active, sort_order) VALUES
  ('en', 'English', 'English', '🇬🇧', true, true, 0);

-- Seed translation keys for demo components (Navigation, Footer, Homepage hero)
INSERT INTO i18n_keys (key, namespace, default_text, description) VALUES
  -- Navigation
  ('nav.whoIsItFor', 'nav', 'Who is it for?', 'Main nav dropdown label'),
  ('nav.howItWorks', 'nav', 'How it works', 'Main nav link'),
  ('nav.features', 'nav', 'Features', 'Main nav link'),
  ('nav.pricing', 'nav', 'Pricing', 'Main nav link'),
  ('nav.logIn', 'nav', 'Log in', 'Login button'),
  ('nav.signUp', 'nav', 'Sign up', 'Sign up button'),
  ('nav.signUpFree', 'nav', 'Sign up free', 'Mobile sign up button'),
  ('nav.myAccount', 'nav', 'My account', 'Account dropdown trigger'),
  ('nav.myDashboard', 'nav', 'My dashboard', 'Account dropdown item'),
  ('nav.logOut', 'nav', 'Log out', 'Account dropdown item'),
  -- Navigation - Who is it for items
  ('nav.for.conferences', 'nav', 'Conferences & barcamps', 'Who is it for dropdown item'),
  ('nav.for.meetups', 'nav', 'Meetups', 'Who is it for dropdown item'),
  ('nav.for.festivals', 'nav', 'Festivals & Parties', 'Who is it for dropdown item'),
  ('nav.for.weddings', 'nav', 'Weddings', 'Who is it for dropdown item'),
  ('nav.for.bars', 'nav', 'Bars & cafés', 'Who is it for dropdown item'),
  ('nav.for.schools', 'nav', 'Schools & universities', 'Who is it for dropdown item'),
  ('nav.for.teams', 'nav', 'Company teams', 'Who is it for dropdown item'),
  -- Footer
  ('footer.tagline', 'footer', 'Magic by networking', 'Tagline under logo'),
  ('footer.product', 'footer', 'Product', 'Footer section heading'),
  ('footer.company', 'footer', 'Company', 'Footer section heading'),
  ('footer.support', 'footer', 'Support', 'Footer section heading'),
  ('footer.legal', 'footer', 'Legal', 'Footer section heading'),
  ('footer.ourStory', 'footer', 'Our story', 'Footer link'),
  ('footer.newsroom', 'footer', 'Newsroom', 'Footer link'),
  ('footer.contactUs', 'footer', 'Contact us', 'Footer link'),
  ('footer.helpCenter', 'footer', 'Help center', 'Footer link'),
  ('footer.termsOfUse', 'footer', 'Terms of use', 'Footer link'),
  ('footer.privacyPolicy', 'footer', 'Privacy policy', 'Footer link'),
  ('footer.copyright', 'footer', '© {year} Wonderelo. All rights reserved.', 'Copyright text with year placeholder'),
  -- Homepage hero
  ('homepage.participant.joining', 'homepage', 'Joining as a participant?', 'Participant code entry label'),
  ('homepage.participant.placeholder', 'homepage', 'Enter code here', 'Participant code input placeholder'),
  ('homepage.participant.join', 'homepage', 'Join', 'Join button'),
  ('homepage.hero.title', 'homepage', 'Add value to your event with networking rounds!', 'Hero section main title'),
  ('homepage.hero.subtitle', 'homepage', 'Easily turn networking from side effect into program highlight! Perfect for conferences, meet-ups, festivals, internal meetings and private events.', 'Hero section subtitle'),
  ('homepage.hero.cta', 'homepage', 'Start for free', 'Hero CTA button'),
  ('homepage.hero.badge1', 'homepage', 'Five minute set up', 'Hero badge 1'),
  ('homepage.hero.badge2', 'homepage', 'For events of every size', 'Hero badge 2'),
  ('homepage.hero.badge3', 'homepage', 'No worry pricing', 'Hero badge 3'),
  ('homepage.asSeenIn', 'homepage', 'As seen in', 'Media logos section title');

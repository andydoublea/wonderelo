/* Wonderelo — shared public-site top nav (Claude Design `.w-nav`).
   Re-expresses the legacy src/components/Navigation.tsx logic with the brand
   `.w-nav*` classes from src/styles/wonderelo-public.css.

   Renders inside a page that already carries the `.wonderelo` scope — do NOT
   self-scope here.

   ALL behaviour is preserved from the legacy nav:
   • "Who is it for?" hover dropdown with its 7 `/for/:slug` items
   • i18n via useTranslation (t(key, fallback))
   • onGetStarted / onSignIn props
   • participant-token check (My account dropdown when logged in)
   • Sheet-based mobile menu (restyled minimally with brand tokens)

   Center links mirror the homepage nav: Who is it for? / How it works / Pricing.
   Right side: ghost Sign in + primary Get started. */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from '../../hooks/useTranslation';

/* "Who is it for?" mega-menu items — the seven `/for/:slug` landing pages.
   Icon markup is copied VERBATIM from the v09 design (hero-variants.js `WHO_ITEMS`
   / wonderelo-nav.js `WHO`) and injected as-is so `<circle>`/`<rect>` primitives
   survive and both public navs match. */
const whoIsItForItems = [
  { key: 'nav.for.conferences', fallback: 'Conferences & barcamps', noteKey: 'nav.for.conferences.note', note: 'Break the badge-scanning ice', path: '/for/conferences', icon: '<path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/>' },
  { key: 'nav.for.meetups', fallback: 'Meetups', noteKey: 'nav.for.meetups.note', note: 'Regulars meet the new faces', path: '/for/meetups', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' },
  { key: 'nav.for.festivals', fallback: 'Festivals & parties', noteKey: 'nav.for.festivals.note', note: 'Crowds turn into groups', path: '/for/festivals', icon: '<path d="m2 22 8-8"/><path d="m14 4 6 6"/><path d="M11 7 7 11l6 6 4-4z"/><path d="M19 3v2M22 6h-2M17 1v2"/>' },
  { key: 'nav.for.weddings', fallback: 'Weddings', noteKey: 'nav.for.weddings.note', note: 'Two families, one dance floor', path: '/for/weddings', icon: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>' },
  { key: 'nav.for.bars', fallback: 'Bars & cafés', noteKey: 'nav.for.bars.note', note: 'Turn a quiet night social', path: '/for/bars', icon: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path d="M6 1v3M10 1v3M14 1v3"/>' },
  { key: 'nav.for.schools', fallback: 'Schools & universities', noteKey: 'nav.for.schools.note', note: 'Freshers find their people', path: '/for/schools', icon: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>' },
  { key: 'nav.for.teams', fallback: 'Company teams', noteKey: 'nav.for.teams.note', note: 'Cross-team, not same-desk', path: '/for/teams', icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' },
];

// Renders the verbatim v09 icon path markup at the given size (orange, 1.8 stroke).
const WhoIcon = ({ markup, size = 17 }: { markup: string; size?: number }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: markup }}
  />
);

// Small caret matching the design's icon weight (see PdNav).
const Caret = ({ open }: { open: boolean }) => (
  <svg
    className="w-nav-caret"
    width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform .15s ease', transform: open ? 'rotate(180deg)' : 'none' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface PublicNavProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function PublicNav({ onGetStarted, onSignIn }: PublicNavProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [whoIsItForOpen, setWhoIsItForOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWhoOpen, setMobileWhoOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('participant_token');
    setParticipantToken(token);
  }, []);

  // Homepage section anchors (mirrors the homepage nav). If already on "/",
  // smooth-scroll to the section; otherwise route to "/#<id>".
  const goToHash = (id: string) => {
    setMobileMenuOpen(false);
    if (window.location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <nav className="w-nav">
      <div className="w-nav-inner">
        {/* Logo lockup → home */}
        <a
          className="w-lockup"
          role="button"
          tabIndex={0}
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}
        >
          <div className="w-mark"><div className="w-inner" /></div>
          <div className="w-word">wonderelo</div>
        </a>

        {/* Center links (desktop) — mirror the v07 design nav:
            "Who is it for?" is a hover dropdown (7 `/for/:slug` items), then two
            flat links "How it works / Pricing". */}
        <div className="w-nav-links">
          {/* Who is it for? — v09 hover mega-menu (wonderelo-nav.js `.who-pop`):
              2-column grid of icon-tile + bold label + one-line note, centered
              under the trigger with a hover bridge so the pointer can travel down. */}
          <div
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setWhoIsItForOpen(true)}
            onMouseLeave={() => setWhoIsItForOpen(false)}
          >
            <button type="button" className="w-nav-link">
              {t('nav.whoIsItFor', 'Who is it for?')}
              <Caret open={whoIsItForOpen} />
            </button>
            {/* Hover bridge — invisible span across the 14px gap to the panel. */}
            <span style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: 16 }} />
            <div
              style={{
                position: 'absolute', left: '50%', top: 'calc(100% + 14px)', zIndex: 60,
                width: 520, padding: 12, boxSizing: 'border-box',
                transform: whoIsItForOpen ? 'translate(-50%, 0)' : 'translate(-50%, -6px)',
                opacity: whoIsItForOpen ? 1 : 0,
                pointerEvents: whoIsItForOpen ? 'auto' : 'none',
                transition: 'opacity .18s ease, transform .18s ease',
                background: '#fbf6ec',
                border: '1px solid rgba(76,25,77,.12)',
                borderRadius: 20,
                boxShadow: '0 28px 60px rgba(76,25,77,.18)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              }}
            >
              {whoIsItForItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setWhoIsItForOpen(false); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '34px 1fr', alignItems: 'center', gap: 12,
                    padding: '9px 11px', borderRadius: 13, textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    transition: 'background-color .16s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span
                    style={{
                      width: 34, height: 34, borderRadius: 10, display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: '#fff', border: '1px solid rgba(76,25,77,.10)', color: '#dd531c',
                    }}
                  >
                    <WhoIcon markup={item.icon} />
                  </span>
                  {/* Label only — no note row (matches homepage WhoMenu; user wants notes removed from both navs). */}
                  <b style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '-.01em', color: '#4b1d51' }}>
                    {t(item.key, item.fallback)}
                  </b>
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="w-nav-link" onClick={() => goToHash('how-it-works')}>
            {t('homepage.nav.howItWorks', 'How it works')}
          </button>
          <button type="button" className="w-nav-link" onClick={() => navigate('/pricing')}>
            {t('nav.pricing', 'Pricing')}
          </button>
        </div>

        {/* Right actions */}
        <div className="w-nav-right">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="w-nav-link"
            style={{ display: 'none' }}
            data-mobile-burger
            aria-label="Menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>

          {/* Desktop auth */}
          {participantToken ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-btn w-btn-ghost w-btn-sm">
                  <svg className="w-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" /></svg>
                  {t('nav.myAccount', 'My account')}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/p/${participantToken}`)}>
                  {t('nav.myDashboard', 'My dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem('participant_token');
                    setParticipantToken(null);
                    toast.success('Logged out successfully');
                  }}
                >
                  <svg className="w-ico" style={{ marginRight: 8 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  {t('nav.logOut', 'Log out')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {onSignIn && (
                <button type="button" className="w-btn w-btn-ghost w-btn-sm" onClick={onSignIn}>
                  {t('nav.logIn', 'Sign in')}
                </button>
              )}
              {onGetStarted && (
                <button type="button" className="w-btn w-btn-primary" onClick={onGetStarted}>
                  {t('homepage.nav.cta', 'Start for free')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile menu drawer (kept from legacy nav, restyled with brand tokens) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" style={{ width: '300px', padding: '0', background: 'var(--w-paper)' }}>
          <SheetHeader style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--w-hairline)' }}>
            <SheetTitle>
              <span className="w-word" style={{ fontSize: '1.25rem' }}>wonderelo</span>
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', padding: '0.5rem 0' }}>
            {/* Mobile links mirror the v07 design nav: "Who is it for?" expands to
                the 7 `/for/:slug` sub-links, then flat How it works / Pricing. */}
            <div>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMobileWhoOpen(!mobileWhoOpen)}
              >
                {t('nav.whoIsItFor', 'Who is it for?')}
                <Caret open={mobileWhoOpen} />
              </button>
              {mobileWhoOpen && (
                <div style={{ paddingBottom: '0.25rem' }}>
                  {whoIsItForItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 1.5rem 0.625rem 2.25rem', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'var(--w-font-body)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--w-ink)', opacity: 0.75 }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ display: 'inline-flex', flexShrink: 0, color: '#dd531c' }}>
                        <WhoIcon markup={item.icon} size={16} />
                      </span>
                      {t(item.key, item.fallback)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => goToHash('how-it-works')}
            >
              {t('homepage.nav.howItWorks', 'How it works')}
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
            >
              {t('nav.pricing', 'Pricing')}
            </button>
          </div>

          {/* Sign in / Get started */}
          {!participantToken && (
            <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--w-hairline)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {onSignIn && (
                <button type="button" className="w-btn w-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>
                  {t('nav.logIn', 'Sign in')}
                </button>
              )}
              {onGetStarted && (
                <button type="button" className="w-btn w-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}>
                  {t('homepage.nav.cta', 'Start for free')}
                </button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </nav>
  );
}

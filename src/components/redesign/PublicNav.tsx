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

   Center links per public-site spec: Who is it for? / Pricing / Our story / Blog.
   Right side: LanguageSwitcher (as `.w-lang`) + ghost Sign in + primary Get started. */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Mic, HandHeart, Music, Heart, Coffee, BookOpen, GitBranch } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from '../../hooks/useTranslation';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

const whoIsItForItems = [
  { key: 'nav.for.conferences', fallback: 'Conferences & barcamps', path: '/for/conferences', icon: Mic },
  { key: 'nav.for.meetups', fallback: 'Meetups', path: '/for/meetups', icon: HandHeart },
  { key: 'nav.for.festivals', fallback: 'Festivals & Parties', path: '/for/festivals', icon: Music },
  { key: 'nav.for.weddings', fallback: 'Weddings', path: '/for/weddings', icon: Heart },
  { key: 'nav.for.bars', fallback: 'Bars & cafés', path: '/for/bars', icon: Coffee },
  { key: 'nav.for.schools', fallback: 'Schools & universities', path: '/for/schools', icon: BookOpen },
  { key: 'nav.for.teams', fallback: 'Company teams', path: '/for/teams', icon: GitBranch },
];

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

        {/* Center links (desktop) — mirror the homepage nav exactly:
            3 flat links "Who is it for? / How it works / Pricing".
            The who-is-it-for hover dropdown (7 `/for/:slug` items) and the
            "Our story" / "Blog" links are intentionally NOT rendered here to
            match the design 1:1 — their code is preserved just below, guarded
            by `false`. */}
        <div className="w-nav-links">
          <button type="button" className="w-nav-link" onClick={() => goToHash('who-is-it-for')}>
            {t('nav.whoIsItFor', 'Who is it for?')}
          </button>
          <button type="button" className="w-nav-link" onClick={() => goToHash('how-it-works')}>
            {t('homepage.nav.howItWorks', 'How it works')}
          </button>
          <button type="button" className="w-nav-link" onClick={() => navigate('/pricing')}>
            {t('nav.pricing', 'Pricing')}
          </button>

          {/* HIDDEN — who-is-it-for hover dropdown (7 `/for/:slug` items).
              Preserved for later; not part of the design nav. */}
          {false && (
            <div
              className="relative"
              style={{ position: 'relative' }}
              onMouseEnter={() => setWhoIsItForOpen(true)}
              onMouseLeave={() => setWhoIsItForOpen(false)}
            >
              <button type="button" className="w-nav-link">
                {t('nav.whoIsItFor', 'Who is it for?')}
                <Caret open={whoIsItForOpen} />
              </button>
              {whoIsItForOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: 4, zIndex: 60 }}>
                  <div
                    style={{
                      background: 'var(--w-paper)',
                      border: '1px solid var(--w-hairline)',
                      borderRadius: 'var(--w-r-md)',
                      boxShadow: 'var(--w-shadow-soft)',
                      padding: '10px 0',
                      minWidth: 300,
                    }}
                  >
                    {whoIsItForItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => { navigate(item.path); setWhoIsItForOpen(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                            padding: '10px 22px', fontSize: 14, fontWeight: 600,
                            fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)',
                            textAlign: 'left', background: 'transparent', border: 'none',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ opacity: 0.65 }} />
                          {t(item.key, item.fallback)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HIDDEN — "Our story" / "Blog" center links (not in design nav). */}
          {false && (
            <>
              <button type="button" className="w-nav-link" onClick={() => navigate('/our-story')}>
                {t('nav.ourStory', 'Our story')}
              </button>
              <button type="button" className="w-nav-link" onClick={() => navigate('/blog')}>
                {t('nav.blog', 'Blog')}
              </button>
            </>
          )}
        </div>

        {/* Right actions */}
        <div className="w-nav-right">
          {/* HIDDEN — LanguageSwitcher (not in design nav). Code preserved. */}
          {false && (
            <span className="w-lang" style={{ padding: 0, display: 'inline-flex' }}>
              <LanguageSwitcher />
            </span>
          )}

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
            {/* Mobile links mirror the homepage nav: Who is it for? / How it works / Pricing.
                LanguageSwitcher + who-is-it-for sublist + Our story/Blog are hidden to
                match the design (code preserved below, guarded by `false`). */}
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => goToHash('who-is-it-for')}
            >
              {t('nav.whoIsItFor', 'Who is it for?')}
            </button>
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

            {/* HIDDEN — LanguageSwitcher + who-is-it-for sublist + Our story/Blog. */}
            {false && (
              <>
                <div style={{ padding: '0.5rem 1.5rem' }}>
                  <LanguageSwitcher />
                </div>
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
                      {whoIsItForItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 1.5rem 0.625rem 2.25rem', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'var(--w-font-body)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--w-ink)', opacity: 0.75 }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(76,25,77,.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Icon style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                            {t(item.key, item.fallback)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={() => { navigate('/our-story'); setMobileMenuOpen(false); }}
                >
                  {t('nav.ourStory', 'Our story')}
                </button>
                <button
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--w-font-body)', color: 'var(--w-ink)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={() => { navigate('/blog'); setMobileMenuOpen(false); }}
                >
                  {t('nav.blog', 'Blog')}
                </button>
              </>
            )}
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

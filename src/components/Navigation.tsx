import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { User, LogOut, ChevronDown, Mic, HandHeart, Music, Heart, Coffee, BookOpen, GitBranch, Menu, LayoutDashboard, Settings, FileText, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { toast } from 'sonner@2.0.3';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './i18n/LanguageSwitcher';
import { useApp } from '../AppRouter';

const whoIsItForItems = [
  { key: 'nav.for.conferences', fallback: 'Conferences & barcamps', path: '/for/conferences', icon: Mic },
  { key: 'nav.for.meetups', fallback: 'Meetups', path: '/for/meetups', icon: HandHeart },
  { key: 'nav.for.festivals', fallback: 'Festivals & Parties', path: '/for/festivals', icon: Music },
  { key: 'nav.for.weddings', fallback: 'Weddings', path: '/for/weddings', icon: Heart },
  { key: 'nav.for.bars', fallback: 'Bars & cafés', path: '/for/bars', icon: Coffee },
  { key: 'nav.for.schools', fallback: 'Schools & universities', path: '/for/schools', icon: BookOpen },
  { key: 'nav.for.teams', fallback: 'Company teams', path: '/for/teams', icon: GitBranch },
];

interface NavigationProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function Navigation({ onGetStarted, onSignIn }: NavigationProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, currentUser, handleSignOut } = useApp();
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [whoIsItForOpen, setWhoIsItForOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWhoOpen, setMobileWhoOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('participant_token');
    setParticipantToken(token);
  }, []);

  // Authenticated organizer takes precedence over participant token
  // (an admin who is also browsing as a participant should see organizer UI here).
  const isOrganizer = isAuthenticated && !!currentUser;
  const organizerDisplayName = currentUser?.organizerName || currentUser?.email || 'Account';

  const handleOrganizerSignOut = async () => {
    await handleSignOut();
    toast.success('Signed out');
    navigate('/');
  };

  return (
    <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h2
              className="text-primary wonderelo-logo cursor-pointer"
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/'); }}
            >
              Wonderelo
            </h2>
            <div className="hidden md:flex items-center space-x-6">
              {/* Who is it for? - hover dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setWhoIsItForOpen(true)}
                onMouseLeave={() => setWhoIsItForOpen(false)}
              >
                <Button variant="ghost" className="gap-1">
                  {t('nav.whoIsItFor', 'Who is it for?')}
                  <ChevronDown className={`h-4 w-4 transition-transform ${whoIsItForOpen ? 'rotate-180' : ''}`} />
                </Button>
                {whoIsItForOpen && (
                  <div className="absolute top-full left-0 pt-1 z-50">
                    <div className="bg-background border border-border rounded-lg shadow-lg py-3 min-w-[320px]">
                      {whoIsItForItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setWhoIsItForOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-6 py-3 text-sm text-left transition-colors whitespace-nowrap"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0e6f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            {t(item.key, item.fallback)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <Button variant="ghost" onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                {t('nav.howItWorks', 'How it works')}
              </Button>
              <Button variant="ghost" onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                {t('nav.features', 'Features')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>
                {t('nav.pricing', 'Pricing')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/demo')}>
                {t('nav.demo', 'Demo')}
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Language switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              style={{ marginLeft: 'auto', marginRight: '-0.5rem' }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop-only auth buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {isOrganizer ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      {organizerDisplayName}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/account-settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/event-page-settings')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Event page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/billing')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleOrganizerSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : participantToken ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.myAccount', 'My account')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/p/${participantToken}`)}>
                      {t('nav.myDashboard', 'My dashboard')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        const { clearParticipantTokenAndDerivedData } = await import('../utils/participantTokenStorage');
                        clearParticipantTokenAndDerivedData();
                        setParticipantToken(null);
                        toast.success('Logged out successfully');
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logOut', 'Log out')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {onSignIn && (
                    <Button variant="ghost" onClick={onSignIn}>
                      {t('nav.logIn', 'Log in')}
                    </Button>
                  )}
                  {onGetStarted && (
                    <Button onClick={onGetStarted}>
                      {t('nav.signUp', 'Sign up')}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" style={{ width: '300px', padding: '0' }}>
          <SheetHeader style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <SheetTitle>
              <span className="text-primary wonderelo-logo" style={{ fontSize: '1.25rem' }}>Wonderelo</span>
            </SheetTitle>
          </SheetHeader>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', padding: '0.5rem 0' }}>
            {/* Language switcher (mobile) */}
            <div style={{ padding: '0.5rem 1.5rem' }}>
              <LanguageSwitcher />
            </div>

            {/* Who is it for - expandable */}
            <div>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMobileWhoOpen(!mobileWhoOpen)}
              >
                {t('nav.whoIsItFor', 'Who is it for?')}
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileWhoOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileWhoOpen && (
                <div style={{ paddingBottom: '0.25rem' }}>
                  {whoIsItForItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.625rem 1.5rem 0.625rem 2.25rem', fontSize: '0.875rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
                setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
            >
              {t('nav.howItWorks', 'How it works')}
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => {
                navigate('/');
                setMobileMenuOpen(false);
                setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }}
            >
              {t('nav.features', 'Features')}
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
            >
              {t('nav.pricing', 'Pricing')}
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => { navigate('/demo'); setMobileMenuOpen(false); }}
            >
              {t('nav.demo', 'Demo')}
            </button>
          </div>

          {/* Auth section: organizer dropdown / participant card / login + signup */}
          {isOrganizer ? (
            <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', paddingBottom: '0.25rem' }}>
                Signed in as <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{organizerDisplayName}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => { setMobileMenuOpen(false); await handleOrganizerSignOut(); }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          ) : !participantToken && (
            <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {onSignIn && (
                <Button variant="outline" className="w-full" onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>
                  {t('nav.logIn', 'Log in')}
                </Button>
              )}
              {onGetStarted && (
                <Button className="w-full" onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}>
                  {t('nav.signUpFree', 'Sign up free')}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </nav>
  );
}

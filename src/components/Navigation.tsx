import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { User, LogOut, ChevronDown, Mic, HandHeart, Music, Heart, Coffee, BookOpen, GitBranch, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { toast } from 'sonner@2.0.3';

const whoIsItForItems = [
  { label: 'Conferences & barcamps', path: '/for/conferences', icon: Mic },
  { label: 'Meetups', path: '/for/meetups', icon: HandHeart },
  { label: 'Festivals & Parties', path: '/for/festivals', icon: Music },
  { label: 'Weddings', path: '/for/weddings', icon: Heart },
  { label: 'Bars & cafés', path: '/for/bars', icon: Coffee },
  { label: 'Schools & universities', path: '/for/schools', icon: BookOpen },
  { label: 'Company teams', path: '/for/teams', icon: GitBranch },
];

interface NavigationProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function Navigation({ onGetStarted, onSignIn }: NavigationProps) {
  const navigate = useNavigate();
  const [participantToken, setParticipantToken] = useState<string | null>(null);
  const [whoIsItForOpen, setWhoIsItForOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileWhoOpen, setMobileWhoOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('participant_token');
    setParticipantToken(token);
  }, []);

  return (
    <nav className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h2
              className="text-primary wonderelo-logo cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
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
                  Who is it for?
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
                            {item.label}
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
                How it works
              </Button>
              <Button variant="ghost" onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                Features
              </Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>
                Pricing
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
              {participantToken ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      My account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/p/${participantToken}`)}>
                      My dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.removeItem('participant_token');
                        setParticipantToken(null);
                        toast.success('Logged out successfully');
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  {onSignIn && (
                    <Button variant="ghost" onClick={onSignIn}>
                      Log in
                    </Button>
                  )}
                  {onGetStarted && (
                    <Button onClick={onGetStarted}>
                      Sign up
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
            {/* Who is it for - expandable */}
            <div>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setMobileWhoOpen(!mobileWhoOpen)}
              >
                Who is it for?
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
                        {item.label}
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
              How it works
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
              Features
            </button>
            <button
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9375rem', fontWeight: 500, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }}
            >
              Pricing
            </button>
          </div>

          {/* Login / Sign up */}
          {!participantToken && (
            <div style={{ marginTop: 'auto', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {onSignIn && (
                <Button variant="outline" className="w-full" onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>
                  Log in
                </Button>
              )}
              {onGetStarted && (
                <Button className="w-full" onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}>
                  Sign up free
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </nav>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { EventPromoPage } from './EventPromoPage';
import { UserPublicPage } from './UserPublicPage';
import { Footer } from './Footer';
import { Eye, Loader2, Monitor, Smartphone, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { NetworkingSession } from '../App';

type Phase = 'slide' | 'event';

const DEMO_DISPLAY_NAME = 'Lovely event';
const DEMO_DISPLAY_SLUG = 'Lovelyevent';

interface DemoUserProfile {
  profileImageUrl?: string;
}

export function DemoPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('slide');
  const [isSettingUp, setIsSettingUp] = useState(true);
  const [userProfile, setUserProfile] = useState<DemoUserProfile | null>(null);
  const [sessions, setSessions] = useState<NetworkingSession[]>([]);

  // Ensure demo data is ready, then fetch the public event data
  useEffect(() => {
    let cancelled = false;

    const fetchDemoData = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/public/user/demo`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          // Only keep the profile image — name/slug are overridden with demo branding below
          setUserProfile({
            profileImageUrl: data.user?.profileImageUrl,
          });
          setSessions(data.sessions || []);
        }
      } catch {
        // Non-critical — slide will still render with empty session list
      }
    };

    const setup = async () => {
      try {
        setIsSettingUp(true);
        const res = await fetch(`${apiBaseUrl}/demo/setup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          // Pass client TZ offset so backend generates round times in our local
          // wall-clock (otherwise the UTC backend would emit times that look
          // ~2h in the past for CEST visitors).
          body: JSON.stringify({ tzOffsetMinutes: new Date().getTimezoneOffset() }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchDemoData();
        }
      } catch {
        // Backend unreachable — fail silently; demo just won't show live data
      } finally {
        if (!cancelled) setIsSettingUp(false);
      }
    };

    setup();

    // Refresh demo data every 2 minutes to keep rounds in the future
    const interval = setInterval(setup, 120_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky demo switcher banner */}
      <div className="sticky top-0 z-50 bg-primary text-primary-foreground" style={{ zIndex: 60 }}>
        <div className="container mx-auto max-w-6xl px-4 py-3">
          {/* Header row: Demo mode badge + Back to homepage */}
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-xs font-medium uppercase tracking-wide">
              <Eye className="h-3.5 w-3.5" />
              Demo mode
              {isSettingUp && <Loader2 className="h-3 w-3 animate-spin opacity-80" />}
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md hover:bg-primary-foreground/15 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to homepage
            </button>
          </div>

          {/* Switcher */}
          <div className="flex flex-col md:flex-row gap-2" style={{ alignItems: 'stretch' }}>
            <div className="flex-1">
              <PhaseButton
                active={phase === 'slide'}
                icon={<Monitor className="h-5 w-5" />}
                title="Presenter slide"
                description="Projected on screen at the event — participants scan the QR code to join."
                onClick={() => {
                  setPhase('slide');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
            <div
              aria-hidden="true"
              className="flex items-center justify-center text-primary-foreground/80"
            >
              <ArrowDown className="h-5 w-5 demo-arrow-down" />
              <ArrowRight className="h-5 w-5 demo-arrow-right" />
            </div>
            <div className="flex-1">
              <PhaseButton
                active={phase === 'event'}
                icon={<Smartphone className="h-5 w-5" />}
                title="Event page"
                description="What participants see on their phone after scanning to register for rounds."
                onClick={() => {
                  setPhase('event');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {phase === 'slide' ? (
          <EventPromoPage
            eventSlug="demo"
            displaySlug={DEMO_DISPLAY_SLUG}
            sessions={sessions}
            organizerName={DEMO_DISPLAY_NAME}
            eventName={DEMO_DISPLAY_NAME}
            profileImageUrl={userProfile?.profileImageUrl}
          />
        ) : (
          <UserPublicPage userSlug="demo" />
        )}
      </div>

      <Footer />
    </div>
  );
}

interface PhaseButtonProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function PhaseButton({ active, icon, title, description, onClick }: PhaseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'w-full h-full rounded-lg p-4 text-left transition-colors border',
        active
          ? 'bg-white text-primary border-white shadow-sm'
          : 'bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 font-semibold text-base">
        {icon}
        {title}
      </div>
      <div className={['text-sm mt-1', active ? 'text-primary/80' : 'opacity-90'].join(' ')}>
        {description}
      </div>
    </button>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { EventPromoPage } from './EventPromoPage';
import { UserPublicPage } from './UserPublicPage';
import { PublicFooter } from './redesign/PublicFooter';
import { Eye, Monitor, Smartphone, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';
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
  const [userProfile, setUserProfile] = useState<DemoUserProfile | null>(null);
  const [sessions, setSessions] = useState<NetworkingSession[]>([]);

  // Ensure demo data is set up on the backend so UserPublicPage has rounds to show
  useEffect(() => {
    let cancelled = false;

    // Pull the public event data (profile image + published sessions) that the
    // presenter slide renders — sessions drive the live "next round" countdown.
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
          setUserProfile({ profileImageUrl: data.user?.profileImageUrl });
          setSessions(data.sessions || []);
        }
      } catch {
        // Non-critical — slide still renders with an empty session list
      }
    };

    const setup = async () => {
      try {
        await fetch(`${apiBaseUrl}/demo/setup`, {
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
      } catch {
        // Backend unreachable — fail silently; demo just won't show live data
      }
      // After (re)seeding demo data, refresh the public event data for the slide
      await fetchDemoData();
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
      {/* Sticky demo switcher banner — compact: DEMO MODE + switcher on a
          single row, Back-to-homepage link tucked under DEMO MODE.
          Uses inline backgroundColor instead of `bg-primary` class so the
          global `.vs-jasper .bg-primary:hover` rule doesn't darken the
          entire band on hover. Falls back to --primary for non-jasper themes. */}
      <div
        className="sticky top-0 z-50 text-primary-foreground"
        style={{ zIndex: 60, backgroundColor: 'var(--vs-orange, var(--primary))' }}
      >
        <div className="container mx-auto max-w-6xl px-4 py-2">
          <div className="flex items-stretch gap-3">
            {/* Left column: DEMO MODE badge + Back to homepage under it */}
            <div className="flex flex-col justify-between gap-1 shrink-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-xs font-medium uppercase tracking-wide self-start">
                <Eye className="h-3.5 w-3.5" />
                Demo mode
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="demo-back-link inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md self-start"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to homepage
              </button>
            </div>

            {/* Right column: phase switcher (Presenter slide ↔ Event page) */}
            <div className="flex-1 flex flex-col md:flex-row gap-2" style={{ alignItems: 'stretch' }}>
              <div className="flex-1">
                <PhaseButton
                  active={phase === 'slide'}
                  icon={<Monitor className="h-5 w-5" />}
                  title="Presenter slide"
                  description="Organizer invites attendees to join rounds"
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
                  description="What participants see after scanning QR code"
                  onClick={() => {
                    setPhase('event');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" style={{ position: 'relative', minHeight: '600px' }}>
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

      <PublicFooter />
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
        'w-full h-full rounded-lg p-4 text-left border',
        active
          ? 'bg-white text-primary border-white shadow-sm cursor-default'
          : 'demo-phase-btn-inactive border-white/20',
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

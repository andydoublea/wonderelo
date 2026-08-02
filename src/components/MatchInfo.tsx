import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { MapPin, Loader2, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { WondereloHeader } from './WondereloHeader';
import { MissedRound } from './MissedRound';
import { PdNav } from './redesign/PdNav';
import { FlipClock } from './redesign/FlipClock';
import { PmFooter } from './redesign/PmFooter';

// Shared participant nav wired for the matching flow (dashboard + logout only;
// profile/address-book are secondary during a live round).
function MatchNav({ firstName, onBackToDashboard }: { firstName?: string; onBackToDashboard: () => void }) {
  return (
    <PdNav
      firstName={firstName}
      onBrandClick={onBackToDashboard}
      onDashboard={onBackToDashboard}
      onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
      onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
    />
  );
}

// Reads the cached dashboard to recover the event name (organizer.event_name)
// and session name (session.name) for the matching-flow event row. The live
// match endpoint carries sessionName but not the event name, so we backfill the
// event name from the cache the dashboard already populated on its way here.
// Recover the current participant's first name from the profile the dashboard
// cached on its way here — used for the nav on match-flow states that have no
// live participant payload (e.g. the no-match screen).
export function cachedFirstName(token?: string): string {
  try {
    const raw = token ? localStorage.getItem(`participant_profile_${token}`) : null;
    if (raw) return JSON.parse(raw)?.firstName || '';
  } catch { /* ignore */ }
  return '';
}

export function cachedRoundNames(token?: string, roundId?: string): { event: string; session: string } {
  try {
    const raw = token ? localStorage.getItem(`participant_dashboard_${token}`) : null;
    if (raw) {
      const d = JSON.parse(raw);
      const regs = d.registrations || [];
      const reg = (roundId && regs.find((r: any) => r.roundId === roundId)) || regs[0];
      if (reg) return { event: reg.eventName || reg.sessionName || '', session: reg.sessionName || '' };
    }
  } catch { /* ignore */ }
  return { event: '', session: '' };
}

export interface MatchData {
  matchId: string;
  roundId?: string;
  roundName?: string;
  /** Event name (organizer.event_name) — bold primary in the event row. */
  eventName?: string;
  /** Session name (session.name) — light subtitle in the event row. */
  sessionName?: string;
  /** Current participant's first name — shown in the nav. */
  myName?: string;
  sessionId?: string;
  status?: string;
  meetingPointName: string;
  meetingPointImageUrl?: string;
  meetingPointType?: 'physical' | 'virtual';
  meetingPointVideoCallUrl?: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  roundStartTime?: string;
  walkingDeadline?: string;
  networkingEndTime?: string;
}

// ============================================================
// Pure view components (shared with AdminPagePreview)
// ============================================================

export interface MatchInfoMatchedViewProps {
  matchData: MatchData;
  countdown?: ReactNode;
  isSubmitting: boolean;
  onImHere: () => void;
  onBackToDashboard: () => void;
}

export function MatchInfoMatchedView({
  matchData,
  countdown,
  isSubmitting,
  onImHere,
  onBackToDashboard,
}: MatchInfoMatchedViewProps) {
  const walkSecs = matchData.walkingDeadline
    ? Math.max(0, Math.floor((new Date(matchData.walkingDeadline).getTime() - Date.now()) / 1000))
    : null;
  return (
    <div className="wonderelo pm-page" data-active="meeting-point">
      <div className="pm-shell">
        <MatchNav firstName={matchData.myName || matchData.participants?.[0]?.firstName} onBackToDashboard={onBackToDashboard} />
        <div data-screen="meeting-point">
          <div className="pm-band">
            <div className="pm-eventrow">
              <div className="pm-event"><span className="name">{matchData.eventName || matchData.sessionName || 'Your round'}</span><span className="org">{matchData.sessionName || 'Speed networking'}</span></div>
              <span className="pm-state"><span className="dot" /> Live</span>
            </div>
            <div className="pm-focusbox">
              <div className="eyebrow">Now go to</div>
              <div className="place">{matchData.meetingPointName}</div>
              <div className="photo">
                {matchData.meetingPointImageUrl ? (
                  <img src={matchData.meetingPointImageUrl} alt={matchData.meetingPointName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                )}
              </div>
            </div>
            {(walkSecs != null || countdown) && (
              <div className="pm-center"><div className="pm-deadline"><span className="lbl">Walk over in</span>{walkSecs != null ? <FlipClock seconds={walkSecs} mini /> : countdown}</div></div>
            )}
          </div>
          <div className="pm-sticky">
            <button className="pm-btn is-primary" type="button" onClick={onImHere} disabled={isSubmitting}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {isSubmitting ? 'Checking in…' : `I am at ${matchData.meetingPointName}`}
            </button>
            <div className="pm-center"><button className="pm-link" type="button" onClick={onBackToDashboard} style={{ marginTop: 12 }}>Back to dashboard</button></div>
          </div>
        </div>
        <PmFooter onBrandClick={onBackToDashboard} />
      </div>
    </div>
  );
}

export interface MatchInfoNoMatchViewProps {
  firstName?: string;
  eventName?: string;
  sessionName?: string;
  onBackToDashboard: () => void;
  onBackToEventPage: () => void;
}

export function MatchInfoNoMatchView({ firstName, eventName, sessionName, onBackToDashboard, onBackToEventPage }: MatchInfoNoMatchViewProps) {
  return (
    <div className="wonderelo pm-page" data-active="no-match">
      <div className="pm-shell">
        <MatchNav firstName={firstName} onBackToDashboard={onBackToDashboard} />
        <div data-screen="no-match">
          <div className="pm-band">
            <div className="pm-eventrow">
              <div className="pm-event"><span className="name">{eventName || 'Your round'}</span><span className="org">{sessionName || 'Speed networking'}</span></div>
              <span className="pm-state is-quiet"><span className="dot" /> Round closed</span>
            </div>
            <div className="pm-center" style={{ paddingTop: 6 }}>
              <div className="pm-emoji">😳</div>
              <h1 className="pm-h1" style={{ marginTop: 14 }}>No match found</h1>
              <p className="pm-muted" style={{ margin: '12px auto 0', maxWidth: 280 }}>No one else registered for this round.</p>
            </div>
          </div>
          <div className="pm-sticky">
            <button className="pm-btn is-primary" type="button" onClick={onBackToEventPage}>Try another round</button>
            <div className="pm-center"><button className="pm-link" type="button" onClick={onBackToDashboard} style={{ marginTop: 12 }}>Back to dashboard</button></div>
          </div>
        </div>
        <PmFooter onBrandClick={onBackToDashboard} />
      </div>
    </div>
  );
}

export function MatchInfo() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForMatch, setIsWaitingForMatch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeadlineExpired, setIsDeadlineExpired] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 60; // 60 * 2s = 120s max wait

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const fetchMatch = async (): Promise<'matched' | 'no-match' | 'not-ready' | 'error'> => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/match`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          if (errorData.reason === 'no-match') {
            setError('no-match');
            setIsLoading(false);
            setIsWaitingForMatch(false);
            return 'no-match';
          }
          // 404 without no-match = matching hasn't run yet
          return 'not-ready';
        }
        const errorText = await response.text();
        throw new Error(`Failed to load match data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchInfo] Match data loaded:', data);
      const names = cachedRoundNames(token, data.matchData?.roundId);
      setMatchData({
        ...data.matchData,
        eventName: data.matchData?.eventName || names.event,
        sessionName: data.matchData?.sessionName || names.session,
      });
      setIsLoading(false);
      setIsWaitingForMatch(false);

      // Detect missed: server status or walking deadline already past
      const md = data.matchData;
      const alreadyCheckedIn = md?.status === 'checked-in' || md?.status === 'met';
      const serverMissed = md?.status === 'missed';
      const deadlinePast = md?.walkingDeadline && new Date(md.walkingDeadline).getTime() <= Date.now();
      if (!alreadyCheckedIn && (serverMissed || deadlinePast)) {
        setIsDeadlineExpired(true);
      }
      return 'matched';
    } catch (err) {
      errorLog('[MatchInfo] Error:', err);
      return 'error';
    }
  };

  useEffect(() => {
    if (!token) {
      setError('Invalid participant token');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      debugLog('[MatchInfo] Loading match data for token:', token);
      const result = await fetchMatch();

      if (!mounted) return;

      if (result === 'matched' || result === 'no-match') {
        stopPolling();
        return;
      }

      if (result === 'not-ready') {
        // Match not ready yet — show waiting UI and start polling
        debugLog('[MatchInfo] Match not ready yet, starting to poll...');
        setIsWaitingForMatch(true);
        setIsLoading(false);

        pollCountRef.current = 0;
        pollIntervalRef.current = setInterval(async () => {
          if (!mounted) return;
          pollCountRef.current++;
          debugLog(`[MatchInfo] Polling for match... (attempt ${pollCountRef.current}/${MAX_POLL_ATTEMPTS})`);

          if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
            stopPolling();
            setError('Matching is taking longer than expected. Please go back and try again.');
            setIsWaitingForMatch(false);
            return;
          }

          const pollResult = await fetchMatch();
          if (!mounted) return;

          if (pollResult === 'matched' || pollResult === 'no-match') {
            stopPolling();
          }
          // 'not-ready' and 'error' during poll: keep polling
        }, 2000);
        return;
      }

      // error on initial load
      setError('Failed to load match data');
      setIsLoading(false);
    };

    init();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [token]);

  const handleImHere = async () => {
    if (!token || !matchData) return;

    setIsSubmitting(true);
    try {
      debugLog('[MatchInfo] Checking in at meeting point');

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/check-in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: matchData.matchId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check in: ${errorText}`);
      }

      debugLog('[MatchInfo] Check-in successful, navigating to match-partner');

      // Redirect to match-partner page
      navigate(`/p/${token}/match-partner`);

    } catch (err) {
      errorLog('[MatchInfo] Error checking in:', err);
      setIsSubmitting(false);
      // Show error but don't block navigation
      toast.error('Check-in failed, but you can still proceed');
      navigate(`/p/${token}/match-partner`);
    }
  };

  // Loading state (initial load)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your match...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Waiting for match (backend matching in progress)
  if (isWaitingForMatch) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Finding your match...</h2>
              <p className="text-muted-foreground mb-2">
                We're pairing you with someone right now.
              </p>
              <p className="text-sm text-muted-foreground">
                This usually takes just a few seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error === 'no-match') {
    const noMatchNames = cachedRoundNames(token);
    return (
      <MatchInfoNoMatchView
        firstName={cachedFirstName(token)}
        eventName={noMatchNames.event}
        sessionName={noMatchNames.session}
        onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
        onBackToEventPage={() => {
          // Pull organizer slug from cached dashboard data
          let slug = '';
          try {
            const cache = localStorage.getItem(`participant_dashboard_${token}`);
            if (cache) {
              const d = JSON.parse(cache);
              slug = d?.registrations?.[0]?.organizerUrlSlug || d?.organizerSlug || '';
            }
          } catch { /* ignore */ }
          navigate(slug ? `/${slug}` : `/p/${token}?from=match`);
        }}
      />
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground mb-6">{error || 'Failed to load match data'}</p>
              <Button onClick={() => navigate(`/p/${token}?from=match`)}>
                Back to dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Walking deadline expired and participant never checked in — show MissedRound.
  // MissedRound is a full-screen pm-page with its own nav, so render it directly
  // (no WondereloHeader wrapper — that would double up the nav).
  if (isDeadlineExpired && matchData.status !== 'checked-in' && matchData.status !== 'met') {
    return (
      <MissedRound
        participantToken={token!}
        roundId={matchData.roundId || ''}
        roundName={matchData.roundName}
        firstName={matchData.myName}
        eventName={matchData.eventName}
        sessionName={matchData.sessionName}
        onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
      />
    );
  }

  return (
    <MatchInfoMatchedView
      matchData={matchData}
      countdown={
        matchData.walkingDeadline ? (
          <CountdownTimer
            targetDate={matchData.walkingDeadline}
            size="large"
            onComplete={() => {
              debugLog('[MatchInfo] Walking deadline reached — switching to MissedRound view');
              setIsDeadlineExpired(true);
            }}
          />
        ) : undefined
      }
      isSubmitting={isSubmitting}
      onImHere={handleImHere}
      onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
    />
  );
}

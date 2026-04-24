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

export interface MatchData {
  matchId: string;
  roundId?: string;
  roundName?: string;
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
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center pb-32">
        {countdown && <div className="mb-8">{countdown}</div>}

        <h1 className="text-4xl font-bold mb-12">
          We have a match for you! {matchData.meetingPointType === 'virtual' ? 'Join the call:' : 'Now go to:'}
        </h1>

        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-8 min-h-[220px] grid place-items-center gap-6">
          <h2 className="text-4xl font-bold">{matchData.meetingPointName}</h2>

          {matchData.meetingPointType === 'virtual' && matchData.meetingPointVideoCallUrl ? (
            <div>
              <a
                href={matchData.meetingPointVideoCallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
              >
                <Video className="h-6 w-6" />
                Join video call
                <ExternalLink className="h-5 w-5" />
              </a>
              <p className="text-sm text-muted-foreground mt-3">Opens in a new tab</p>
            </div>
          ) : (
            matchData.meetingPointImageUrl && (
              <div>
                <img
                  src={matchData.meetingPointImageUrl}
                  alt={matchData.meetingPointName}
                  className="mx-auto rounded-lg shadow-lg max-w-md w-full object-cover"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            )
          )}
        </fieldset>

        <div>
          <button
            onClick={onBackToDashboard}
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-10">
        <div className="max-w-md mx-auto">
          <Button size="lg" className="w-full" onClick={onImHere} disabled={isSubmitting}>
            <MapPin className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Checking in...' : `I am at ${matchData.meetingPointName}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface MatchInfoNoMatchViewProps {
  onBackToDashboard: () => void;
  onBackToEventPage: () => void;
}

export function MatchInfoNoMatchView({ onBackToDashboard, onBackToEventPage }: MatchInfoNoMatchViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="text-6xl mb-6">😳</div>
        <h1 className="text-4xl font-bold mb-4">No match found</h1>
        <p className="text-lg text-muted-foreground mb-12">
          No one else registered for this round.
        </p>
        <h2 className="text-2xl font-bold mb-6">Try another round!</h2>
        <Button size="lg" onClick={onBackToEventPage}>
          Back to event page
        </Button>
        <div className="mt-6">
          <button
            onClick={onBackToDashboard}
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Back to dashboard
          </button>
        </div>
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
          if (errorData.reason === 'round-completed') {
            // User's round is already over — don't keep polling forever.
            // Stop and send them back to the dashboard where the correct
            // post-round state (missed / no-match / met) is shown.
            stopPolling();
            setIsLoading(false);
            setIsWaitingForMatch(false);
            navigate(`/p/${token}?from=match`);
            return 'no-match';
          }
          // 404 without a specific reason = matching hasn't run yet
          return 'not-ready';
        }
        const errorText = await response.text();
        throw new Error(`Failed to load match data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchInfo] Match data loaded:', data);
      setMatchData(data.matchData);
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
    return (
      <MatchInfoNoMatchView
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

  // Walking deadline expired and participant never checked in — show MissedRound
  if (isDeadlineExpired && matchData.status !== 'checked-in' && matchData.status !== 'met') {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <MissedRound
          participantToken={token!}
          roundId={matchData.roundId || ''}
          roundName={matchData.roundName}
          onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
        />
      </div>
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

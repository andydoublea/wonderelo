import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, ReactNode } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { WondereloHeader } from './WondereloHeader';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';
import { FlipClock } from './redesign/FlipClock';
import { cachedRoundNames } from './MatchInfo';

export interface NetworkingData {
  matchId: string;
  roundId?: string;
  roundName: string;
  /** Event name (organizer.event_name) — bold primary in the event row. */
  eventName?: string;
  /** Session name (session.name) — light subtitle in the event row. */
  sessionName?: string;
  /** Current participant's first name — shown in the nav. */
  myName?: string;
  networkingEndTime: string;
  partners: { id: string; firstName: string; lastName: string; }[];
  iceBreakers: any[];
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// ============================================================

export interface MatchNetworkingViewProps {
  networkingData: NetworkingData;
  countdown?: ReactNode;
  onBackToDashboard: () => void;
}

export function MatchNetworkingView({
  networkingData,
  countdown,
  onBackToDashboard,
}: MatchNetworkingViewProps) {
  const endSecs = networkingData.networkingEndTime
    ? Math.max(0, Math.floor((new Date(networkingData.networkingEndTime).getTime() - Date.now()) / 1000))
    : null;
  return (
    <div className="wonderelo pm-page" data-active="networking">
      <div className="pm-shell">
        <PdNav
          firstName={networkingData.myName || networkingData.partners?.[0]?.firstName}
          onBrandClick={onBackToDashboard}
          onDashboard={onBackToDashboard}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="networking">
          <div className="pm-band">
            <div className="pm-eventrow">
              <div className="pm-event"><span className="name">{networkingData.eventName || networkingData.sessionName || 'Your round'}</span><span className="org">{networkingData.sessionName || 'Speed networking'}</span></div>
              <span className="pm-state"><span className="dot" /> Live</span>
            </div>
            <div className="pm-focusbox" style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', color: '#fff' }}>Enjoy the talk!</h1>
              <div style={{ marginTop: 20 }}><span className="eyebrow">Round ends in</span></div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>{endSecs != null ? <FlipClock seconds={endSecs} /> : countdown}</div>
              {networkingData.iceBreakers && networkingData.iceBreakers.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginTop: 24 }}>Ice breakers you can begin with</div>
                  <div className="pm-ib" style={{ marginTop: 12 }}>
                    {networkingData.iceBreakers.map((ib, i) => (
                      <div className="pm-ib-item" key={i}><span className="n">{i + 1}.</span><span>{typeof ib === 'string' ? ib : (ib.question || ib.text)}</span></div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="pm-body"><div className="pm-center"><button className="pm-link" type="button" onClick={onBackToDashboard}>Back to dashboard</button></div></div>
        </div>
        <PmFooter onBrandClick={onBackToDashboard} />
      </div>
    </div>
  );
}

export function MatchNetworking() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [networkingData, setNetworkingData] = useState<NetworkingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    console.log('🔵 MatchNetworking component mounted, token:', token);
    loadNetworkingData();
  }, [token]);

  const loadNetworkingData = async () => {
    if (!token) {
      setError('Invalid participant token');
      setIsLoading(false);
      return;
    }

    try {
      debugLog('[MatchNetworking] Loading networking data');

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/networking`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        errorLog('[MatchNetworking] Server error:', errorText);
        throw new Error(`Failed to load networking data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchNetworking] Networking data loaded:', data);

      const names = cachedRoundNames(token, data?.roundId);
      setNetworkingData({
        ...data,
        eventName: data?.eventName || names.event,
        sessionName: data?.sessionName || names.session,
      });
      setIsLoading(false);
    } catch (err) {
      errorLog('[MatchNetworking] Error loading networking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load networking data');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading networking session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error || 'Failed to load networking data'}</p>
            <button
              onClick={() => navigate(`/p/${token}?from=match`)}
              className="text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MatchNetworkingView
      networkingData={networkingData}
      countdown={
        !isTimeUp ? (
          <CountdownTimer
            targetDate={networkingData.networkingEndTime}
            className="font-semibold text-primary text-6xl"
            onComplete={() => {
              debugLog('[MatchNetworking] Time is up!');
              setIsTimeUp(true);
              navigate(`/p/${token}/contact-sharing`);
            }}
          />
        ) : undefined
      }
      onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
    />
  );
}
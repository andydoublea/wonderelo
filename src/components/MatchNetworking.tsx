import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, ReactNode } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';
import { FlipClock } from './redesign/FlipClock';
import { cachedRoundNames } from './MatchInfo';
import { StatePlaceholder, Skeleton, Spinner, StateButton, RefreshIcon, Italic } from './redesign/StatePlaceholder';

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
              {/* Put-your-phone-away note (v07 design — sits on the dark focus panel) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 18, padding: '18px 16px', borderRadius: 16, background: 'rgba(255,255,255,.10)', border: '1px dashed rgba(255,255,255,.26)' }}>
                <span style={{ width: 38, height: 38, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.94)', border: '1px solid rgba(255,255,255,.3)', color: 'var(--w-orange)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><rect x="5" y="2" width="14" height="20" rx="2.5" /><line x1="10" y1="18.5" x2="14" y2="18.5" /><line x1="3" y1="22" x2="21" y2="2" /></svg>
                </span>
                <strong style={{ display: 'block', marginTop: 12, fontFamily: 'var(--w-font-display)', fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-.01em' }}>Put your phone away</strong>
                <span style={{ display: 'block', marginTop: 5, maxWidth: 300, fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,.74)' }}>A phone on the table kills the conversation. You'll get an SMS when the round ends.</span>
              </div>
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
    let mounted = true;
    loadNetworkingData();

    // Resumability: poll every 10s + refetch instantly on tab-visible.
    // Detects when round was completed elsewhere (or networking time ended
    // while the tab was in background) and navigates to the right screen.
    const interval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') loadNetworkingData();
    }, 10000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && mounted) {
        debugLog('[MatchNetworking] Tab visible — refetching');
        loadNetworkingData();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
        if (response.status === 404) {
          // Round no longer active — try to recover: probably completed
          // (round_completed_at set) or status changed. The dashboard will
          // route to the right place (contact-sharing if matched, etc).
          let body: any = null;
          try { body = await response.json(); } catch { /* ignore */ }
          if (body?.reason === 'round-completed' || body?.reason === 'no-active-round') {
            debugLog('[MatchNetworking] Round completed — navigating away');
            navigate(`/p/${token}/contact-sharing`);
            return;
          }
        }
        const errorText = await response.text();
        errorLog('[MatchNetworking] Server error:', errorText);
        throw new Error(`Failed to load networking data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchNetworking] Networking data loaded:', data);

      // Cross-device sync: if networking already ended (server time past
      // networkingEndTime), navigate to contact-sharing. Otherwise the
      // CountdownTimer will fire onComplete and do it.
      if (data.networkingEndTime && new Date(data.networkingEndTime).getTime() <= Date.now()) {
        debugLog('[MatchNetworking] networkingEndTime is past — going to contact-sharing');
        navigate(`/p/${token}/contact-sharing`);
        return;
      }

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

  const backToDashboard = () => navigate(`/p/${token}`);
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    loadNetworkingData();
  };

  // Loading state — skeleton in the shape of the networking timer band.
  if (isLoading) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="62%" height={26} />
            <Skeleton width="84%" height={12} />
            <Skeleton height={96} radius={18} />
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Spinner />
            <span style={{ fontFamily: 'var(--w-font-mono)', fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em', color: 'var(--w-ink)', opacity: 0.72 }}>Loading networking session…</span>
          </div>
          <div style={{ marginTop: 22, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
          </div>
        </div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell">
          <StatePlaceholder
            variant="error"
            glyphSize={74}
            glyph={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>}
            eyebrow="Connection lost"
            title={<>We can't reach <Italic>the round</Italic></>}
            body="Your round may still be running. Check your connection and try again."
            actions={<>
              <StateButton variant="primary" leadingIcon={<RefreshIcon />} onClick={handleRetry}>Try again</StateButton>
              <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
            </>}
            errorId="error · matchnetworking"
          />
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
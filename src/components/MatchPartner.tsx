import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { GeometricIdentification } from './GeometricIdentification';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';
import { FlipClock } from './redesign/FlipClock';
import { Geoid } from './redesign/Geoid';
import { cachedRoundNames } from './MatchInfo';
import { StatePlaceholder, Skeleton, SkeletonRow, Spinner, StateButton, RefreshIcon, Italic } from './redesign/StatePlaceholder';

export interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  isCheckedIn: boolean;
  identificationNumber: string;
  identificationOptions: number[];
  /** True when the current user has already confirmed this partner's number. */
  isNumberConfirmed?: boolean;
}

export interface MatchPartnerData {
  matchId: string;
  /** Event name (organizer.event_name) — bold primary in the event row. */
  eventName?: string;
  /** Session name (session.name) — light subtitle in the event row. */
  sessionName?: string;
  roundName?: string;
  myIdentificationNumber: string;
  myName: string;
  backgroundImageUrl?: string;
  partners: Partner[];
  walkingDeadline?: string;
  findingDeadline?: string;
  shouldStartNetworking?: boolean;
}

// ============================================================
// Pure view component (shared with AdminPagePreview)
// ============================================================

export interface MatchPartnerViewProps {
  matchData: MatchPartnerData;
  isSubmitting: boolean;
  wrongGuessPartnerId: string | null;
  getOptionsForPartner: (partner: Partner) => number[];
  onNumberSelect: (partnerId: string, num: number) => void;
  onBackToDashboard: () => void;
}

export function MatchPartnerView({
  matchData,
  isSubmitting,
  wrongGuessPartnerId,
  getOptionsForPartner,
  onNumberSelect,
  onBackToDashboard,
}: MatchPartnerViewProps) {
  const walkSecs = matchData.walkingDeadline
    ? Math.max(0, Math.floor((new Date(matchData.walkingDeadline).getTime() - Date.now()) / 1000))
    : null;
  return (
    <div className="wonderelo pm-page" data-active="find-each-other">
      <div className="pm-shell">
        <PdNav
          firstName={matchData.myName}
          onBrandClick={onBackToDashboard}
          onDashboard={onBackToDashboard}
          onHome={() => { if (typeof window !== 'undefined') window.location.href = '/'; }}
          onLogout={() => { if (typeof window !== 'undefined') { localStorage.removeItem('participant_token'); window.location.href = '/'; } }}
        />
        <div data-screen="find-each-other">
          <div className="pm-fe-grad">
            <div className="pm-band">
              <div className="pm-eventrow"><div className="pm-event"><span className="name">{matchData.eventName || matchData.sessionName || 'Your round'}</span><span className="org">{matchData.sessionName || 'Speed networking'}</span></div><span className="pm-state"><span className="dot" /> Live</span></div>
              <div className="pm-focusbox">
                <h1 className="pm-h1 pm-center" style={{ fontSize: 23, color: '#fff' }}>Show this to your <em style={{ color: '#ff8855' }}>match</em></h1>
                <div className="pm-idframe"><Geoid num={matchData.myIdentificationNumber} size="lg" /></div>
                <div className="pm-name-big pm-center" style={{ marginTop: 20, fontSize: 38, color: '#fff' }}>{matchData.myName}</div>
              </div>
            </div>
            <div className="pm-body pm-center">
              <h2 className="pm-fe-headline">Find others with your <em>color</em> and <em>shape</em></h2>
              <div className="pm-matchcard">
                {matchData.partners.map((partner) => {
                  const options = getOptionsForPartner(partner);
                  const isWrong = wrongGuessPartnerId === partner.id;
                  // Per-partner "Didn't make it" no-show state — covered by the v07 design.
                  const partnerMissed = !partner.isCheckedIn && !!matchData.walkingDeadline && Date.now() > new Date(matchData.walkingDeadline).getTime();
                  const state = partner.isNumberConfirmed ? 'done' : partner.isCheckedIn ? (isWrong ? 'wrong' : 'choosing') : (partnerMissed ? 'missed' : 'way');
                  return (
                    <div className={`pm-match${state === 'missed' ? ' pm-noshow' : ''}`} key={partner.id} data-state={state} style={state === 'missed' ? { background: 'rgba(138,107,98,.05)' } : undefined}>
                      <div className="pm-match-head">
                        <div className="pm-name-big" style={{ fontSize: 24, ...(state === 'missed' ? { opacity: .55 } : {}) }}>{partner.firstName}</div>
                        {state === 'done' ? (
                          <span className="pm-mstat is-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12" /></svg> Matched</span>
                        ) : state === 'choosing' || state === 'wrong' ? (
                          <span className="pm-mstat is-here"><span className="d" /> Already at the spot</span>
                        ) : state === 'missed' ? (
                          <span className="pm-mstat is-gone" style={{ color: '#8a6b62' }}><span className="d" style={{ background: 'rgba(138,107,98,.55)', boxShadow: '0 0 0 3px rgba(138,107,98,.14)' }} /> Didn't make it</span>
                        ) : (
                          <span className="pm-mstat is-way"><span className="d" /> On the way</span>
                        )}
                      </div>
                      {(state === 'choosing' || state === 'wrong') && (
                        <div className="pm-pickwrap">
                          {state === 'wrong' ? (
                            <div className="pm-pickerr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> That's not {partner.firstName}'s number. Try again:</div>
                          ) : (
                            <div style={{ fontSize: '12.5px', color: 'var(--w-ink)', opacity: .8, margin: '12px 0', textAlign: 'left' }}>Which number is <strong style={{ color: 'var(--w-purple-deep)', fontWeight: 600 }}>{partner.firstName}</strong>?</div>
                          )}
                          <div className="pm-pick">
                            {options.map((n) => (
                              <button type="button" key={n} onClick={() => onNumberSelect(partner.id, n)} disabled={isSubmitting} aria-label={`Select ${n}`}><Geoid num={n} size="sm" /></button>
                            ))}
                          </div>
                        </div>
                      )}
                      {state === 'way' && <p className="pm-muted" style={{ margin: '8px 0 2px', fontSize: '12.5px' }}>Hang tight — you'll pick their number once they arrive.</p>}
                      {state === 'missed' && (
                        <>
                          <p className="pm-muted" style={{ margin: '8px 0 0', fontSize: '12.5px' }}>They didn't make it to the meeting point in time, so we closed this pairing. It happens — nothing to do on your side.</p>
                          <div className="pm-noshow-foot" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(138,107,98,.28)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: '11.5px', color: 'rgba(43,24,16,.6)' }}>
                            <span>Your other matches are still open.</span>
                            <button type="button" className="pm-noshow-report" style={{ padding: '7px 12px', borderRadius: 999, border: '1.5px solid var(--w-hairline-strong)', background: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--w-purple-deep)', cursor: 'pointer' }}>Report a no-show</button>
                          </div>
                        </>
                      )}
                      {state === 'done' && <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}><span className="pm-muted" style={{ fontSize: 13 }}>You found each other — <strong style={{ color: 'var(--w-purple-deep)', fontWeight: 700 }}>good job!</strong></span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pm-body pm-center pm-fe-tail">
            {walkSecs != null && (
              <div className="pm-deadline"><span className="lbl">Walking deadline</span><FlipClock seconds={walkSecs} mini /><span className="note">then we'll start without them</span></div>
            )}
            <div><button className="pm-link" type="button" onClick={onBackToDashboard}>Back to dashboard</button></div>
          </div>
        </div>
        <PmFooter onBrandClick={onBackToDashboard} />
      </div>
    </div>
  );
}

export function MatchPartner() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchPartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wrongGuessPartnerId, setWrongGuessPartnerId] = useState<string | null>(null);

  // Track overridden options after wrong guess (keyed by partnerId)
  const overriddenOptionsRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    loadMatchPartnerData();

    // Poll for updates every 3 seconds to see if partners check in
    const interval = setInterval(loadMatchPartnerData, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const loadMatchPartnerData = async () => {
    if (!token) {
      setError('Invalid participant token');
      setIsLoading(false);
      return;
    }

    try {
      debugLog('[MatchPartner] Loading match partner data');

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/match-partner`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load match partner data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchPartner] Match partner data loaded:', data);

      const names = cachedRoundNames(token, data?.roundId);
      setMatchData({
        ...data,
        eventName: data?.eventName || names.event,
        sessionName: data?.sessionName || names.session,
      });
      setIsLoading(false);

      // Check if all partners have checked in or if networking time has started
      if (data.shouldStartNetworking) {
        debugLog('[MatchPartner] All partners checked in or time started, redirecting to networking');
        navigate(`/p/${token}/networking`);
      }
    } catch (err) {
      errorLog('[MatchPartner] Error loading match partner data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match partner data');
      setIsLoading(false);
    }
  };

  const handleNumberSelection = async (partnerId: string, selectedNumber: number) => {
    if (!token || !matchData || isSubmitting) return;

    setIsSubmitting(true);
    setWrongGuessPartnerId(null);
    try {
      debugLog('[MatchPartner] Confirming match with number:', selectedNumber);

      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/confirm-match`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: matchData.matchId,
            targetParticipantId: partnerId,
            selectedNumber,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to confirm match: ${errorText}`);
      }

      const result = await response.json();
      debugLog('[MatchPartner] Match confirmation result:', result);

      if (result.success) {
        // Clear any overridden options
        delete overriddenOptionsRef.current[partnerId];
        // Reload data — backend will set shouldStartNetworking=true and we'll redirect
        await loadMatchPartnerData();
      } else if (result.incorrect) {
        // Wrong number — partner got a new number, show new options
        debugLog('[MatchPartner] Wrong guess! New options:', result.newOptions);
        setWrongGuessPartnerId(partnerId);

        // Store the new options so they persist across polls
        if (result.newOptions) {
          overriddenOptionsRef.current[partnerId] = result.newOptions;
          // Update local state immediately
          setMatchData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              partners: prev.partners.map(p =>
                p.id === partnerId
                  ? { ...p, identificationOptions: result.newOptions }
                  : p
              ),
            };
          });
        }

        // Clear wrong guess indicator after 2 seconds
        setTimeout(() => setWrongGuessPartnerId(null), 2000);

        setIsSubmitting(false);
        setSelectedPartner(null);
        return;
      }

      setIsSubmitting(false);
      setSelectedPartner(null);
    } catch (err) {
      errorLog('[MatchPartner] Error confirming match:', err);
      alert('Failed to confirm match. Please try again.');
      setIsSubmitting(false);
      setSelectedPartner(null);
    }
  };

  // Get the effective options for a partner (overridden if wrong guess happened)
  const getOptionsForPartner = (partner: Partner): number[] => {
    return overriddenOptionsRef.current[partner.id] || partner.identificationOptions || [];
  };

  const backToDashboard = () => navigate(`/p/${token}`);
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    loadMatchPartnerData();
  };

  // Loading state — skeleton in the shape of the "find each other" identity card.
  if (isLoading) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="62%" height={26} />
            <Skeleton height={180} radius={18} />
            <SkeletonRow />
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Spinner />
            <span style={{ fontFamily: 'var(--w-font-mono)', fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em', color: 'var(--w-ink)', opacity: 0.72 }}>Loading your match…</span>
          </div>
          <div style={{ marginTop: 22, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="wonderelo pm-page">
        <div className="pm-shell">
          <StatePlaceholder
            variant="error"
            glyphSize={74}
            glyph={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
            eyebrow="Something went wrong"
            title={<>We couldn't load <Italic>your match</Italic></>}
            body="This is on us. Try again — your match and meeting point are still saved."
            actions={<>
              <StateButton variant="primary" leadingIcon={<RefreshIcon />} onClick={handleRetry}>Try again</StateButton>
              <StateButton variant="ghost" onClick={backToDashboard}>Back to dashboard</StateButton>
            </>}
            errorId="error · matchpartner"
          />
        </div>
      </div>
    );
  }

  return (
    <MatchPartnerView
      matchData={matchData}
      isSubmitting={isSubmitting}
      wrongGuessPartnerId={wrongGuessPartnerId}
      getOptionsForPartner={getOptionsForPartner}
      onNumberSelect={handleNumberSelection}
      onBackToDashboard={() => navigate(`/p/${token}`)}
    />
  );
}

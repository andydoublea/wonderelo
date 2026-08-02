import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { GeometricIdentification } from './GeometricIdentification';
import { WondereloHeader } from './WondereloHeader';
import { PdNav } from './redesign/PdNav';
import { PmFooter } from './redesign/PmFooter';
import { FlipClock } from './redesign/FlipClock';
import { Geoid } from './redesign/Geoid';
import { cachedRoundNames } from './MatchInfo';

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
                  // Per-partner "Didn't make it / missed" state is not in the v06 design — force off.
                  // Original logic preserved for when the design covers it:
                  // const partnerMissed = !partner.isCheckedIn && !!matchData.walkingDeadline && Date.now() > new Date(matchData.walkingDeadline).getTime();
                  const partnerMissed = false;
                  const state = partner.isNumberConfirmed ? 'done' : partner.isCheckedIn ? (isWrong ? 'wrong' : 'choosing') : (partnerMissed ? 'missed' : 'way');
                  return (
                    <div className="pm-match" key={partner.id} data-state={state}>
                      <div className="pm-match-head">
                        <div className="pm-name-big" style={{ fontSize: 24 }}>{partner.firstName}</div>
                        {state === 'done' ? (
                          <span className="pm-mstat is-done"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12" /></svg> Matched</span>
                        ) : state === 'choosing' || state === 'wrong' ? (
                          <span className="pm-mstat is-here"><span className="d" /> Already at the spot</span>
                        ) : state === 'missed' ? (
                          <span className="pm-mstat is-way"><span className="d" /> Didn't make it</span>
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
                      {state === 'missed' && <p className="pm-muted" style={{ margin: '8px 0 2px', fontSize: '12.5px' }}>They didn't make it to the meeting point in time.</p>}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading match details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-background">
        <WondereloHeader />
        <div className="flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error || 'Failed to load match partner data'}</p>
            <button
              onClick={() => navigate(`/p/${token}`)}
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

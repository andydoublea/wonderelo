import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { GeometricIdentification } from './GeometricIdentification';
import { WondereloHeader } from './WondereloHeader';

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
  /**
   * Rendered inline next to each "is on the way..." partner status.
   * Container passes a live countdown component; preview passes a static span.
   */
  inlineCountdown?: ReactNode;
}

export function MatchPartnerView({
  matchData,
  isSubmitting,
  wrongGuessPartnerId,
  getOptionsForPartner,
  onNumberSelect,
  onBackToDashboard,
  inlineCountdown,
}: MatchPartnerViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold mb-12">
          {matchData.findingDeadline ? 'Show this to your match!' : 'Now wait for the others'}
        </h1>

        {/* Own identification image (full-width, no box) */}
        <GeometricIdentification
          matchId={matchData.matchId}
          number={matchData.myIdentificationNumber}
          className="rounded-lg shadow-lg w-full block"
        />
        <div className="flex flex-col items-center justify-center mt-2">
          <h3
            className="font-bold text-foreground leading-tight break-words w-full text-center"
            style={{ fontSize: 'clamp(3rem, 13vw, 7rem)' }}
          >
            {matchData.myName}
          </h3>
        </div>

        {/* Spacer between own image/name and partner boxes */}
        <div style={{ height: '3rem' }} />

        {/* One combined box per partner: thumbnail + name + status + number picker */}
        {matchData.partners.map((partner) => {
          const options = getOptionsForPartner(partner);
          const isWrongGuess = wrongGuessPartnerId === partner.id;
          return (
            <fieldset
              key={partner.id}
              className={`mb-8 border-2 rounded-2xl px-4 sm:px-8 py-8 transition-colors ${
                isWrongGuess ? 'border-red-400 bg-red-50' : 'border-border'
              }`}
            >
              {/* Partner header: name — scaled so it 'sticks out' on any viewport */}
              <h3
                className="font-bold leading-none break-words text-center"
                style={{ fontSize: 'clamp(3.5rem, 16vw, 8rem)' }}
              >
                {partner.firstName}
              </h3>

              <p
                className={`mt-0 ${
                  partner.isCheckedIn ? 'text-green-600 font-medium' : 'text-muted-foreground'
                }`}
                style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)' }}
              >
                {partner.isCheckedIn ? (
                  `is already at the meeting point ✓`
                ) : (
                  <>
                    is on the way...
                    {inlineCountdown && <> ({inlineCountdown} left)</>}
                  </>
                )}
              </p>

              {/* Small horizontal divider between status and number prompt */}
              <hr
                className="border-t border-border mx-auto"
                style={{ width: '3rem', marginTop: '1rem', marginBottom: '1rem' }}
              />

              {partner.isNumberConfirmed ? (
                // Already confirmed — show locked state instead of number picker
                <div className="flex items-center justify-center gap-4 py-6 bg-green-50 border border-green-200 rounded-xl">
                  <GeometricIdentification
                    matchId={matchData.matchId}
                    number={partner.identificationNumber}
                    className="rounded-lg shadow w-20 h-20 flex-shrink-0"
                  />
                  <div className="text-left">
                    <p className="text-green-700 font-semibold text-lg">Number confirmed ✓</p>
                    <p className="text-sm text-green-600">You're good to go</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Prompt — match the 'is on the way...' size/weight */}
                  <p
                    className="text-muted-foreground mb-2"
                    style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)' }}
                  >
                    What's the number?
                  </p>
                  {isWrongGuess ? (
                    <p className="text-red-600 font-medium mb-6">
                      Wrong number! Your partner got a new number — look again!
                    </p>
                  ) : (
                    <div className="mb-6" />
                  )}

                  {/* Candidate numbers — always in one row of 3 */}
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto">
                    {options.map((num) => (
                      <button
                        key={num}
                        onClick={() => onNumberSelect(partner.id, num)}
                        disabled={isSubmitting}
                        className="rounded-lg overflow-hidden shadow-md hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed aspect-square"
                        aria-label={`Select ${num}`}
                      >
                        <GeometricIdentification
                          matchId={matchData.matchId}
                          number={num}
                          className="block w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </fieldset>
          );
        })}

        <div>
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
    let mounted = true;
    loadMatchPartnerData();

    // Poll for updates every 3 seconds to see if partners check in
    const interval = setInterval(() => {
      if (mounted && document.visibilityState === 'visible') loadMatchPartnerData();
    }, 3000);

    // Resumability: refetch instantly when the tab becomes visible (e.g. user
    // switched from another device and came back).
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && mounted) {
        debugLog('[MatchPartner] Tab visible — refetching');
        loadMatchPartnerData();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
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
        if (response.status === 404) {
          let body: any = null;
          try { body = await response.json(); } catch { /* ignore */ }
          if (body?.reason === 'round-completed') {
            debugLog('[MatchPartner] Round already completed — going to dashboard');
            navigate(`/p/${token}?from=match`);
            return;
          }
        }
        const errorText = await response.text();
        throw new Error(`Failed to load match partner data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchPartner] Match partner data loaded:', data);

      setMatchData(data);
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
    <MatchPartnerView
      matchData={matchData}
      inlineCountdown={
        matchData.findingDeadline ? (
          <CountdownTimer
            targetDate={matchData.findingDeadline}
            className=""
            onComplete={() => {
              debugLog('[MatchPartner] Finding time expired');
            }}
          />
        ) : undefined
      }
      isSubmitting={isSubmitting}
      wrongGuessPartnerId={wrongGuessPartnerId}
      getOptionsForPartner={getOptionsForPartner}
      onNumberSelect={handleNumberSelection}
      onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
    />
  );
}

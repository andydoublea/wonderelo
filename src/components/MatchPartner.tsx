import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { GeometricIdentification } from './GeometricIdentification';

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  isCheckedIn: boolean;
  identificationNumber: string;
  identificationOptions: number[];
}

interface MatchPartnerData {
  matchId: string;
  myIdentificationNumber: string;
  myName: string;
  backgroundImageUrl?: string;
  partners: Partner[];
  walkingDeadline?: string;
  findingDeadline?: string;
  shouldStartNetworking?: boolean;
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Countdown Timer — only show during finding phase */}
        {matchData.findingDeadline && (
          <div className="mb-8">
            <CountdownTimer
              targetDate={matchData.findingDeadline}
              variant="large"
              onComplete={() => {
                debugLog('[MatchPartner] Finding time expired');
              }}
            />
          </div>
        )}

        {/* Headline — changes based on phase */}
        <h1 className="text-4xl font-bold mb-12">
          {matchData.findingDeadline
            ? 'Now, find each other!'
            : 'Now wait for the others'}
        </h1>

        {/* Identification image with number */}
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-6">
          <legend className="px-3 text-xl text-muted-foreground">
            Show this so {matchData.partners.length === 1
              ? `${matchData.partners[0].firstName} can find you`
              : 'they can find you'}
          </legend>
          <div className="relative inline-block">
            <GeometricIdentification
              matchId={matchData.matchId}
              className="rounded-lg shadow-lg max-w-md w-full"
            />
            {/* Name and number overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <h3 className="text-6xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {matchData.myName}
              </h3>
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-foreground">
                  {matchData.myIdentificationNumber}
                </span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Partner names */}
        <fieldset className="mb-12 border-2 border-border rounded-2xl px-8 py-10">
          <legend className="px-3 text-xl text-muted-foreground">
            Look for
          </legend>
          <div className="space-y-4">
            {matchData.partners.map((partner) => (
              <div key={partner.id} className="text-center">
                <h2 className="text-4xl font-bold">{partner.firstName}</h2>
                <p className={`text-lg mt-1 ${partner.isCheckedIn ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {partner.isCheckedIn ? 'Already at the meeting point ✓' : 'On the way...'}
                </p>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Number confirmation sections — one for each partner */}
        {matchData.partners.map((partner) => {
          const options = getOptionsForPartner(partner);
          const isWrongGuess = wrongGuessPartnerId === partner.id;

          return (
            <fieldset key={partner.id} className={`mb-12 border-2 rounded-2xl px-8 py-10 transition-colors ${isWrongGuess ? 'border-red-400 bg-red-50' : 'border-border'}`}>
              <legend className="px-3 text-xl text-muted-foreground">
                To confirm meeting select
              </legend>
              <h2 className="text-3xl font-bold mb-2">
                {partner.firstName}'s number
              </h2>
              {isWrongGuess && (
                <p className="text-red-600 font-medium mb-6">
                  Wrong number! Your partner got a new number — look again!
                </p>
              )}
              {!isWrongGuess && <div className="mb-8" />}
              <div className="flex items-center justify-center gap-6">
                {options.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberSelection(partner.id, num)}
                    disabled={isSubmitting}
                    className="w-24 h-24 rounded-full border-2 border-border bg-background hover:bg-accent hover:border-foreground transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-4xl font-bold">{num}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          );
        })}

        {/* Back to dashboard link */}
        <div>
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

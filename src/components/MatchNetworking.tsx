import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, ReactNode } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { WondereloHeader } from './WondereloHeader';

export interface NetworkingData {
  matchId: string;
  roundId?: string;
  roundName: string;
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
  return (
    <div className="min-h-screen bg-background">
      <WondereloHeader />
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl font-bold mb-8">
          Your round has begun!
        </h1>

        {countdown && <div className="mb-8">{countdown}</div>}

        {networkingData.iceBreakers && networkingData.iceBreakers.length > 0 && (
          <div className="mt-12">
            <p className="text-lg text-muted-foreground mb-6">Questions to help you start:</p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              {networkingData.iceBreakers.map((iceBreaker, index) => (
                <div key={index} className="flex gap-3 p-4 border rounded-lg">
                  <span className="text-primary font-semibold shrink-0">{index + 1}.</span>
                  <span>{typeof iceBreaker === 'string' ? iceBreaker : iceBreaker.question}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
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

      setNetworkingData(data);
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
              // Fire-and-forget: trigger server-side round-ended SMS at the
              // exact moment "Time is up" appears. Per-reg dedup prevents
              // duplicates if the cron fallback also fires this round.
              if (networkingData.roundId && token) {
                fetch(`${apiBaseUrl}/rounds/${networkingData.roundId}/notify-ended`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ token }),
                }).catch((e) => errorLog('[MatchNetworking] notify-ended failed', e));
              }
              navigate(`/p/${token}/contact-sharing`);
            }}
          />
        ) : undefined
      }
      onBackToDashboard={() => navigate(`/p/${token}?from=match`)}
    />
  );
}
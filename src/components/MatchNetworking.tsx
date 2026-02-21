import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';

interface NetworkingData {
  matchId: string;
  roundName: string;
  networkingEndTime: string;
  partners: { id: string; firstName: string; lastName: string; }[];
  iceBreakers: string[];
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
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/networking`,
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading networking session...</p>
        </div>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Countdown Timer */}
        {!isTimeUp && (
          <div className="mb-8">
            <CountdownTimer
              targetDate={networkingData.networkingEndTime}
              variant="large"
              onComplete={() => {
                debugLog('[MatchNetworking] Time is up!');
                setIsTimeUp(true);
                // Navigate to contact sharing page
                navigate(`/p/${token}/contact-sharing`);
              }}
            />
          </div>
        )}

        {/* Headline */}
        <h1 className="text-4xl font-bold mb-4">
          Skip the weather talk and jump into deep topics!
        </h1>

        {/* Ice Breakers */}
        {networkingData.iceBreakers && networkingData.iceBreakers.length > 0 && (
          <div className="mt-12">
            <p className="text-lg text-muted-foreground mb-6">Take them or leave them</p>
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

        {/* Back to dashboard link */}
        <div className="mt-12">
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
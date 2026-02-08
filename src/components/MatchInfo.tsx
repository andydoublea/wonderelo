import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { MapPin, Clock } from 'lucide-react';

interface MatchData {
  matchId: string;
  meetingPointName: string;
  meetingPointImageUrl?: string;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
  roundStartTime?: string;
  walkingDeadline?: string;
  networkingEndTime?: string;
}

export function MatchInfo() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMatchData();
  }, [token]);

  const loadMatchData = async () => {
    if (!token) {
      setError('Invalid participant token');
      setIsLoading(false);
      return;
    }

    try {
      debugLog('[MatchInfo] Loading match data for token:', token);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/match`,
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
            return;
          }
        }
        
        const errorText = await response.text();
        throw new Error(`Failed to load match data: ${errorText}`);
      }

      const data = await response.json();
      debugLog('[MatchInfo] Match data loaded:', data);

      setMatchData(data.matchData);
      setIsLoading(false);
    } catch (err) {
      errorLog('[MatchInfo] Error loading match data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load match data');
      setIsLoading(false);
    }
  };

  const handleImHere = async () => {
    if (!token || !matchData) return;

    setIsSubmitting(true);
    try {
      debugLog('[MatchInfo] Checking in at meeting point');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/check-in`,
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
      alert('Check-in failed, but you can still proceed');
      navigate(`/p/${token}/match-partner`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your match...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === 'no-match') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold mb-2">No match found</h2>
            <p className="text-muted-foreground mb-6">
              No one else registered for this round.
            </p>
            <Button onClick={() => navigate(`/p/${token}`)}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error || 'Failed to load match data'}</p>
            <Button onClick={() => navigate(`/p/${token}`)}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {/* Countdown Timer */}
          {matchData.walkingDeadline && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Time to arrive at meeting point</span>
              </div>
              <CountdownTimer
                targetDate={matchData.walkingDeadline}
                variant="large"
                onComplete={() => {
                  debugLog('[MatchInfo] Walking deadline reached');
                }}
              />
            </div>
          )}

          {/* Match Announcement */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold mb-2">We have a match for you!</h1>
            <p className="text-muted-foreground">
              You'll meet with {matchData.participants.length - 1} {matchData.participants.length === 2 ? 'person' : 'people'}
            </p>
          </div>

          {/* Meeting Point */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Now go to
            </h2>
            
            {matchData.meetingPointImageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={matchData.meetingPointImageUrl}
                  alt={matchData.meetingPointName}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}
            
            <p className="text-2xl font-bold text-center mb-2">{matchData.meetingPointName}</p>
            <p className="text-sm text-muted-foreground text-center">
              Head to this location to meet your networking partner{matchData.participants.length > 2 ? 's' : ''}
            </p>
          </div>

          {/* Check-in Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleImHere}
            disabled={isSubmitting}
          >
            <MapPin className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Checking in...' : 'I am here'}
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Click when you arrive at the meeting point
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
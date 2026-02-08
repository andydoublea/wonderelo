import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CheckCircle2, Circle } from 'lucide-react';

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  isCheckedIn: boolean;
  identificationNumber: string;
}

interface MatchPartnerData {
  matchId: string;
  myIdentificationNumber: string;
  myName: string;
  backgroundImageUrl?: string;
  partners: Partner[];
  availableNumbers: number[];
}

export function MatchPartner() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [matchData, setMatchData] = useState<MatchPartnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/match-partner`,
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
      // If yes, redirect to networking page
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
    try {
      debugLog('[MatchPartner] Confirming match with number:', selectedNumber);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/confirm-match`,
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
        // Show success message
        alert('Match confirmed! ✅');
        // Reload data to update UI
        await loadMatchPartnerData();
      } else if (result.incorrect) {
        alert('Incorrect number. Please try again.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading match details...</p>
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
            <p className="text-muted-foreground mb-6">{error || 'Failed to load match partner data'}</p>
            <Button onClick={() => navigate(`/p/${token}`)}>
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* My Identification Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Have this image visible</h2>
            
            <div 
              className="relative rounded-xl overflow-hidden mb-4 aspect-square max-w-sm mx-auto"
              style={{
                backgroundImage: matchData.backgroundImageUrl 
                  ? `url(${matchData.backgroundImageUrl})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="text-8xl font-bold mb-4">{matchData.myIdentificationNumber}</div>
                <div className="text-2xl font-semibold">{matchData.myName}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Show this to your networking partner{matchData.partners.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Partners List */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-6">Look for</h2>
            
            <div className="space-y-6">
              {matchData.partners.map((partner) => (
                <div key={partner.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {partner.firstName} {partner.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {partner.isCheckedIn ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">At meeting point</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Not yet arrived</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Number Selection */}
                  {selectedPartner === partner.id ? (
                    <div>
                      <p className="text-sm mb-3 font-medium">Select the number they're showing:</p>
                      <div className="flex gap-3 justify-center">
                        {matchData.availableNumbers.map((num) => (
                          <button
                            key={num}
                            onClick={() => handleNumberSelection(partner.id, num)}
                            disabled={isSubmitting}
                            className="w-16 h-16 rounded-full border-2 border-primary bg-background hover:bg-primary hover:text-primary-foreground font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPartner(null)}
                        className="w-full mt-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedPartner(partner.id)}
                    >
                      Confirm you met
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate(`/p/${token}`)}
              >
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

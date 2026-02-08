import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CountdownTimer } from './CountdownTimer';
import { Check, X, Clock, Users } from 'lucide-react';

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface NetworkingData {
  matchId: string;
  roundName: string;
  networkingEndTime: string;
  partners: Partner[];
  iceBreakers: string[];
  myContactSharing: Record<string, boolean>; // partnerId -> wants to share
}

export function MatchNetworking() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [networkingData, setNetworkingData] = useState<NetworkingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [contactSharing, setContactSharing] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      // Initialize contact sharing preferences
      const initialSharing: Record<string, boolean> = {};
      data.partners.forEach((partner: Partner) => {
        initialSharing[partner.id] = data.myContactSharing?.[partner.id] ?? false;
      });
      setContactSharing(initialSharing);
      
      setIsLoading(false);
    } catch (err) {
      errorLog('[MatchNetworking] Error loading networking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load networking data');
      setIsLoading(false);
    }
  };

  const handleContactSharingToggle = (partnerId: string) => {
    setContactSharing(prev => ({
      ...prev,
      [partnerId]: !prev[partnerId]
    }));
  };

  const handleSaveContactPreferences = async () => {
    if (!token || !networkingData) return;

    setIsSubmitting(true);
    try {
      debugLog('[MatchNetworking] Saving contact sharing preferences:', contactSharing);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/${token}/contact-sharing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: networkingData.matchId,
            preferences: contactSharing,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save preferences: ${errorText}`);
      }

      debugLog('[MatchNetworking] Contact preferences saved successfully');
      
      // Navigate back to dashboard
      navigate(`/p/${token}`);
      
    } catch (err) {
      errorLog('[MatchNetworking] Error saving contact preferences:', err);
      alert('Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading networking session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !networkingData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error || 'Failed to load networking data'}</p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Countdown Timer */}
        {!isTimeUp && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Networking time remaining</span>
              </div>
              <CountdownTimer
                targetDate={networkingData.networkingEndTime}
                variant="large"
                onComplete={() => {
                  debugLog('[MatchNetworking] Time is up!');
                  setIsTimeUp(true);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Time is Up Banner */}
        {isTimeUp && (
          <Card className="border-2 border-primary">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h1 className="text-4xl font-bold mb-2">Time is up!</h1>
              <p className="text-muted-foreground">
                Great networking session! Now you can exchange contacts.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ice Breakers */}
        {networkingData.iceBreakers && networkingData.iceBreakers.length > 0 && !isTimeUp && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ice breakers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {networkingData.iceBreakers.map((iceBreaker, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-primary font-semibold shrink-0">{index + 1}.</span>
                    <span>{typeof iceBreaker === 'string' ? iceBreaker : iceBreaker.question}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Contact Sharing */}
        {isTimeUp && (
          <Card>
            <CardHeader>
              <CardTitle>Share your contact information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Choose who you'd like to exchange contact information with. 
                <strong className="block mt-1">
                  Contacts will only be shared if both parties agree.
                </strong>
              </p>

              <div className="space-y-4">
                {networkingData.partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        {partner.firstName} {partner.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={contactSharing[partner.id] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleContactSharingToggle(partner.id)}
                      >
                        {contactSharing[partner.id] ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Share
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Don't share
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSaveContactPreferences}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save preferences'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/p/${token}`)}
                >
                  Back to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Early Exit Option */}
        {!isTimeUp && (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate(`/p/${token}`)}
            >
              Back to dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
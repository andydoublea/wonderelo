import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ParticipantLayout } from './ParticipantLayout';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Calendar, Clock, MapPin, ArrowLeft, Bell, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';

interface RoundDetail {
  registration: any;
  session: {
    id: string;
    name: string;
    date: string;
    location?: string;
    meetingPoints?: any[];
  };
  round: {
    id: string;
    name: string;
    startTime: string;
    duration: number;
    groupSize: number;
    iceBreakers?: string[];
  };
  organizer: {
    name: string;
    urlSlug: string;
  };
}

export function ParticipantRoundDetail() {
  const { token, roundId } = useParams<{ token: string; roundId: string }>();
  const navigate = useNavigate();
  
  // Initialize from cached data for instant display
  const getCachedRoundDetail = () => {
    try {
      const cached = localStorage.getItem(`participant_round_${token}_${roundId}`);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          roundDetail: data,
          hasCache: true
        };
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return {
      roundDetail: null,
      hasCache: false
    };
  };
  
  const cachedData = getCachedRoundDetail();
  
  const [roundDetail, setRoundDetail] = useState<RoundDetail | null>(cachedData.roundDetail);
  const [isLoading, setIsLoading] = useState(!cachedData.hasCache);
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);

  // Version identifier for debugging
  useEffect(() => {
    debugLog('🎯 ParticipantRoundDetail v2.0 (with ParticipantLayout) loaded - Build time: 2024-11-03 14:30');
  }, []);

  useEffect(() => {
    if (token && roundId) {
      fetchRoundDetail();
    }
  }, [token, roundId]);

  // Countdown timer
  useEffect(() => {
    if (!roundDetail) return;

    const interval = setInterval(() => {
      const now = new Date();
      const roundDate = roundDetail.round.date || roundDetail.session.date; // Use round.date, fallback to session.date for backwards compatibility
      const roundStart = new Date(`${roundDate}T${roundDetail.round.startTime}:00`);
      const diff = roundStart.getTime() - now.getTime();
      
      setTimeUntilStart(Math.max(0, diff));
    }, 1000);

    return () => clearInterval(interval);
  }, [roundDetail]);

  const fetchRoundDetail = async () => {
    try {
      const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
      
      debugLog('[ParticipantRoundDetail] Fetching round detail for token:', token, 'roundId:', roundId);
      
      const response = await fetch(
        `${apiBaseUrl}/p/${token}/r/${roundId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      debugLog('[ParticipantRoundDetail] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        errorLog('[ParticipantRoundDetail] Error response:', errorText);
        throw new Error(`Failed to fetch round detail: ${response.status}`);
      }

      const data = await response.json();
      debugLog('[ParticipantRoundDetail] Round detail data:', data);
      setRoundDetail(data);
      
      // Cache the data
      localStorage.setItem(`participant_round_${token}_${roundId}`, JSON.stringify(data));
      
    } catch (error) {
      errorLog('[ParticipantRoundDetail] Error fetching round detail:', error);
      toast.error(`Failed to load round details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return 'Starting now!';

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dt = new Date(`${date}T${time}:00`);
      return dt.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return `${date} at ${time}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!roundDetail) {
    return (
      <ParticipantLayout
        title="Round not found"
      >
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Round not found</p>
          <Button onClick={() => navigate(`/p/${token}`)}>
            Go to dashboard
          </Button>
        </div>
      </ParticipantLayout>
    );
  }

  const { registration, session, round, organizer } = roundDetail;
  const roundDate = round.date || session.date; // Use round.date, fallback to session.date for backwards compatibility
  const roundStart = new Date(`${roundDate}T${round.startTime}:00`);
  const roundEnd = new Date(roundStart.getTime() + round.duration * 60000);
  const now = new Date();
  
  const isUpcoming = now < roundStart;
  const isInProgress = now >= roundStart && now < roundEnd;
  const isCompleted = now >= roundEnd;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-2xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/p/${token}`)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Button>

        {/* Main Card using ParticipantLayout styling */}
        <Card>
          {/* Header with icon and badges */}
          <div className="text-center pt-6 px-6">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              {isCompleted && <Badge variant="secondary">Completed</Badge>}
              {isInProgress && <Badge className="bg-green-500">In progress</Badge>}
              {isUpcoming && <Badge>Upcoming</Badge>}
            </div>
            <h1 className="text-2xl mb-2">{round.name}</h1>
            <p className="text-sm text-muted-foreground mb-6">{session.name}</p>
          </div>
          
          <div className="px-6 pb-6 space-y-6">
            {/* Countdown */}
            {isUpcoming && (
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Starts in</p>
                <p className="text-3xl font-mono">{formatCountdown(timeUntilStart)}</p>
              </div>
            )}

            {isInProgress && (
              <div className="text-center p-6 bg-green-500/10 rounded-lg">
                <p className="text-lg">Round is in progress!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Enjoy your networking session
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Date and time</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(session.date, round.startTime)}</span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium">Duration</h3>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{round.duration} minutes</span>
                </div>
              </div>

              {session.location && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Location</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{session.location}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-medium">Group size</h3>
                <p className="text-sm text-muted-foreground">
                  Groups of {round.groupSize} participants
                </p>
              </div>

              {round.iceBreakers && round.iceBreakers.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Ice breakers</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {round.iceBreakers.slice(0, 3).map((iceBreaker, index) => (
                      <li key={index}>• {iceBreaker}</li>
                    ))}
                  </ul>
                </div>
              )}

              {session.meetingPoints && session.meetingPoints.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Meeting points</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {session.meetingPoints.map((point, index) => (
                      <li key={index}>• {point.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-medium">Organizer</h3>
                <p className="text-sm text-muted-foreground">{organizer.name}</p>
              </div>
            </div>

            {/* Notification Reminder */}
            {isUpcoming && !registration.notificationsEnabled && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm mb-2">Don't miss your round!</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enable browser notifications to get reminded when it's time to confirm your attendance.
                    </p>
                    <Button 
                      size="sm"
                      onClick={async () => {
                        if (!('Notification' in window)) {
                          toast.error('Your browser does not support notifications');
                          return;
                        }

                        try {
                          const permission = await Notification.requestPermission();
                          
                          if (permission === 'granted') {
                            // Update preference on backend
                            const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
                            
                            await fetch(
                              `${apiBaseUrl}/p/${token}/notification-preference`,
                              {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${publicAnonKey}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  enabled: true,
                                  roundId
                                })
                              }
                            );
                            
                            toast.success('Notifications enabled!');
                            
                            // Refresh data
                            fetchRoundDetail();
                          } else {
                            toast.error('Notification permission denied');
                          }
                        } catch (error) {
                          errorLog('Error enabling notifications:', error);
                          toast.error('Failed to enable notifications');
                        }
                      }}
                    >
                      Enable notifications
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
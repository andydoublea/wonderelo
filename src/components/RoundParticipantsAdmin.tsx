import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { ArrowLeft, UserCheck, Users, CheckCircle2, XCircle, Loader2, RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { ParticipantStatusBadge } from '../utils/statusBadge';

// Helper function for anonymization
function anonymizeParticipant(data: { name: string; email: string; phone?: string }, id: string) {
  const anonymizedEmail = data.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  const anonymizedPhone = data.phone?.replace(/(\d{3})(\d*)(\d{3})/, '$1***$3') || '';
  return {
    displayName: data.name,
    anonymizedEmail,
    anonymizedPhone,
  };
}

interface Participant {
  id: string;
  roundId: string;
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: string;
  status: 'registered' | 'confirmed' | 'matched' | 'checked-in' | 'no-show' | 'excluded' | 'unconfirmed';
  teamId?: string;
  topicIds?: string[];
  confirmationSentAt?: string;
}

interface Match {
  id: string;
  roundId: string;
  sessionId: string;
  participantIds: string[];
  meetingPointId: string;
  identificationImageUrl: string;
  status: 'pending' | 'active' | 'completed' | 'no-show-reported';
  checkIns: any[];
  createdAt: string;
}

interface RoundParticipantsAdminProps {
  roundId: string;
  sessionId: string;
  roundName: string;
  accessToken: string;
}

export function RoundParticipantsAdmin({
  roundId,
  sessionId,
  roundName,
  accessToken
}: RoundParticipantsAdminProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const { apiBaseUrl } = await import('../utils/supabase/info');
      
      // Load participants
      const participantsResponse = await fetch(
        `${apiBaseUrl}/rounds/${roundId}/participants?sessionId=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData.participants || []);
      }

      // Load matches
      const matchesResponse = await fetch(
        `${apiBaseUrl}/rounds/${roundId}/matches`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches || []);
      }
    } catch (error) {
      errorLog('Error loading round data:', error);
      toast.error('Failed to load round data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roundId, accessToken]);

  const stats = {
    total: participants.length,
    confirmed: participants.filter(p => p.status === 'confirmed').length,
    matched: participants.filter(p => p.status === 'matched').length,
    checkedIn: participants.filter(p => p.status === 'checked-in').length,
    noShow: participants.filter(p => p.status === 'no-show').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-2">Participants and matches</h3>
          <p className="text-sm text-muted-foreground">{roundName}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl">{stats.confirmed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matched</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span className="text-2xl">{stats.matched}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checked in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl">{stats.checkedIn}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No-show</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl">{stats.noShow}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>
            All registered participants for this round
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No participants registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => {
                const anonymized = anonymizeParticipant(
                  { 
                    name: participant.name, 
                    email: participant.email, 
                    phone: participant.phone 
                  },
                  participant.id
                );

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p>{anonymized.displayName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{anonymized.anonymizedEmail}</span>
                        {participant.phone && (
                          <span>{anonymized.anonymizedPhone}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(participant.registeredAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <ParticipantStatusBadge status={participant.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>
              Groups created for this round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match, index) => {
                const matchParticipants = participants.filter(p => 
                  match.participantIds.includes(p.id)
                );

                return (
                  <div
                    key={match.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm">Group {index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {match.participantIds.length} participants
                          </p>
                        </div>
                      </div>
                      <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
                        {match.status}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Meeting point</span>
                        </div>
                        <p className="text-sm">{match.meetingPointId}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Check-ins</span>
                        </div>
                        <p className="text-sm">
                          {match.checkIns.length} / {match.participantIds.length}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Participants</p>
                      <div className="space-y-1">
                        {matchParticipants.map(participant => {
                          const anonymized = anonymizeParticipant(
                            { 
                              name: participant.name, 
                              email: participant.email, 
                              phone: participant.phone 
                            },
                            participant.id
                          );
                          const isCheckedIn = match.checkIns.some(
                            ci => ci.participantId === participant.id
                          );

                          return (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between text-sm p-2 rounded bg-muted/30"
                            >
                              <span>{anonymized.displayName}</span>
                              {isCheckedIn && (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
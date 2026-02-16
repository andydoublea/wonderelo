import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Users, MapPin, Check, X, Clock, UserCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';

interface RoundParticipant {
  id: string;
  participantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  registeredAt: string;
  confirmedAt?: string;
  matchId?: string;
  matchPartnerIds?: string[];
  matchPartnerNames?: string[];
  meetingPointId?: string;
  meetingPointName?: string;
  selectedTeam?: string;
  selectedTopic?: string;
}

interface RoundParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionName: string;
  roundId: string;
  roundName: string;
  accessToken: string;
}

export function RoundParticipantsDialog({
  open,
  onClose,
  sessionId,
  sessionName,
  roundId,
  roundName,
  accessToken
}: RoundParticipantsDialogProps) {
  const [participants, setParticipants] = useState<RoundParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchParticipants();
    }
  }, [open, sessionId, roundId]);

  const fetchParticipants = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/sessions/${sessionId}/rounds/${roundId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setParticipants(result.participants || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch participants');
        toast.error(errorData.error || 'Failed to fetch participants');
      }
    } catch (err) {
      errorLog('Error fetching round participants:', err);
      setError('Network error while fetching participants');
      toast.error('Network error while fetching participants');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      'registered': { variant: 'secondary', label: 'Registered', icon: Clock },
      'confirmed': { variant: 'default', label: 'Confirmed', icon: Check },
      'unconfirmed': { variant: 'destructive', label: 'Unconfirmed', icon: X },
      'matched': { variant: 'default', label: 'Matched', icon: Users },
      'walking-to-meeting-point': { variant: 'default', label: 'Walking', icon: MapPin },
      'waiting-for-meet-confirmation': { variant: 'secondary', label: 'Waiting', icon: Clock },
      'checked-in': { variant: 'default', label: 'Checked in', icon: UserCheck },
      'met': { variant: 'default', label: 'Met', icon: Check },
      'completed': { variant: 'outline', label: 'Completed', icon: Check },
    };

    const config = variants[status] || { variant: 'outline' as const, label: status, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Group participants by matches
  const groupedByMatch = participants.reduce((acc, p) => {
    if (p.matchId) {
      if (!acc[p.matchId]) {
        acc[p.matchId] = [];
      }
      acc[p.matchId].push(p);
    } else {
      if (!acc['no-match']) {
        acc['no-match'] = [];
      }
      acc['no-match'].push(p);
    }
    return acc;
  }, {} as Record<string, RoundParticipant[]>);

  const confirmedCount = participants.filter(p => p.status === 'confirmed' || p.status === 'matched' || p.status === 'checked-in' || p.status === 'met').length;
  const matchedCount = participants.filter(p => p.matchId).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants for {roundName}
          </DialogTitle>
          <DialogDescription>
            {sessionName} - {participants.length} participant{participants.length !== 1 ? 's' : ''}
            {participants.length > 0 && (
              <span className="ml-2">
                • {confirmedCount} confirmed • {matchedCount} matched
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refresh button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchParticipants}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive">Error loading participants</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && participants.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && participants.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No participants registered for this round yet</p>
            </div>
          )}

          {/* Participants table */}
          {participants.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Meeting point</TableHead>
                    <TableHead>Team/Topic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {participant.firstName} {participant.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {participant.participantId.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{participant.email}</div>
                          {participant.phone && (
                            <div className="text-xs text-muted-foreground">{participant.phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(participant.status)}
                      </TableCell>
                      <TableCell>
                        {participant.matchId ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Match ID: {participant.matchId.substring(0, 8)}...
                            </div>
                            {participant.matchPartnerNames && participant.matchPartnerNames.length > 0 && (
                              <div className="text-sm font-medium">
                                {participant.matchPartnerNames.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No match</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {participant.meetingPointName ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {participant.meetingPointName}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {participant.selectedTeam && (
                            <Badge variant="outline" className="text-xs">
                              Team: {participant.selectedTeam}
                            </Badge>
                          )}
                          {participant.selectedTopic && (
                            <Badge variant="outline" className="text-xs">
                              Topic: {participant.selectedTopic}
                            </Badge>
                          )}
                          {!participant.selectedTeam && !participant.selectedTopic && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Match groups summary */}
          {participants.length > 0 && Object.keys(groupedByMatch).length > 1 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Match groups ({Object.keys(groupedByMatch).filter(k => k !== 'no-match').length})
              </h4>
              <div className="space-y-2">
                {Object.entries(groupedByMatch).map(([matchId, matchParticipants]) => {
                  if (matchId === 'no-match') return null;
                  
                  return (
                    <div key={matchId} className="text-sm flex items-start gap-2 p-2 bg-background rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-xs text-muted-foreground mb-1">
                          Match {matchId.substring(0, 8)}...
                        </div>
                        <div>
                          {matchParticipants.map(p => `${p.firstName} ${p.lastName}`).join(' + ')}
                        </div>
                        {matchParticipants[0]?.meetingPointName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {matchParticipants[0].meetingPointName}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {matchParticipants.length} people
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

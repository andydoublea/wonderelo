import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, Search, ChevronDown, ChevronRight, ExternalLink, Users, Calendar, Clock, Loader2 } from 'lucide-react';
import { OrganizerStatusBadge } from '../utils/statusBadge';
import { useAdminSessions } from '../hooks/useAdminQueries';

interface SessionListItem {
  sessionId: string;
  sessionName: string;
  status: string;
  date: string;
  endTime?: string;
  registrationStart?: string;
  rounds: any[];
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  organizerUrlSlug: string;
}

interface AdminSessionsProps {
  onBack: () => void;
  onNavigateToOrganizer?: (organizerId: string) => void;
  onNavigateToParticipants?: () => void;
}

export function AdminSessions({ onBack, onNavigateToOrganizer, onNavigateToParticipants }: AdminSessionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // React Query hook for sessions (gets token automatically)
  const { data: sessions = [], isLoading: loading, error: queryError, isFetching: isRefetching } = useAdminSessions();
  const error = queryError?.message || null;

  // Auto-expand session from sessionStorage
  useEffect(() => {
    const targetSessionId = sessionStorage.getItem('admin_sessions_filter');

    if (targetSessionId && sessions.length > 0) {
      const targetSession = sessions.find((s: any) => s.sessionId === targetSessionId);

      if (targetSession) {
        setExpandedSessionId(targetSessionId);

        // Scroll to the session after a short delay
        setTimeout(() => {
          const element = document.getElementById(`session-row-${targetSessionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);

        // Clear the filter from sessionStorage
        sessionStorage.removeItem('admin_sessions_filter');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  const handleSessionClick = (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
      // NO FETCH - we already have all the data we need in the session list
    }
  };

  const handleNavigateToOrganizer = (organizerId: string) => {
    if (onNavigateToOrganizer) {
      // Store current view state
      sessionStorage.setItem('admin_return_to_sessions', 'true');
      onNavigateToOrganizer(organizerId);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const query = searchQuery.toLowerCase();
    return (
      session.sessionName?.toLowerCase().includes(query) ||
      session.organizerName?.toLowerCase().includes(query) ||
      session.organizerEmail?.toLowerCase().includes(query) ||
      session.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Session management</CardTitle>
                {isRefetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <CardDescription>
                All sessions across all organizers
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search sessions, organizers, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              Showing {filteredSessions.length} of {sessions.length} sessions
            </div>
          </div>


          {/* Sessions Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading sessions...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Session name</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Rounds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchQuery ? 'No sessions found matching your search.' : 'No sessions found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSessions.map((session) => {
                      const isExpanded = expandedSessionId === session.sessionId;

                      return (
                        <React.Fragment key={session.sessionId}>
                          <TableRow 
                            id={`session-row-${session.sessionId}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSessionClick(session.sessionId)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{session.sessionName}</TableCell>
                            <TableCell>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToOrganizer(session.organizerId);
                                }}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {session.organizerName}
                                <ExternalLink className="h-3 w-3" />
                              </button>
                              <div className="text-xs text-muted-foreground">{session.organizerEmail}</div>
                            </TableCell>
                            <TableCell>
                              <OrganizerStatusBadge status={session.status} />
                            </TableCell>
                            <TableCell>{session.date || '-'}</TableCell>
                            <TableCell>{session.rounds?.length || 0}</TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={6} className="bg-muted/30">
                                <div className="p-4 space-y-4">
                                  {/* Session Info */}
                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div key="session-id">
                                      <div className="text-xs text-muted-foreground mb-1">Session ID</div>
                                      <div className="text-sm font-mono">{session.sessionId}</div>
                                    </div>
                                    <div key="registration-start">
                                      <div className="text-xs text-muted-foreground mb-1">Registration start</div>
                                      <div className="text-sm">{session.registrationStart || 'Not set'}</div>
                                    </div>
                                    <div key="end-time">
                                      <div className="text-xs text-muted-foreground mb-1">End time</div>
                                      <div className="text-sm">{session.endTime || 'Not set'}</div>
                                    </div>
                                  </div>

                                  {/* Rounds */}
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Rounds ({session.rounds?.length || 0})
                                    </h4>
                                    {!session.rounds || session.rounds.length === 0 ? (
                                      <div className="text-sm text-muted-foreground">No rounds configured</div>
                                    ) : (
                                      <div className="space-y-3">
                                        {session.rounds.map((round: any) => (
                                          <div key={round.id} className="border rounded-lg p-3 bg-background">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <div className="font-medium text-sm">{round.name}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                                  <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {round.date || session.date || '-'}
                                                  </span>
                                                  <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {round.startTime || 'TBD'}
                                                  </span>
                                                  <span>{round.duration || 10} min</span>
                                                </div>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Store filter and navigate to participant management
                                                  sessionStorage.setItem('admin_participant_filter_session', session.sessionId);
                                                  sessionStorage.setItem('admin_participant_filter_round', round.id);
                                                  // Trigger navigation via callback if available
                                                  // For now, just show a message
                                                  if (onNavigateToParticipants) {
                                                    onNavigateToParticipants();
                                                  } else {
                                                    alert(`Navigate to participants for round: ${round.name}\n\nThis will be implemented to filter the participant management view.`);
                                                  }
                                                }}
                                              >
                                                <Users className="h-3 w-3 mr-1" />
                                                View participants
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
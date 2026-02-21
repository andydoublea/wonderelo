import { NetworkingSession } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, UserCheck, Hash, MapPin, CalendarCheck } from 'lucide-react';
import { hasRunningRounds } from '../utils/sessionStatus';
import { debugLog } from '../utils/debug';

interface SessionDetailCardProps {
  session: NetworkingSession;
  showTitle?: boolean;
  showStatus?: boolean;
  showRounds?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  noWrapper?: boolean; // If true, don't wrap in Card component
}

export function SessionDetailCard({
  session,
  showTitle = true,
  showStatus = true,
  showRounds = true,
  variant = 'default',
  className = '',
  noWrapper = false
}: SessionDetailCardProps) {
  const estimatedGroups = (() => {
    if (session.limitGroups && session.maxGroups) {
      return session.maxGroups;
    }
    if (session.limitParticipants && session.maxParticipants && session.groupSize) {
      return Math.ceil(session.maxParticipants / session.groupSize);
    }
    return 'Unlimited';
  })();

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'Date and time to be determined';
    const sessionDate = new Date(`${date}T${time}`);
    return sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSessionRunning = (session: NetworkingSession) => {
    if (!session.date || !session.startTime || !session.endTime) return false;
    const now = new Date();
    const sessionStart = new Date(`${session.date}T${session.startTime}`);
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    return now >= sessionStart && now <= sessionEnd;
  };

  const isRegistrationOpen = (session: NetworkingSession) => {
    if (!session.registrationStart || !session.date) return false;
    const now = new Date().toISOString().split('T')[0];
    return now >= session.registrationStart && now < session.date;
  };

  const getStatusColor = (status: NetworkingSession['status']) => {
    if (status === 'published') return 'default';
    if (status === 'draft') return 'secondary';
    if (status === 'scheduled') return 'default';
    if (status === 'completed') return 'outline';
    return 'secondary';
  };

  // Check if session has any rounds that haven't ended yet
  const hasActiveRounds = () => {
    if (!session.rounds || session.rounds.length === 0) return false;
    if (!session.date) return false;
    
    const now = new Date();
    return session.rounds.some((round: any) => {
      if (!round.startTime) return false;
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date);
      roundStart.setHours(hours, minutes, 0, 0);
      // Calculate round end time (start + duration)
      const duration = round.duration || session.roundDuration || 0;
      const roundEnd = new Date(roundStart.getTime() + duration * 60 * 1000);
      // Round is active if it hasn't ended yet
      return now < roundEnd;
    });
  };

  const getStatusLabel = (status: NetworkingSession['status']) => {
    // Show "Published on event page" only if session is published AND has active rounds
    if (status === 'published') {
      return hasActiveRounds() ? 'Published on event page' : null;
    }
    if (status === 'draft') return 'Draft';
    if (status === 'scheduled') return 'Scheduled';
    if (status === 'completed') return 'Completed';
    return status;
  };

  const formatRegistrationStart = (registrationStart?: string, status?: NetworkingSession['status']) => {
    // If draft, no registration start configured yet
    if (status === 'draft' || !registrationStart) {
      return 'Not configured';
    }
    
    const regDate = new Date(registrationStart);
    
    // Helper to format date with relative days (yesterday, today, tomorrow)
    const formatDateWithRelative = (date: Date): string => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      const diffDays = Math.round((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === -1) return 'yesterday';
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'tomorrow';
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    const result = formatDateWithRelative(regDate) + ' at ' +
           regDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    return result;
  };

  const innerContent = (
    <>
      {session.date ? (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {formatDateTime(session.date, session.startTime || '')}
          </div>
          {session.startTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {session.startTime} - {session.endTime || 'To be set'}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          To be scheduled
        </div>
      )}
        
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>Groups of {session.groupSize} • {session.limitGroups ? `Max ${session.maxGroups}` : (typeof estimatedGroups === 'number' ? `${estimatedGroups}` : 'Unlimited')} groups • {session.limitParticipants ? `Max ${session.maxParticipants}` : 'Unlimited'} participants</span>
        </div>

        <div className="space-y-2">
          {session.enableTeams && session.teams && session.teams.length > 0 && (
            <div className="text-sm flex items-center gap-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Teams:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {session.teams.slice(0, 3).map((team, index) => {
                  debugLog(`🎉 SESSION DETAIL CARD rendering team badge ${index + 1}:`, team);
                  return (
                    <Badge key={`team-${session.id}-${index}`} variant="secondary" className="text-xs">
                      {team}
                    </Badge>
                  );
                })}
                {session.teams.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{session.teams.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {session.enableTopics && session.topics && session.topics.length > 0 && (
            <div className="text-sm flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Topics:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {session.topics.slice(0, 3).map((topic, index) => {
                  debugLog(`#️⃣ SESSION DETAIL CARD rendering topic badge ${index + 1}:`, topic);
                  return (
                    <Badge key={`topic-${session.id}-${index}`} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  );
                })}
                {session.topics.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{session.topics.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Round duration */}
          <div className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Round duration:</span>
            <span>{session.roundDuration} min</span>
          </div>

          {/* Gap time - only show if multiple rounds */}
          {session.numberOfRounds > 1 && session.gapBetweenRounds !== undefined && (
            <div className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Gap time:</span>
              <span>{session.gapBetweenRounds} min</span>
            </div>
          )}

          {session.numberOfRounds >= 2 && (() => {
            debugLog('🕒 CHECKING START TIMES:', {
              sessionName: session.name,
              numberOfRounds: session.numberOfRounds,
              roundsLength: session.rounds?.length,
              roundsSample: session.rounds?.slice(0, 3).map(r => ({ id: r.id, startTime: r.startTime }))
            });
            
            const hasRounds = session.rounds && session.rounds.length > 0;
            
            if (hasRounds) {
              // Filter valid rounds and sort by date + time
              const validRounds = session.rounds
                .filter(round => round.startTime && round.startTime.trim() !== '')
                .sort((a, b) => {
                  // Sort by date first (use session.date as fallback), then by time
                  const dateA = a.date || session.date;
                  const dateB = b.date || session.date;
                  const dateTimeA = new Date(`${dateA}T${a.startTime}:00`);
                  const dateTimeB = new Date(`${dateB}T${b.startTime}:00`);
                  return dateTimeA.getTime() - dateTimeB.getTime();
                });
              
              // Group rounds by date
              const roundsByDate = validRounds.reduce((acc, round) => {
                const roundDate = round.date || session.date;
                if (!acc[roundDate]) {
                  acc[roundDate] = [];
                }
                acc[roundDate].push(round);
                return acc;
              }, {} as Record<string, typeof validRounds>);
              
              debugLog('✅ ROUNDS GROUPED BY DATE:', roundsByDate);
              
              if (validRounds.length > 0) {
                // Check if session has rounds on multiple days
                const isMultiDay = Object.keys(roundsByDate).length > 1;
                
                return (
                  <div className="text-sm flex items-start gap-2">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start times:</span>
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      {Object.entries(roundsByDate).map(([date, rounds], groupIndex) => {
                        const dateLabel = isMultiDay 
                          ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : null;
                        
                        return (
                          <div key={`date-group-${groupIndex}`} className="flex flex-wrap gap-1 items-center">
                            {dateLabel && (
                              <span className="text-xs text-muted-foreground mr-1">
                                {dateLabel}:
                              </span>
                            )}
                            {rounds.map((round, index) => (
                              <Badge key={`time-${session.id}-${groupIndex}-${index}`} variant="secondary" className="text-xs">
                                {round.startTime}
                              </Badge>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start times: </span>
                    <span className="text-muted-foreground">Times not configured</span>
                  </div>
                );
              }
            } else {
              return (
                <div className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start times: </span>
                  <span className="text-muted-foreground">Rounds not created</span>
                </div>
              );
            }
          })()}

          {/* Registration start */}
          <div className="text-sm flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Registration start:</span>
            <span>{formatRegistrationStart(session.registrationStart, session.status)}</span>
          </div>

          {session.meetingPoints && session.meetingPoints.length > 0 && (
            <div className="text-sm flex items-start gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Meeting points:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {session.meetingPoints.slice(0, 3).map((point, index) => (
                  <Badge key={`point-${session.id}-${index}`} variant="secondary" className="text-xs">
                    {point.name || point}
                  </Badge>
                ))}
                {session.meetingPoints.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{session.meetingPoints.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {variant === 'compact' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recurring:</span>
                <span className="capitalize">{session.isRecurring ? session.frequency : 'One-time'}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rounds:</span>
                <span>{session.rounds?.length || 0} rounds</span>
              </div>
            </>
          )}
        </div>
    </>
  );

  if (noWrapper) {
    return <div className={`px-6 pb-6 ${className}`}>{innerContent}</div>;
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg leading-tight">{session.name}</CardTitle>
          </div>
          {showStatus && (
            <div className="flex gap-2">
              {getStatusLabel(session.status) && (
                <Badge 
                  variant={getStatusColor(session.status)} 
                  className="w-fit"
                >
                  {getStatusLabel(session.status)}
                </Badge>
              )}
              {hasRunningRounds(session) && (
                <Badge 
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-200 w-fit"
                >
                  Running
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {innerContent}
      </CardContent>
    </Card>
  );
}
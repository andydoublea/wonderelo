import { NetworkingSession } from '../App';
import { SessionDisplayCard } from './SessionDisplayCard';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { useState } from 'react';

interface SessionListProps {
  sessions: NetworkingSession[];
  isLoading?: boolean;
  onEditSession: (session: NetworkingSession) => void;
  onDeleteSession: (id: string) => void;
  onDuplicateSession: (session: NetworkingSession) => void;
  onUpdateSession: (id: string, updates: Partial<NetworkingSession>) => void;
  onManageSession: (session: NetworkingSession) => void;
  onCreateNew?: () => void;
  groupBy?: 'date' | 'status';
  hideEmptySections?: boolean;
  highlightSessionId?: string | null;
}

export function SessionList({ 
  sessions,
  isLoading = false,
  onEditSession, 
  onDeleteSession,
  onDuplicateSession,
  onUpdateSession,
  onManageSession,
  onCreateNew,
  groupBy = 'date',
  hideEmptySections = false,
  highlightSessionId = null
}: SessionListProps) {
  // State for "Load more" functionality - separate for each status
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    completed: 6, // Show 6 completed rounds initially
    draft: 6, // Show 6 draft rounds initially
    scheduled: 6, // Show 6 scheduled rounds initially
  });

  const INITIAL_COUNT = 6;
  const LOAD_MORE_INCREMENT = 6;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for status sections */}
        {['Running', 'Scheduled', 'Draft'].map((status) => (
          <div key={status}>
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-4">No rounds yet</h3>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create networking round
          </Button>
        )}
      </div>
    );
  }

  if (groupBy === 'status') {
    // Group sessions by status while preserving order
    const sessionsByStatus = sessions.reduce((groups, session) => {
      const status = session.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(session);
      return groups;
    }, {} as Record<string, NetworkingSession[]>);

    // Define status order and formatting
    const statusOrder = ['published', 'scheduled', 'draft', 'completed'];
    const formatStatus = (status: string) => {
      if (status === 'published') return 'Published on event page';
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const handleLoadMore = (status: string) => {
      setVisibleCounts(prev => ({
        ...prev,
        [status]: (prev[status] || INITIAL_COUNT) + LOAD_MORE_INCREMENT
      }));
    };

    return (
      <div className="space-y-6">
        {statusOrder.map(status => {
          const statusSessions = sessionsByStatus[status] || [];
          
          // Hide empty sections if hideEmptySections is true OR for live and scheduled
          const shouldHideIfEmpty = hideEmptySections || ['published', 'scheduled'].includes(status);
          if (shouldHideIfEmpty && statusSessions.length === 0) {
            return null;
          }
          
          // Use sessions as-is, already sorted by parent component
          const sortedSessions = statusSessions;

          // Determine how many to show
          const shouldLimitDisplay = status === 'completed' || status === 'draft' || status === 'scheduled';
          const visibleCount = shouldLimitDisplay
            ? (visibleCounts[status] || INITIAL_COUNT)
            : sortedSessions.length; // Show all for other statuses

          const visibleSessions = sortedSessions.slice(0, visibleCount);
          const hasMore = sortedSessions.length > visibleCount;
          
          return (
            <div key={status} id={`section-${status}`}>
              <h3 className="mb-4">{formatStatus(status)}</h3>
              {statusSessions.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="text-center py-8 text-muted-foreground">
                      <p>No {status} sessions</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleSessions.map((session, index) => {
                    // Generate unique key - combine status, ID, and index to handle duplicates
                    const uniqueKey = session.id 
                      ? `${status}-${session.id}-${index}` 
                      : `session-${status}-${index}`;
                    
                    return (
                      <SessionDisplayCard
                        key={uniqueKey}
                        session={session}
                        adminMode={true}
                        onEdit={() => onEditSession(session)}
                        onDelete={() => onDeleteSession(session.id)}
                        onDuplicate={() => onDuplicateSession(session)}
                        onUpdateStatus={(status) => onUpdateSession(session.id, { status })}
                        onUpdateSession={onUpdateSession}
                        onManage={() => onManageSession(session)}
                        isHighlighted={highlightSessionId === session.id}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => handleLoadMore(status)}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Group sessions by date (original logic)
  const sessionsByDate = sessions.reduce((groups, session) => {
    const date = session.date || 'no-date';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, NetworkingSession[]>);

  // Sort dates (put 'no-date' last)
  const sortedDates = Object.keys(sessionsByDate).sort((a, b) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    return a.localeCompare(b);
  });

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'no-date') return 'No date set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'No date set';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateString === tomorrow.toISOString().split('T')[0]) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="mb-4 capitalize">{formatDate(date)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsByDate[date]
              .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
              .map((session, index) => {
                // Generate unique key - combine date, ID, and index to handle duplicates
                const uniqueKey = session.id 
                  ? `${date}-${session.id}-${index}` 
                  : `session-${date}-${index}`;
                
                return (
                  <SessionDisplayCard
                    key={uniqueKey}
                    session={session}
                    adminMode={true}
                    onEdit={() => onEditSession(session)}
                    onDelete={() => onDeleteSession(session.id)}
                    onDuplicate={() => onDuplicateSession(session)}
                    onUpdateStatus={(status) => onUpdateSession(session.id, { status })}
                    onUpdateSession={onUpdateSession}
                    onManage={() => onManageSession(session)}
                    isHighlighted={highlightSessionId === session.id}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
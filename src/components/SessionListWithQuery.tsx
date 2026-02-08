import { useSessions } from '../hooks/useQueryHooks';
import { SessionList } from './SessionList';
import { Skeleton } from './ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { debugLog } from '../utils/debug';
import { useEffect } from 'react';

/**
 * Session List with React Query integration
 * 
 * This component demonstrates how to use React Query hooks
 * for automatic caching, refetching, and state management.
 * 
 * Benefits:
 * - Automatic caching of session data
 * - Background refetching when data becomes stale
 * - Built-in loading and error states
 * - Optimistic updates support
 * - Offline support via cache
 */

interface SessionListWithQueryProps {
  userId?: string;
  onSessionClick?: (sessionId: string) => void;
  onUpdateSession?: (id: string, updates: any) => void;
  onDeleteSession?: (id: string) => void;
}

export function SessionListWithQuery({
  userId,
  onSessionClick,
  onUpdateSession,
  onDeleteSession
}: SessionListWithQueryProps) {
  // React Query hook - automatically handles loading, caching, refetching
  const { 
    data: response, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching 
  } = useSessions(userId, {
    // Refetch every 30 seconds in background
    refetchInterval: 30000,
    // Consider data stale after 10 seconds
    staleTime: 10000,
    // Keep unused data in cache for 5 minutes
    cacheTime: 5 * 60 * 1000,
    // Retry failed requests 2 times
    retry: 2,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Refetch when network reconnects
    refetchOnReconnect: true,
  });

  useEffect(() => {
    debugLog('🔄 SessionListWithQuery state:', {
      hasData: !!response,
      isLoading,
      isFetching,
      isError,
      sessionCount: response?.sessions?.length || 0
    });
  }, [response, isLoading, isFetching, isError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="mb-2">Failed to load sessions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  // Extract sessions from response
  const sessions = response?.sessions || [];

  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-12 text-center">
        <h3 className="mb-2">No sessions yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first networking session to get started
        </p>
      </div>
    );
  }

  // Success state - render session list
  return (
    <div className="relative">
      {/* Background refetching indicator */}
      {isFetching && !isLoading && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-xs flex items-center gap-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            Syncing...
          </div>
        </div>
      )}

      <SessionList
        sessions={sessions}
        onSessionClick={onSessionClick}
        onUpdateSession={onUpdateSession}
        onDeleteSession={onDeleteSession}
      />
    </div>
  );
}

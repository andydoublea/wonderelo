import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { debugLog, errorLog } from './debug';
import { handleApiError } from './apiErrorHandler';
import { toast } from 'sonner@2.0.3';

/**
 * React Query Configuration
 * Centralized cache and request management
 */

// Default options for all queries
const queryConfig: DefaultOptions = {
  queries: {
    // Cache time - how long data stays in cache after component unmounts
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Stale time - how long before data is considered stale
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Retry failed requests
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch on window focus (user comes back to tab)
    refetchOnWindowFocus: true,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
    
    // Error handling
    throwOnError: false,
    
    // Prevent automatic refetching
    refetchInterval: false,
    
    // Meta data for logging
    meta: {
      errorMessage: 'Failed to fetch data'
    }
  },
  
  mutations: {
    // Retry mutations once on network error
    retry: 1,
    
    // Error handling for mutations
    throwOnError: false,
    
    // Default error handler
    onError: (error: any, _variables, _context) => {
      errorLog('Mutation error:', error);
      
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    },
    
    // Meta data
    meta: {
      errorMessage: 'Operation failed'
    }
  }
};

/**
 * Create Query Client instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
  
  // Global error handler
  // This runs before individual query/mutation error handlers
  queryCache: undefined,
  mutationCache: undefined
});

/**
 * Query Keys Factory
 * Centralized query key management for better cache invalidation
 */
export const queryKeys = {
  // User queries
  user: {
    all: ['users'] as const,
    lists: () => [...queryKeys.user.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.user.lists(), filters] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.user.details(), id] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const
  },
  
  // Session queries
  session: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.session.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.session.lists(), filters || 'all'] as const,
    details: () => [...queryKeys.session.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.session.details(), id] as const,
    byUser: (userId: string) => [...queryKeys.session.all, 'byUser', userId] as const,
    bySlug: (slug: string) => [...queryKeys.session.all, 'bySlug', slug] as const
  },
  
  // Round queries
  round: {
    all: ['rounds'] as const,
    lists: () => [...queryKeys.round.all, 'list'] as const,
    list: (sessionId: string) => [...queryKeys.round.lists(), sessionId] as const,
    details: () => [...queryKeys.round.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.round.details(), id] as const,
    participants: (roundId: string) => [...queryKeys.round.all, 'participants', roundId] as const
  },
  
  // Participant queries
  participant: {
    all: ['participants'] as const,
    lists: () => [...queryKeys.participant.all, 'list'] as const,
    list: (sessionId?: string) => [...queryKeys.participant.lists(), sessionId || 'all'] as const,
    details: () => [...queryKeys.participant.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.participant.details(), id] as const,
    byToken: (token: string) => [...queryKeys.participant.all, 'byToken', token] as const,
    byEmail: (email: string) => [...queryKeys.participant.all, 'byEmail', email] as const,
    contacts: (participantId: string) => [...queryKeys.participant.all, 'contacts', participantId] as const
  },
  
  // Meeting point queries
  meetingPoint: {
    all: ['meetingPoints'] as const,
    lists: () => [...queryKeys.meetingPoint.all, 'list'] as const,
    list: (sessionId: string) => [...queryKeys.meetingPoint.lists(), sessionId] as const
  },
  
  // Ice breaker queries
  iceBreaker: {
    all: ['iceBreakers'] as const,
    lists: () => [...queryKeys.iceBreaker.all, 'list'] as const,
    list: () => [...queryKeys.iceBreaker.lists()] as const
  },
  
  // Statistics queries
  stats: {
    all: ['stats'] as const,
    session: (sessionId: string) => [...queryKeys.stats.all, 'session', sessionId] as const,
    round: (roundId: string) => [...queryKeys.stats.all, 'round', roundId] as const,
    dashboard: () => [...queryKeys.stats.all, 'dashboard'] as const
  }
} as const;

/**
 * Helper function to invalidate related queries
 */
export const invalidateQueries = {
  /**
   * Invalidate all session-related queries
   */
  session: async (sessionId?: string) => {
    if (sessionId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.detail(sessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.round.list(sessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.participant.list(sessionId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.stats.session(sessionId) });
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
    }
    debugLog('Invalidated session queries:', sessionId || 'all');
  },
  
  /**
   * Invalidate all participant-related queries
   */
  participant: async (participantId?: string) => {
    if (participantId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.participant.detail(participantId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.participant.contacts(participantId) });
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.participant.all });
    }
    debugLog('Invalidated participant queries:', participantId || 'all');
  },
  
  /**
   * Invalidate all round-related queries
   */
  round: async (roundId?: string) => {
    if (roundId) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.round.detail(roundId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.round.participants(roundId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.stats.round(roundId) });
    } else {
      await queryClient.invalidateQueries({ queryKey: queryKeys.round.all });
    }
    debugLog('Invalidated round queries:', roundId || 'all');
  },
  
  /**
   * Invalidate all queries (use sparingly)
   */
  all: async () => {
    await queryClient.invalidateQueries();
    debugLog('Invalidated all queries');
  }
};

/**
 * Prefetch helpers
 */
export const prefetchQueries = {
  /**
   * Prefetch session details
   */
  session: async (sessionId: string, fetcher: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.session.detail(sessionId),
      queryFn: fetcher,
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
    debugLog('Prefetched session:', sessionId);
  },
  
  /**
   * Prefetch participant data
   */
  participant: async (token: string, fetcher: () => Promise<any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.participant.byToken(token),
      queryFn: fetcher,
      staleTime: 5 * 60 * 1000
    });
    debugLog('Prefetched participant:', token);
  }
};

/**
 * Cache management helpers
 */
export const cacheHelpers = {
  /**
   * Get cached data without fetching
   */
  get: <T = any>(queryKey: any[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },
  
  /**
   * Set cache data manually
   */
  set: <T = any>(queryKey: any[], data: T) => {
    queryClient.setQueryData(queryKey, data);
    debugLog('Set cache data:', queryKey);
  },
  
  /**
   * Update cache data with updater function
   */
  update: <T = any>(queryKey: any[], updater: (old: T | undefined) => T) => {
    queryClient.setQueryData(queryKey, updater);
    debugLog('Updated cache data:', queryKey);
  },
  
  /**
   * Remove specific query from cache
   */
  remove: (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
    debugLog('Removed cache data:', queryKey);
  },
  
  /**
   * Clear all cache
   */
  clear: () => {
    queryClient.clear();
    debugLog('Cleared all cache');
  },
  
  /**
   * Get cache stats
   */
  getStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus !== 'idle').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length
    };
  }
};

/**
 * Development helpers
 */
export const devHelpers = {
  /**
   * Log all queries in cache
   */
  logCache: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    console.group('🔍 React Query Cache');
    queries.forEach(query => {
      console.log({
        key: query.queryKey,
        state: query.state.status,
        data: query.state.data,
        stale: query.isStale()
      });
    });
    console.groupEnd();
  },
  
  /**
   * Get query details
   */
  getQueryDetails: (queryKey: any[]) => {
    const query = queryClient.getQueryCache().find({ queryKey });
    return query?.state;
  },
  
  /**
   * Force refetch all queries
   */
  refetchAll: async () => {
    await queryClient.refetchQueries();
    debugLog('Refetched all queries');
  }
};

/**
 * Export for React Query DevTools
 */
export { queryClient as default };
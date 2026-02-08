import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../utils/queryClient';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';
import { handleApiError } from '../utils/apiErrorHandler';
import { SessionToasts, ParticipantToasts, RegistrationToasts } from '../utils/toastMessages';

/**
 * Custom React Query hooks for Oliwonder API
 * Provides type-safe, cached data fetching
 */

// ========================================
// SESSION HOOKS
// ========================================

/**
 * Fetch all sessions for a user
 */
export function useSessions(userId?: string, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.session.byUser(userId || 'all'),
    queryFn: async () => {
      const url = userId 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/user/${userId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!userId || options?.enabled !== false,
    ...options
  });
}

/**
 * Fetch single session by ID
 */
export function useSession(sessionId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.session.detail(sessionId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/${sessionId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    ...options
  });
}

/**
 * Fetch session by slug (for public pages)
 */
export function useSessionBySlug(slug: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.session.bySlug(slug),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/slug/${slug}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!slug,
    ...options
  });
}

/**
 * Create new session mutation
 */
export function useCreateSession(options?: UseMutationOptions<any, Error, any>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sessionData)
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      invalidateQueries.session();
      SessionToasts.createSuccess(data.title);
      debugLog('Session created:', data.id);
    },
    onError: (error) => {
      errorLog('Failed to create session:', error);
      SessionToasts.createError();
    },
    ...options
  });
}

/**
 * Update session mutation
 */
export function useUpdateSession(options?: UseMutationOptions<any, Error, { sessionId: string; data: any }>) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: any }) => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/${sessionId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      invalidateQueries.session(variables.sessionId);
      SessionToasts.updateSuccess(data.title);
      debugLog('Session updated:', variables.sessionId);
    },
    onError: (error) => {
      errorLog('Failed to update session:', error);
      SessionToasts.updateError();
    },
    ...options
  });
}

/**
 * Delete session mutation
 */
export function useDeleteSession(options?: UseMutationOptions<void, Error, string>) {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
    },
    onSuccess: (_, sessionId) => {
      invalidateQueries.session();
      SessionToasts.deleteSuccess();
      debugLog('Session deleted:', sessionId);
    },
    onError: (error) => {
      errorLog('Failed to delete session:', error);
      SessionToasts.deleteError();
    },
    ...options
  });
}

// ========================================
// PARTICIPANT HOOKS
// ========================================

/**
 * Fetch participant by token
 */
export function useParticipantByToken(token: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.participant.byToken(token),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participants/token/${token}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!token,
    ...options
  });
}

/**
 * Fetch all participants for a session
 */
export function useParticipants(sessionId: string, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.participant.list(sessionId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/${sessionId}/participants`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    ...options
  });
}

/**
 * Fetch participant contacts
 */
export function useParticipantContacts(participantId: string, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.participant.contacts(participantId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participants/${participantId}/contacts`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!participantId,
    ...options
  });
}

/**
 * Register participant mutation
 */
export function useRegisterParticipant(options?: UseMutationOptions<any, Error, any>) {
  return useMutation({
    mutationFn: async (registrationData: any) => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/register`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(registrationData)
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      invalidateQueries.participant();
      RegistrationToasts.success();
      debugLog('Participant registered:', data.participantToken);
    },
    onError: (error) => {
      errorLog('Registration failed:', error);
      RegistrationToasts.error();
    },
    ...options
  });
}

/**
 * Update participant mutation
 */
export function useUpdateParticipant(options?: UseMutationOptions<any, Error, { participantId: string; data: any }>) {
  return useMutation({
    mutationFn: async ({ participantId, data }: { participantId: string; data: any }) => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participants/${participantId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      invalidateQueries.participant(variables.participantId);
      ParticipantToasts.updateSuccess();
      debugLog('Participant updated:', variables.participantId);
    },
    onError: (error) => {
      errorLog('Failed to update participant:', error);
      ParticipantToasts.updateError();
    },
    ...options
  });
}

// ========================================
// ROUND HOOKS
// ========================================

/**
 * Fetch rounds for a session
 */
export function useRounds(sessionId: string, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.round.list(sessionId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/sessions/${sessionId}/rounds`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    ...options
  });
}

/**
 * Fetch round participants
 */
export function useRoundParticipants(roundId: string, options?: UseQueryOptions<any[], Error>) {
  return useQuery({
    queryKey: queryKeys.round.participants(roundId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/rounds/${roundId}/participants`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!roundId,
    ...options
  });
}

// ========================================
// STATISTICS HOOKS
// ========================================

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats(options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.stats.dashboard(),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/stats/dashboard`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
}

/**
 * Fetch session statistics
 */
export function useSessionStats(sessionId: string, options?: UseQueryOptions<any, Error>) {
  return useQuery({
    queryKey: queryKeys.stats.session(sessionId),
    queryFn: async () => {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/stats/session/${sessionId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(await handleApiError(response));
      }
      
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
}

// ========================================
// OPTIMISTIC UPDATE HELPERS
// ========================================

/**
 * Helper for optimistic updates
 */
export function useOptimisticUpdate() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Optimistically update a session
     */
    updateSession: async (sessionId: string, updater: (old: any) => any) => {
      const queryKey = queryKeys.session.detail(sessionId);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update
      queryClient.setQueryData(queryKey, updater);
      
      return { previousData, queryKey };
    },
    
    /**
     * Optimistically update a participant
     */
    updateParticipant: async (participantId: string, updater: (old: any) => any) => {
      const queryKey = queryKeys.participant.detail(participantId);
      
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, updater);
      
      return { previousData, queryKey };
    }
  };
}

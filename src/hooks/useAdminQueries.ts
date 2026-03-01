import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiBaseUrl } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { errorLog } from '../utils/debug';

/**
 * Admin API query hooks
 * Provides cached data fetching for all admin pages using React Query
 */

// ========================================
// HELPER: Get access token from Supabase
// ========================================

async function getAccessToken(): Promise<string> {
  const { supabase } = await import('../utils/supabase/client');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Authentication failed. Please refresh the page.');
  }
  return session.access_token;
}

// ========================================
// QUERY KEYS
// ========================================

export const adminQueryKeys = {
  notificationTexts: ['admin', 'notification-texts'] as const,
  parameters: ['admin', 'parameters'] as const,
  iceBreakers: ['admin', 'ice-breakers'] as const,
  giftCards: ['admin', 'gift-cards'] as const,
  defaultRoundRules: ['admin', 'default-round-rules'] as const,
  blogPosts: ['admin', 'blog-posts'] as const,
  participants: ['admin', 'participants'] as const,
  participantDetail: (id: string) => ['admin', 'participants', id] as const,
  participantAuditLog: (id: string) => ['admin', 'participants', id, 'audit-log'] as const,
  sessions: ['admin', 'sessions'] as const,
  billing: (userId: string) => ['admin', 'billing', userId] as const,
} as const;

// ========================================
// HELPER: Admin fetch with auth
// ========================================

async function adminFetch(path: string, accessToken: string, options?: RequestInit) {
  const response = await fetch(
    `${apiBaseUrl}${path}`,
    {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ========================================
// NOTIFICATION TEXTS
// ========================================

export function useNotificationTexts(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.notificationTexts,
    queryFn: async () => {
      const data = await adminFetch('/admin/notification-texts', accessToken);
      return data.texts && Object.keys(data.texts).length > 0 ? data.texts : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveNotificationTexts(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (texts: any) => {
      return adminFetch('/admin/notification-texts', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ texts }),
      });
    },
    onSuccess: (_data, texts) => {
      queryClient.setQueryData(adminQueryKeys.notificationTexts, texts);
      toast.success('Notification texts saved successfully');
    },
    onError: (error: Error) => {
      errorLog('Error saving notification texts:', error);
      toast.error(error.message || 'Failed to save notification texts');
    },
  });
}

// ========================================
// PARAMETERS
// ========================================

export function useAdminParameters(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.parameters,
    queryFn: async () => {
      const data = await adminFetch('/admin/parameters', accessToken);
      return data.parameters && Object.keys(data.parameters).length > 0 ? data.parameters : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveParameters(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (parameters: any) => {
      return adminFetch('/admin/parameters', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ parameters }),
      });
    },
    onSuccess: (_data, parameters) => {
      queryClient.setQueryData(adminQueryKeys.parameters, parameters);
      toast.success('Parameters saved and applied immediately');
    },
    onError: (error: Error) => {
      errorLog('Error saving parameters:', error);
      toast.error(error.message || 'Failed to save parameters');
    },
  });
}

// ========================================
// ICE BREAKERS
// ========================================

export function useIceBreakers(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.iceBreakers,
    queryFn: async () => {
      const data = await adminFetch('/admin/ice-breakers', accessToken);
      return data.iceBreakers || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveIceBreakers(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (iceBreakers: string[]) => {
      return adminFetch('/admin/ice-breakers', accessToken, {
        method: 'PUT',
        body: JSON.stringify({ iceBreakers }),
      });
    },
    onSuccess: (_data, iceBreakers) => {
      queryClient.setQueryData(adminQueryKeys.iceBreakers, iceBreakers);
    },
    onError: (error: Error) => {
      errorLog('Error saving ice breakers:', error);
      toast.error(error.message || 'Failed to save ice breakers');
    },
  });
}

// ========================================
// GIFT CARDS
// ========================================

export function useGiftCards(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.giftCards,
    queryFn: async () => {
      const data = await adminFetch('/admin/gift-cards/list', accessToken);
      return data.giftCards || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGiftCard(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (giftCardData: any) => {
      return adminFetch('/admin/gift-cards/create', accessToken, {
        method: 'POST',
        body: JSON.stringify(giftCardData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.giftCards });
      toast.success('Gift card created successfully!');
    },
    onError: (error: Error) => {
      errorLog('Error creating gift card:', error);
      toast.error(error.message || 'Failed to create gift card');
    },
  });
}

export function useToggleGiftCard(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      return adminFetch(`/admin/gift-cards/${code}/toggle`, accessToken, {
        method: 'PUT',
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.giftCards });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      errorLog('Error toggling gift card:', error);
      toast.error(error.message || 'Failed to toggle gift card');
    },
  });
}

export function useDeleteGiftCard(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      return adminFetch(`/admin/gift-cards/${code}`, accessToken, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.giftCards });
      toast.success('Gift card deleted');
    },
    onError: (error: Error) => {
      errorLog('Error deleting gift card:', error);
      toast.error(error.message || 'Failed to delete gift card');
    },
  });
}

// ========================================
// DEFAULT ROUND RULES
// ========================================

export function useDefaultRoundRules(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.defaultRoundRules,
    queryFn: async () => {
      const data = await adminFetch('/admin/default-round-rules', accessToken);
      const rules = data.rules;
      if (!rules || !Array.isArray(rules) || rules.length === 0) {
        return null; // Signal to use defaults
      }
      return rules;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveDefaultRoundRules(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: any[]) => {
      return adminFetch('/admin/default-round-rules', accessToken, {
        method: 'POST',
        body: JSON.stringify({ rules }),
      });
    },
    onSuccess: (_data, rules) => {
      queryClient.setQueryData(adminQueryKeys.defaultRoundRules, rules);
      toast.success('Default round rules updated successfully!');
    },
    onError: (error: Error) => {
      errorLog('Error saving round rules:', error);
      toast.error(error.message || 'Failed to update round rules');
    },
  });
}

// ========================================
// BLOG POSTS
// ========================================

export function useBlogPosts(accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.blogPosts,
    queryFn: async () => {
      const data = await adminFetch('/admin/blog/posts', accessToken);
      return data.posts || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveBlogPost(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      const path = id ? `/admin/blog/posts/${id}` : '/admin/blog/posts';
      return adminFetch(path, accessToken, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.blogPosts });
      toast.success(variables.id ? 'Blog post updated' : 'Blog post created');
    },
    onError: (error: Error) => {
      errorLog('Error saving blog post:', error);
      toast.error(error.message || 'Failed to save blog post');
    },
  });
}

export function useDeleteBlogPost(accessToken: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      return adminFetch(`/admin/blog/posts/${postId}`, accessToken, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.blogPosts });
      toast.success('Blog post deleted');
    },
    onError: (error: Error) => {
      errorLog('Error deleting blog post:', error);
      toast.error(error.message || 'Failed to delete blog post');
    },
  });
}

// ========================================
// ADMIN PARTICIPANTS
// ========================================

export function useAdminParticipants(accessToken?: string) {
  return useQuery({
    queryKey: adminQueryKeys.participants,
    queryFn: async () => {
      const token = accessToken || await getAccessToken();
      const data = await adminFetch('/admin/participants', token);
      return data.participants || [];
    },
    staleTime: 2 * 60 * 1000, // 2 min for participants (more dynamic data)
  });
}

export function useAdminParticipantDetail(participantId: string | null, accessToken?: string) {
  return useQuery({
    queryKey: adminQueryKeys.participantDetail(participantId || ''),
    queryFn: async () => {
      if (!participantId) return null;
      const token = accessToken || await getAccessToken();
      const data = await adminFetch(`/admin/participants/${participantId}`, token);
      return data.registrations || [];
    },
    enabled: !!participantId,
    staleTime: 60 * 1000, // 1 min
  });
}

export function useAdminParticipantAuditLog(participantId: string | null, accessToken?: string) {
  return useQuery({
    queryKey: adminQueryKeys.participantAuditLog(participantId || ''),
    queryFn: async () => {
      if (!participantId) return [];
      const token = accessToken || await getAccessToken();
      const data = await adminFetch(`/admin/participants/${participantId}/audit-log`, token);
      return data.auditLog || [];
    },
    enabled: !!participantId,
    staleTime: 60 * 1000,
  });
}

// ========================================
// ADMIN SESSIONS
// ========================================

export function useAdminSessions(accessToken?: string) {
  return useQuery({
    queryKey: adminQueryKeys.sessions,
    queryFn: async () => {
      const token = accessToken || await getAccessToken();
      const data = await adminFetch('/admin/sessions', token);
      return (data.sessions || []).map((s: any) => ({
        sessionId: s.id,
        sessionName: s.name,
        status: s.status,
        date: s.date,
        endTime: s.endTime,
        registrationStart: s.registrationStart,
        rounds: s.rounds || [],
        organizerId: s.userId,
        organizerName: 'Loading...',
        organizerEmail: '',
        organizerUrlSlug: '',
      }));
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ========================================
// ADMIN BILLING (Subscriptions & Credits)
// ========================================

export function useAdminBilling(userId: string | null, accessToken: string) {
  return useQuery({
    queryKey: adminQueryKeys.billing(userId || ''),
    queryFn: async () => {
      if (!userId) return null;
      const token = accessToken || await getAccessToken();
      const data = await adminFetch(`/admin/users/${userId}/billing`, token);
      return data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useGrantSubscription(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, capacityTier }: { userId: string; capacityTier: string }) => {
      const token = accessToken || await getAccessToken();
      return adminFetch(`/admin/users/${userId}/subscription`, token, {
        method: 'POST',
        body: JSON.stringify({ capacityTier, status: 'active', plan: 'premium' }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing(variables.userId) });
      toast.success('Subscription granted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to grant subscription');
    },
  });
}

export function useCancelAdminSubscription(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const token = accessToken || await getAccessToken();
      return adminFetch(`/admin/users/${userId}/subscription`, token, {
        method: 'DELETE',
      });
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing(userId) });
      toast.success('Subscription cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel subscription');
    },
  });
}

export function useAddCredits(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount, capacityTier }: { userId: string; amount: number; capacityTier: string }) => {
      const token = accessToken || await getAccessToken();
      return adminFetch(`/admin/users/${userId}/credits`, token, {
        method: 'POST',
        body: JSON.stringify({ amount, capacityTier }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing(variables.userId) });
      toast.success(`Added ${variables.amount} credit(s)`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add credits');
    },
  });
}

export function useResetCredits(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const token = accessToken || await getAccessToken();
      return adminFetch(`/admin/users/${userId}/credits/reset`, token, {
        method: 'POST',
      });
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing(userId) });
      toast.success('Credits reset to zero');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset credits');
    },
  });
}

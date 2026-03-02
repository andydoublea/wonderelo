import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiBaseUrl } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

const i18nQueryKeys = {
  languages: ['admin', 'i18n', 'languages'] as const,
  keys: (filters?: { namespace?: string; search?: string }) =>
    ['admin', 'i18n', 'keys', filters] as const,
  namespaces: ['admin', 'i18n', 'namespaces'] as const,
  translations: (lang: string) => ['admin', 'i18n', 'translations', lang] as const,
};

async function adminI18nFetch(path: string, accessToken: string, options?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return response.json();
}

// Languages
export function useAdminLanguages(accessToken: string) {
  return useQuery({
    queryKey: i18nQueryKeys.languages,
    queryFn: () => adminI18nFetch('/admin/i18n/languages', accessToken),
    staleTime: 5 * 60 * 1000,
    enabled: !!accessToken,
  });
}

export function useCreateLanguage(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lang: any) =>
      adminI18nFetch('/admin/i18n/languages', accessToken, {
        method: 'POST',
        body: JSON.stringify(lang),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.languages });
      toast.success('Language added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLanguage(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, ...updates }: any) =>
      adminI18nFetch(`/admin/i18n/languages/${code}`, accessToken, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.languages });
      toast.success('Language updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLanguage(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      adminI18nFetch(`/admin/i18n/languages/${code}`, accessToken, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.languages });
      toast.success('Language deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Namespaces
export function useAdminNamespaces(accessToken: string) {
  return useQuery({
    queryKey: i18nQueryKeys.namespaces,
    queryFn: () => adminI18nFetch('/admin/i18n/namespaces', accessToken),
    staleTime: 5 * 60 * 1000,
    enabled: !!accessToken,
  });
}

// Keys
export function useAdminKeys(accessToken: string, filters?: { namespace?: string; search?: string }) {
  return useQuery({
    queryKey: i18nQueryKeys.keys(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.namespace) params.set('namespace', filters.namespace);
      if (filters?.search) params.set('search', filters.search);
      const qs = params.toString();
      return adminI18nFetch(`/admin/i18n/keys${qs ? `?${qs}` : ''}`, accessToken);
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!accessToken,
  });
}

export function useCreateKey(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: any) =>
      adminI18nFetch('/admin/i18n/keys', accessToken, {
        method: 'POST',
        body: JSON.stringify(key),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'i18n', 'keys'] });
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.namespaces });
      toast.success('Key created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteKey(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminI18nFetch(`/admin/i18n/keys/${id}`, accessToken, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'i18n', 'keys'] });
      toast.success('Key deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Translations
export function useAdminTranslations(accessToken: string, lang: string) {
  return useQuery({
    queryKey: i18nQueryKeys.translations(lang),
    queryFn: () => adminI18nFetch(`/admin/i18n/translations/${lang}`, accessToken),
    staleTime: 1 * 60 * 1000,
    enabled: !!accessToken && !!lang,
  });
}

export function useSaveTranslation(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { key_id: string; language_code: string; translated_text: string; status?: string }) =>
      adminI18nFetch('/admin/i18n/translations', accessToken, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.translations(variables.language_code) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAiTranslate(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { source_lang: string; target_lang: string; target_lang_name: string; key_ids?: string[] }) =>
      adminI18nFetch('/admin/i18n/translate-ai', accessToken, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: i18nQueryKeys.translations(variables.target_lang) });
      toast.success(`AI translated ${result.translated}/${result.total} keys`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// Import/Export
export function useExportTranslations(accessToken: string) {
  return useMutation({
    mutationFn: async (lang: string) => {
      const data = await adminI18nFetch(`/admin/i18n/export/${lang}`, accessToken);
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-${lang}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data;
    },
    onSuccess: () => toast.success('Translations exported'),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useImportTranslations(accessToken: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lang, translations }: { lang: string; translations: Record<string, string> }) =>
      adminI18nFetch(`/admin/i18n/import/${lang}`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ translations }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'i18n'] });
      toast.success(`Imported ${result.imported} translations (${result.skipped} skipped)`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

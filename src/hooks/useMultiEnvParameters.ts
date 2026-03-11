import { useQueries } from '@tanstack/react-query';
import { ENVIRONMENTS, EnvironmentConfig, EnvironmentId } from '../utils/environments';
import { SystemParameters } from '../utils/systemParameters';

export interface EnvParametersResult {
  envId: EnvironmentId;
  data: SystemParameters | null;
  isLoading: boolean;
  isError: boolean;
}

async function fetchEnvParameters(env: EnvironmentConfig): Promise<SystemParameters | null> {
  const timeout = env.id === 'development' ? 3000 : 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(
      `${env.apiBaseUrl}/system-parameters`,
      {
        headers: {
          'Authorization': `Bearer ${env.anonKey}`,
        },
        signal: controller.signal,
      }
    );
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function useMultiEnvParameters(): EnvParametersResult[] {
  const results = useQueries({
    queries: ENVIRONMENTS.map(env => ({
      queryKey: ['env-parameters', env.id],
      queryFn: () => fetchEnvParameters(env),
      staleTime: 30 * 1000,
      retry: env.id === 'development' ? 0 : 1,
      refetchOnWindowFocus: false,
    })),
  });

  return results.map((result, i) => ({
    envId: ENVIRONMENTS[i].id,
    data: result.data ?? null,
    isLoading: result.isLoading,
    isError: result.isError || (result.data === null && !result.isLoading),
  }));
}

import { useState, useCallback } from 'react';
import { debugLog, errorLog } from '../utils/debug';

/**
 * Custom hook for handling API requests with loading, error, and data states
 * Prevents duplication of try/catch/finally patterns across components
 */

interface UseApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

interface UseApiRequestReturn<T, P extends any[]> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API requests with automatic error handling
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading, execute } = useApiRequest(
 *   async (id: string) => {
 *     const response = await fetch(`/api/items/${id}`);
 *     return response.json();
 *   },
 *   {
 *     onSuccess: (data) => toast.success('Loaded successfully'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * );
 * 
 * // Later in your component
 * await execute('123');
 * ```
 */
export function useApiRequest<T, P extends any[] = []>(
  apiFunction: (...args: P) => Promise<T>,
  options?: UseApiRequestOptions<T>
): UseApiRequestReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        debugLog('API Request started:', { args });
        const result = await apiFunction(...args);
        debugLog('API Request successful:', result);
        
        setData(result);
        options?.onSuccess?.(result);
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        errorLog('API Request failed:', error);
        
        setError(error);
        options?.onError?.(error);
        
        return null;
      } finally {
        setIsLoading(false);
        options?.onFinally?.();
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset
  };
}

/**
 * Hook specifically for authenticated fetch requests
 * Automatically handles token and common patterns
 */
interface UseAuthenticatedFetchOptions<T> extends UseApiRequestOptions<T> {
  accessToken: string | null;
}

export function useAuthenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  hookOptions?: UseAuthenticatedFetchOptions<T>
) {
  return useApiRequest(
    async () => {
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      
      if (!hookOptions?.accessToken) {
        throw new Error('No access token available');
      }
      
      const response = await authenticatedFetch(
        endpoint,
        options,
        hookOptions.accessToken
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }
      
      return response.json() as Promise<T>;
    },
    hookOptions
  );
}

/**
 * Hook for simple loading states
 * Useful when you just need loading state without data/error tracking
 * 
 * @example
 * ```tsx
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoadingState();
 * 
 * const handleSubmit = async () => {
 *   await withLoading(async () => {
 *     await saveData();
 *   });
 * };
 * ```
 */
export function useLoadingState(initialState: boolean = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    setIsLoading
  };
}

/**
 * Hook for multiple loading states
 * Useful for components with multiple async operations
 * 
 * @example
 * ```tsx
 * const { loadingStates, setLoading, isAnyLoading } = useMultipleLoadingStates([
 *   'fetching',
 *   'saving',
 *   'deleting'
 * ]);
 * 
 * const handleFetch = async () => {
 *   setLoading('fetching', true);
 *   await fetchData();
 *   setLoading('fetching', false);
 * };
 * ```
 */
export function useMultipleLoadingStates<T extends string>(keys: T[]) {
  const [loadingStates, setLoadingStates] = useState<Record<T, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
  );

  const setLoading = useCallback((key: T, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    loadingStates,
    setLoading,
    isAnyLoading
  };
}

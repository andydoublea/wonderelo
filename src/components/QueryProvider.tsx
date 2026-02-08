import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../utils/queryClient';

/**
 * React Query Provider
 * Wraps the app with QueryClientProvider for data caching
 */

interface QueryProviderProps {
  children: ReactNode;
  /** Show React Query DevTools (default: only in development) */
  showDevTools?: boolean;
  /** DevTools initial open state */
  devToolsInitialIsOpen?: boolean;
  /** DevTools position */
  devToolsPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function QueryProvider({
  children,
  showDevTools,
  devToolsInitialIsOpen = false,
  devToolsPosition = 'bottom-right'
}: QueryProviderProps) {
  // Show devtools only in development by default
  const shouldShowDevTools = showDevTools ?? process.env.NODE_ENV === 'development';

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {shouldShowDevTools && (
        <ReactQueryDevtools
          initialIsOpen={devToolsInitialIsOpen}
          position={devToolsPosition}
          buttonPosition={devToolsPosition}
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Hook to access query client directly
 * Use sparingly - prefer using the query hooks
 */
export { useQueryClient } from '@tanstack/react-query';

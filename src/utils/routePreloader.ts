import { debugLog } from './debug';

/**
 * Route Preloading Utilities
 * Prefetch route components before navigation for faster page loads
 */

// Store for already preloaded routes
const preloadedRoutes = new Set<string>();

// Store for route component loaders
const routeLoaders = new Map<string, () => Promise<any>>();

/**
 * Register a route with its lazy loader
 */
export function registerRoute(path: string, loader: () => Promise<any>): void {
  routeLoaders.set(path, loader);
}

/**
 * Preload a route component
 * @param path - Route path to preload
 * @returns Promise that resolves when component is loaded
 */
export async function preloadRoute(path: string): Promise<void> {
  // Don't preload if already preloaded
  if (preloadedRoutes.has(path)) {
    debugLog(`Route already preloaded: ${path}`);
    return;
  }

  const loader = routeLoaders.get(path);
  
  if (!loader) {
    debugLog(`No loader registered for route: ${path}`);
    return;
  }

  try {
    debugLog(`Preloading route: ${path}`);
    await loader();
    preloadedRoutes.add(path);
    debugLog(`Route preloaded successfully: ${path}`);
  } catch (error) {
    console.error(`Failed to preload route: ${path}`, error);
  }
}

/**
 * Preload multiple routes
 */
export async function preloadRoutes(paths: string[]): Promise<void> {
  await Promise.all(paths.map(path => preloadRoute(path)));
}

/**
 * Check if route is preloaded
 */
export function isRoutePreloaded(path: string): boolean {
  return preloadedRoutes.has(path);
}

/**
 * Clear preload cache (useful for testing)
 */
export function clearPreloadCache(): void {
  preloadedRoutes.clear();
  debugLog('Preload cache cleared');
}

/**
 * Prefetch route on hover (for links)
 */
export function createPrefetchHandler(path: string) {
  let timeoutId: NodeJS.Timeout;

  return {
    onMouseEnter: () => {
      // Delay prefetch slightly to avoid unnecessary loads on quick hover
      timeoutId = setTimeout(() => {
        preloadRoute(path);
      }, 100);
    },
    onMouseLeave: () => {
      clearTimeout(timeoutId);
    },
    onTouchStart: () => {
      // Prefetch immediately on touch devices
      preloadRoute(path);
    }
  };
}

/**
 * Prefetch route on visibility (for components)
 */
export function usePrefetchOnVisible(path: string, ref: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadRoute(path);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [path, ref]);
}

/**
 * Prefetch routes based on current route
 * Useful for prefetching likely next pages
 */
export function prefetchRelatedRoutes(currentPath: string): void {
  // Define related routes for each path
  const relatedRoutes: Record<string, string[]> = {
    '/': ['/dashboard', '/signin'],
    '/dashboard': ['/sessions', '/participants', '/settings'],
    '/sessions': ['/sessions/new', '/dashboard'],
    '/participants': ['/participants/import', '/dashboard'],
    // Add more as needed
  };

  const routes = relatedRoutes[currentPath];
  
  if (routes) {
    // Prefetch after a short delay
    setTimeout(() => {
      preloadRoutes(routes);
    }, 1000);
  }
}

/**
 * Hook for prefetching on mount
 */
export function usePrefetchRoutes(paths: string[]) {
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      preloadRoutes(paths);
    }, 500); // Wait a bit to not interfere with initial render

    return () => clearTimeout(timeoutId);
  }, [paths]);
}

/**
 * Preload critical routes on app load
 */
export function preloadCriticalRoutes(): void {
  const criticalRoutes = [
    '/dashboard',
    '/sessions',
    '/participants'
  ];

  // Preload after app has settled
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      setTimeout(() => preloadRoutes(criticalRoutes), 2000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => preloadRoutes(criticalRoutes), 2000);
      });
    }
  }
}

/**
 * Get preload stats
 */
export function getPreloadStats() {
  return {
    totalRegistered: routeLoaders.size,
    totalPreloaded: preloadedRoutes.size,
    preloadedRoutes: Array.from(preloadedRoutes),
    registeredRoutes: Array.from(routeLoaders.keys())
  };
}

// Import React for hooks
import * as React from 'react';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hooks for debouncing and throttling
 * Useful for performance optimization
 */

/**
 * Hook for debouncing a value
 * Updates value only after specified delay has passed without changes
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This will only run 500ms after user stops typing
 *   fetchSearchResults(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * 
 * return (
 *   <Input 
 *     value={searchTerm} 
 *     onChange={(e) => setSearchTerm(e.target.value)} 
 *   />
 * );
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debouncing a callback function
 * 
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallback(
 *   (searchTerm: string) => {
 *     fetchSearchResults(searchTerm);
 *   },
 *   500
 * );
 * 
 * return (
 *   <Input 
 *     onChange={(e) => handleSearch(e.target.value)} 
 *   />
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Hook for throttling a callback function
 * Limits how often a function can be called
 * 
 * @example
 * ```tsx
 * const handleScroll = useThrottledCallback(
 *   () => {
 *     console.log('Scroll position:', window.scrollY);
 *   },
 *   200
 * );
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 * ```
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastRun.current = Date.now();
          },
          delay - timeSinceLastRun
        );
      }
    },
    [callback, delay]
  );
}

/**
 * Hook for throttling a value
 * Updates value at most once per specified interval
 * 
 * @example
 * ```tsx
 * const [scrollY, setScrollY] = useState(0);
 * const throttledScrollY = useThrottle(scrollY, 200);
 * 
 * useEffect(() => {
 *   const handleScroll = () => setScrollY(window.scrollY);
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, []);
 * ```
 */
export function useThrottle<T>(value: T, delay: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecuted = now - lastExecuted.current;

    if (timeSinceLastExecuted >= delay) {
      setThrottledValue(value);
      lastExecuted.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(
        () => {
          setThrottledValue(value);
          lastExecuted.current = Date.now();
        },
        delay - timeSinceLastExecuted
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook for debouncing with immediate execution option
 * Can execute immediately on first call and then debounce
 * 
 * @example
 * ```tsx
 * const handleSearch = useDebouncedCallbackImmediate(
 *   (searchTerm: string) => {
 *     fetchSearchResults(searchTerm);
 *   },
 *   500,
 *   true // Execute immediately on first call
 * );
 * ```
 */
export function useDebouncedCallbackImmediate<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isImmediate = useRef(immediate);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const callNow = isImmediate.current && !timeoutRef.current;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        if (!isImmediate.current) {
          callback(...args);
        }
      }, delay);

      if (callNow) {
        callback(...args);
      }
    },
    [callback, delay]
  );
}

/**
 * Hook for async debouncing
 * Handles promises and cancels pending requests
 * 
 * @example
 * ```tsx
 * const debouncedFetch = useAsyncDebounce(
 *   async (query: string) => {
 *     const response = await fetch(`/api/search?q=${query}`);
 *     return response.json();
 *   },
 *   500
 * );
 * 
 * const handleSearch = async (query: string) => {
 *   const results = await debouncedFetch(query);
 *   setResults(results);
 * };
 * ```
 */
export function useAsyncDebounce<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingPromiseRef = useRef<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingPromiseRef.current) {
        pendingPromiseRef.current.reject('Cancelled');
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      return new Promise<ReturnType<T> | null>((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        if (pendingPromiseRef.current) {
          pendingPromiseRef.current.reject('Cancelled');
        }

        pendingPromiseRef.current = { resolve, reject };

        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callback(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromiseRef.current = undefined;
          }
        }, delay);
      });
    },
    [callback, delay]
  );
}

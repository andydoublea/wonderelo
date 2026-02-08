import { useRef, useEffect, DependencyList, useMemo, useCallback } from 'react';
import { debugLog } from '../utils/debug';

/**
 * Advanced memoization hooks for performance optimization
 */

/**
 * Deep comparison hook for objects/arrays
 * Only re-render when deep equality changes
 * 
 * @example
 * ```tsx
 * const memoizedUser = useDeepCompareMemo(() => user, [user]);
 * ```
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<DependencyList>();
  
  if (!ref.current || !deepEqual(ref.current, deps)) {
    ref.current = deps;
  }
  
  return useMemo(factory, ref.current);
}

/**
 * Deep comparison callback hook
 */
export function useDeepCompareCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const ref = useRef<DependencyList>();
  
  if (!ref.current || !deepEqual(ref.current, deps)) {
    ref.current = deps;
  }
  
  return useCallback(callback, ref.current);
}

/**
 * Deep comparison effect hook
 */
export function useDeepCompareEffect(
  effect: React.EffectCallback,
  deps: DependencyList
): void {
  const ref = useRef<DependencyList>();
  
  if (!ref.current || !deepEqual(ref.current, deps)) {
    ref.current = deps;
  }
  
  useEffect(effect, ref.current);
}

/**
 * Memoize expensive calculations
 * Caches results based on input parameters
 * 
 * @example
 * ```tsx
 * const expensiveValue = useMemoizedValue(
 *   calculateExpensiveValue,
 *   [data]
 * );
 * ```
 */
export function useMemoizedValue<T, P extends any[]>(
  fn: (...args: P) => T,
  deps: DependencyList
): T {
  return useMemo(() => fn(...(deps as P)), deps);
}

/**
 * Memoize with custom comparison function
 * 
 * @example
 * ```tsx
 * const memoized = useMemoCompare(
 *   () => expensiveCalc(user),
 *   user,
 *   (prev, next) => prev?.id === next?.id
 * );
 * ```
 */
export function useMemoCompare<T, D>(
  factory: () => T,
  dependency: D,
  compare: (prev: D | undefined, next: D) => boolean
): T {
  const ref = useRef<{ dependency: D; value: T }>();
  
  if (!ref.current || !compare(ref.current.dependency, dependency)) {
    ref.current = {
      dependency,
      value: factory()
    };
  }
  
  return ref.current.value;
}

/**
 * Prevent unnecessary re-renders with stable reference
 * Returns same reference until dependencies change
 */
export function useStableValue<T>(value: T, deps: DependencyList): T {
  const ref = useRef<T>(value);
  
  useEffect(() => {
    ref.current = value;
  }, deps);
  
  return ref.current;
}

/**
 * Memoize async function results
 * Caches promise results to avoid duplicate async operations
 */
export function useAsyncMemo<T>(
  factory: () => Promise<T>,
  deps: DependencyList,
  initial?: T
): T | undefined {
  const [value, setValue] = React.useState<T | undefined>(initial);
  
  useEffect(() => {
    let cancelled = false;
    
    factory().then(result => {
      if (!cancelled) {
        setValue(result);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return value;
}

/**
 * Memoize component props
 * Useful for optimizing component that receive many props
 */
export function useMemoizedProps<T extends Record<string, any>>(props: T): T {
  return useMemo(() => props, Object.values(props));
}

/**
 * Cache function results with LRU cache
 * Useful for expensive calculations with repeated inputs
 */
export function useMemoizedFunction<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  maxSize: number = 10
): (...args: Args) => Result {
  const cache = useRef(new Map<string, Result>());
  const keys = useRef<string[]>([]);
  
  return useCallback((...args: Args) => {
    const key = JSON.stringify(args);
    
    // Check cache
    if (cache.current.has(key)) {
      debugLog('Cache hit for:', key);
      return cache.current.get(key)!;
    }
    
    // Calculate new result
    const result = fn(...args);
    
    // Add to cache
    cache.current.set(key, result);
    keys.current.push(key);
    
    // Evict oldest if cache is full (LRU)
    if (keys.current.length > maxSize) {
      const oldestKey = keys.current.shift()!;
      cache.current.delete(oldestKey);
    }
    
    return result;
  }, [fn, maxSize]);
}

/**
 * Prevent function from being recreated unless dependencies change
 * Better than useCallback for complex dependencies
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

/**
 * Track render count (for debugging performance)
 */
export function useRenderCount(componentName?: string): number {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (componentName) {
      debugLog(`${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
}

/**
 * Log when component re-renders and why
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  const previousProps = useRef<Record<string, any>>();
  
  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};
      
      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });
      
      if (Object.keys(changedProps).length > 0) {
        debugLog(`[${name}] Re-rendered due to:`, changedProps);
      }
    }
    
    previousProps.current = props;
  });
}

/**
 * Simple deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create memoized selector
 * Useful for deriving state from props/state
 */
export function createSelector<Input, Output>(
  selector: (input: Input) => Output
): (input: Input) => Output {
  let lastInput: Input | undefined;
  let lastOutput: Output | undefined;
  
  return (input: Input) => {
    if (lastInput !== undefined && deepEqual(lastInput, input)) {
      return lastOutput!;
    }
    
    lastInput = input;
    lastOutput = selector(input);
    return lastOutput;
  };
}

/**
 * Use selector hook
 */
export function useSelector<Input, Output>(
  input: Input,
  selector: (input: Input) => Output
): Output {
  const selectorRef = useRef(createSelector(selector));
  return selectorRef.current(input);
}

// Import React for hooks
import * as React from 'react';

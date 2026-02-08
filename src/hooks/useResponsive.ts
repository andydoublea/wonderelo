import { useState, useEffect } from 'react';

/**
 * Custom hooks for responsive design
 * Provides utilities for handling different screen sizes
 */

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * Hook for checking if viewport is at or above a breakpoint
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * 
 * return isMobile ? <MobileView /> : <DesktopView />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Hook for getting current breakpoint
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * 
 * return (
 *   <div>
 *     Current breakpoint: {breakpoint}
 *     {breakpoint === 'sm' && <MobileMenu />}
 *     {breakpoint === 'lg' && <DesktopMenu />}
 *   </div>
 * );
 * ```
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xl');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < breakpoints.sm) {
        setBreakpoint('xs');
      } else if (width < breakpoints.md) {
        setBreakpoint('sm');
      } else if (width < breakpoints.lg) {
        setBreakpoint('md');
      } else if (width < breakpoints.xl) {
        setBreakpoint('lg');
      } else if (width < breakpoints['2xl']) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

/**
 * Hook for checking if viewport is mobile size
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * 
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 */
export function useIsMobile(breakpoint: number = breakpoints.md): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

/**
 * Hook for checking if viewport is tablet size
 */
export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isBelowDesktop = useMediaQuery(`(max-width: ${breakpoints.lg - 1}px)`);
  return isAboveMobile && isBelowDesktop;
}

/**
 * Hook for checking if viewport is desktop size
 */
export function useIsDesktop(breakpoint: number = breakpoints.lg): boolean {
  return useMediaQuery(`(min-width: ${breakpoint}px)`);
}

/**
 * Hook for getting viewport dimensions
 * 
 * @example
 * ```tsx
 * const { width, height } = useViewportSize();
 * 
 * return <div>Viewport: {width}x{height}</div>;
 * ```
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook for responsive value selection based on breakpoint
 * 
 * @example
 * ```tsx
 * const columns = useResponsiveValue({
 *   xs: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4
 * });
 * 
 * return <Grid columns={columns}>...</Grid>;
 * ```
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const breakpoint = useBreakpoint();
  
  // Return value for current breakpoint or closest smaller breakpoint
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
}

/**
 * Hook for checking device orientation
 * 
 * @example
 * ```tsx
 * const orientation = useOrientation();
 * 
 * return orientation === 'portrait' ? <PortraitView /> : <LandscapeView />;
 * ```
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

/**
 * Hook for detecting touch device
 * 
 * @example
 * ```tsx
 * const isTouchDevice = useIsTouchDevice();
 * 
 * return isTouchDevice ? <TouchControls /> : <MouseControls />;
 * ```
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

/**
 * Hook for checking if device is in standalone mode (PWA)
 */
export function useIsStandalone(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  return isStandalone;
}

/**
 * Responsive utility helpers
 */
export const ResponsiveHelpers = {
  /**
   * Check if current breakpoint is at or above target
   */
  isBreakpointOrAbove: (current: Breakpoint, target: Breakpoint): boolean => {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    return order.indexOf(current) >= order.indexOf(target);
  },

  /**
   * Check if current breakpoint is below target
   */
  isBreakpointBelow: (current: Breakpoint, target: Breakpoint): boolean => {
    const order: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    return order.indexOf(current) < order.indexOf(target);
  },

  /**
   * Get breakpoint name from width
   */
  getBreakpointFromWidth: (width: number): Breakpoint => {
    if (width < breakpoints.sm) return 'xs';
    if (width < breakpoints.md) return 'sm';
    if (width < breakpoints.lg) return 'md';
    if (width < breakpoints.xl) return 'lg';
    if (width < breakpoints['2xl']) return 'xl';
    return '2xl';
  }
};

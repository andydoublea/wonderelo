import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { trackPageView, trackClick, trackAction, trackError, trackFunnelStep } from '../utils/analytics';

/**
 * React hook for analytics tracking
 * Automatically tracks page views and provides convenience methods
 */
export function useAnalytics() {
  const location = useLocation();

  // Track page view on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return {
    trackClick: useCallback((elementName: string, metadata?: Record<string, any>) => {
      trackClick(elementName, metadata);
    }, []),

    trackAction: useCallback((action: string, category?: string, metadata?: Record<string, any>) => {
      trackAction(action, category, metadata);
    }, []),

    trackError: useCallback((errorMessage: string, context?: string, metadata?: Record<string, any>) => {
      trackError(errorMessage, context, metadata);
    }, []),

    trackFunnelStep: useCallback((step: string, metadata?: Record<string, any>) => {
      trackFunnelStep(step, metadata);
    }, []),
  };
}

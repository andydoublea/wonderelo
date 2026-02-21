import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { trackPageView } from '../utils/analytics';

/**
 * Silent component that tracks page views on route changes.
 * Place inside a <BrowserRouter> to enable automatic page tracking.
 */
export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}

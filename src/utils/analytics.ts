/**
 * Application-wide analytics and logging system
 * Tracks: clicks, page views, state changes, feature usage, errors
 * Sends events in batches to minimize network requests
 */

import { debugLog, errorLog } from './debug';
import { apiBaseUrl, publicAnonKey } from './supabase/info';

interface AnalyticsEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  page: string;
  userId?: string;
  sessionId?: string;
}

// Generate a unique session ID for this browser session
const analyticsSessionId = `as_${Date.now()}_${Math.random().toString(36).substring(7)}`;

// ==========================================
// CRM Visitor Tracking
// ==========================================

const VISITOR_COOKIE = '_wnd_vid';
const UTM_STORAGE_KEY = '_wnd_utm';

/** Get or create a persistent visitor ID */
function getVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_COOKIE);
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(VISITOR_COOKIE, vid);
    }
    return vid;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}

/** Capture UTM parameters from URL on page load */
function captureUtmParams(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
    if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
    if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
    if (Object.keys(utm).length > 0) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
      return utm;
    }
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

let lastPageViewTime = Date.now();

/** Track a CRM page visit (separate from analytics events) */
function trackCrmVisit() {
  const now = Date.now();
  const durationSeconds = Math.round((now - lastPageViewTime) / 1000);
  lastPageViewTime = now;

  const visitorId = getVisitorId();
  const utm = captureUtmParams();

  // Fire and forget — don't block the UI
  fetch(`${apiBaseUrl}/crm/track`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      visitor_id: visitorId,
      page_url: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || undefined,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      duration_seconds: durationSeconds > 0 && durationSeconds < 3600 ? durationSeconds : undefined,
      session_id: analyticsSessionId,
    }),
  }).catch(() => {});
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 30000; // 30 seconds
const MAX_QUEUE_SIZE = 20;

/**
 * Get user ID from available sources
 */
function getUserId(): string | undefined {
  try {
    // Try participant token first
    const participantToken = localStorage.getItem('participant_token');
    if (participantToken) return `p_${participantToken.substring(0, 8)}`;

    // Try organizer session
    const orgToken = localStorage.getItem('supabase_access_token');
    if (orgToken) return `o_${orgToken.substring(0, 8)}`;

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Queue an analytics event for batched sending
 */
function queueEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'page' | 'sessionId'>) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    sessionId: analyticsSessionId,
    userId: event.userId || getUserId(),
  };

  eventQueue.push(fullEvent);
  debugLog('[Analytics] Event queued:', fullEvent.type, fullEvent.action);

  // Flush if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushEvents();
  }

  // Set up periodic flush
  if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
  }
}

/**
 * Send queued events to the backend
 */
async function flushEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    const response = await fetch(
      `${apiBaseUrl}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      }
    );

    if (!response.ok) {
      debugLog('[Analytics] Failed to send events:', response.status);
      // Re-queue failed events (but don't exceed max)
      eventQueue = [...eventsToSend.slice(-10), ...eventQueue].slice(0, MAX_QUEUE_SIZE);
    } else {
      debugLog(`[Analytics] Sent ${eventsToSend.length} events`);
    }
  } catch (err) {
    debugLog('[Analytics] Error sending events:', err);
    // Re-queue on network error
    eventQueue = [...eventsToSend.slice(-10), ...eventQueue].slice(0, MAX_QUEUE_SIZE);
  }
}

// Flush events before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliable delivery during unload
      const blob = new Blob(
        [JSON.stringify({ events: eventQueue })],
        { type: 'application/json' }
      );
      navigator.sendBeacon(
        `${apiBaseUrl}/events`,
        blob
      );
    }
  });
}

// ==========================================
// Public API
// ==========================================

/**
 * Track a page view
 */
export function trackPageView(pageName?: string) {
  queueEvent({
    type: 'pageview',
    category: 'navigation',
    action: 'view',
    label: pageName || window.location.pathname,
  });
  // Also track in CRM website visits
  trackCrmVisit();
}

/**
 * Track a button/element click
 */
export function trackClick(elementName: string, metadata?: Record<string, any>) {
  queueEvent({
    type: 'click',
    category: 'interaction',
    action: 'click',
    label: elementName,
    metadata,
  });
}

/**
 * Track a specific action/feature usage
 */
export function trackAction(action: string, category: string = 'feature', metadata?: Record<string, any>) {
  queueEvent({
    type: 'action',
    category,
    action,
    metadata,
  });
}

/**
 * Track a state change
 */
export function trackStateChange(fromState: string, toState: string, context?: string) {
  queueEvent({
    type: 'state_change',
    category: 'state',
    action: `${fromState} → ${toState}`,
    label: context,
  });
}

/**
 * Track an error
 */
export function trackError(errorMessage: string, context?: string, metadata?: Record<string, any>) {
  queueEvent({
    type: 'error',
    category: 'error',
    action: errorMessage,
    label: context,
    metadata,
  });
}

/**
 * Track registration funnel step
 */
export function trackFunnelStep(step: string, metadata?: Record<string, any>) {
  queueEvent({
    type: 'funnel',
    category: 'registration',
    action: step,
    metadata,
  });
}

/**
 * Force flush all queued events immediately
 */
export function flushAnalytics() {
  return flushEvents();
}

/**
 * Identify a visitor by email (call on login, signup, lead form submit).
 * Links all anonymous website visits from this visitor to their CRM contact.
 */
export function identifyVisitor(email: string) {
  const visitorId = getVisitorId();
  fetch(`${apiBaseUrl}/crm/track`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      visitor_id: visitorId,
      page_url: window.location.pathname,
      page_title: document.title,
      session_id: analyticsSessionId,
      // Signal the backend to link this visitor to a contact
      metadata: { identify_email: email },
    }),
  }).catch(() => {});
}

/**
 * Get the current visitor ID (for external use)
 */
export function getAnalyticsVisitorId(): string {
  return getVisitorId();
}

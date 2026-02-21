import { projectId, publicAnonKey } from './supabase/info';
import { errorLog } from './debug';

export interface SystemParameters {
  // Round timing
  confirmationWindowMinutes: number;
  safetyWindowMinutes: number;
  walkingTimeMinutes: number;
  notificationEarlyMinutes: number;
  notificationEarlyEnabled: boolean;
  notificationLateMinutes: number;
  notificationLateEnabled: boolean;
  
  // Validation constraints
  minimalGapBetweenRounds: number;
  minimalRoundDuration: number;
  maximalRoundDuration: number;
  minimalTimeToFirstRound: number;
  
  // Finding time
  findingTimeMinutes: number;

  // Networking duration (shown in "How it works" text)
  networkingDurationMinutes: number;

  // Popularity indicators (🔥 thresholds)
  fireThreshold1: number;
  fireThreshold2: number;
  fireThreshold3: number;

  // Default values
  defaultRoundDuration: number;
  defaultGapBetweenRounds: number;
  defaultNumberOfRounds: number;
  defaultMaxParticipants: number;
  defaultGroupSize: number;
  defaultLimitParticipants: boolean;
  defaultLimitGroups: boolean;
}

// Cache for system parameters
let cachedParameters: SystemParameters | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

// Default parameters (fallback)
const DEFAULT_PARAMETERS: SystemParameters = {
  confirmationWindowMinutes: 5,
  safetyWindowMinutes: 6,
  walkingTimeMinutes: 3,
  notificationEarlyMinutes: 10,
  notificationEarlyEnabled: true,
  notificationLateMinutes: 5,
  notificationLateEnabled: true,
  
  minimalGapBetweenRounds: 10,
  minimalRoundDuration: 5,
  maximalRoundDuration: 240,
  minimalTimeToFirstRound: 10,

  findingTimeMinutes: 1,

  networkingDurationMinutes: 15,

  fireThreshold1: 5,
  fireThreshold2: 10,
  fireThreshold3: 15,

  defaultRoundDuration: 10,
  defaultGapBetweenRounds: 10,
  defaultNumberOfRounds: 1,
  defaultMaxParticipants: 20,
  defaultGroupSize: 2,
  defaultLimitParticipants: false,
  defaultLimitGroups: false,
};

/**
 * Fetch system parameters from the server
 * Caches the result for 1 minute to avoid excessive API calls
 */
export const fetchSystemParameters = async (): Promise<SystemParameters> => {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedParameters && (now - lastFetchTime) < CACHE_TTL) {
    return cachedParameters;
  }
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/system-parameters`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch system parameters');
    }
    
    const data = await response.json();
    cachedParameters = data;
    lastFetchTime = now;
    
    return data;
  } catch (error) {
    errorLog('Error fetching system parameters, using defaults:', error);
    return DEFAULT_PARAMETERS;
  }
};

/**
 * Get cached system parameters synchronously
 * Returns null if not yet loaded
 */
export const getCachedParameters = (): SystemParameters | null => {
  return cachedParameters;
};

/**
 * Get system parameters synchronously with default fallback
 * Merges cached values with defaults so new fields always have values
 */
export const getParametersOrDefault = (): SystemParameters => {
  if (!cachedParameters) return DEFAULT_PARAMETERS;
  return { ...DEFAULT_PARAMETERS, ...cachedParameters };
};
import { useParticipantStore } from '../stores';
import { debugLog } from './debug';

/**
 * Organizer and participant are mutually exclusive auth contexts that share the
 * same browser storage. Logging into one must log the user out of the other.
 *
 * Organizer logout is handled by AppRouter's handleSignOut (it owns the Supabase
 * session + React auth state). This module owns the participant side: clearing
 * the token, every token-keyed cache, and the persisted participant store.
 */

const PARTICIPANT_KEY_PREFIXES = [
  'participant_profile_',
  'participant_round_',
  'participant_dashboard_',
  't0_redirect_',
  'no_match_shown_',
  'matched_shown_',
];

const PARTICIPANT_EXACT_KEYS = [
  'participant_token',
  'oliwonder-participant-storage',
];

/**
 * Wipe all participant session state. Call this when an organizer signs in so a
 * leftover participant token can't keep the user "logged in" as a participant.
 */
export function clearParticipantSession(): void {
  // Reset the store FIRST: the zustand persist middleware writes
  // 'oliwonder-participant-storage' synchronously on reset(), so removing the
  // key afterwards is what actually clears it for good.
  useParticipantStore.getState().reset();

  const keysToRemove: string[] = [...PARTICIPANT_EXACT_KEYS];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && PARTICIPANT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));

  debugLog('🔄 Participant session cleared (organizer signed in)');
}

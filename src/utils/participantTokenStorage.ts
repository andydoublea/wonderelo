/**
 * Helpers for managing participant_token + the per-token side-data we cache.
 *
 * Without this, logging out (or rotating tokens) leaves orphan entries in
 * localStorage:
 *   participant_dashboard_<oldToken>     (cached dashboard data)
 *   no_match_shown_<oldToken>_<roundId>  (one-time-redirect flag)
 *   matched_shown_<oldToken>_<roundId>   (one-time-redirect flag)
 *
 * Old flags then prevent legitimate auto-redirects after the user logs back in
 * with a new token (different participantId would pollute), and the cached
 * dashboard hangs around forever.
 */

const TOKEN_KEY = 'participant_token';

/**
 * Remove the participant token AND every cached/derived entry for it.
 * Safe to call when localStorage is unavailable (no-throw).
 */
export function clearParticipantTokenAndDerivedData(token?: string | null) {
  try {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (!t) return;

    // Cached dashboard payload
    localStorage.removeItem(`participant_dashboard_${t}`);

    // Per-round one-time-shown flags. We don't know which roundIds existed,
    // so iterate keys and match the known prefixes scoped to this token.
    const prefixes = [
      `no_match_shown_${t}_`,
      `matched_shown_${t}_`,
    ];
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (prefixes.some(p => key.startsWith(p))) toRemove.push(key);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // localStorage may be disabled or quota-exceeded; nothing actionable here.
  }
}

/**
 * Set a new participant token. If the new token differs from the current one,
 * scrub side-data for the OLD token so flags don't leak across identities.
 */
export function setParticipantToken(newToken: string) {
  try {
    const previous = localStorage.getItem(TOKEN_KEY);
    if (previous && previous !== newToken) {
      clearParticipantTokenAndDerivedData(previous);
    }
    localStorage.setItem(TOKEN_KEY, newToken);
  } catch {
    // localStorage unavailable — non-fatal for the registration flow.
  }
}

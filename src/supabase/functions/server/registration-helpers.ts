/**
 * Pure helper functions for participant registration.
 * Kept free of Deno-specific imports so they can be unit-tested via vitest.
 */

export interface AutoConfirmDecision {
  status: 'registered' | 'confirmed';
  confirmedAt?: string;
}

/**
 * Decide whether an incoming registration should be auto-confirmed.
 *
 * Auto-confirm fires when the registration arrives during the confirmation
 * window — i.e. between `roundStart - confirmationWindowMinutes` and `roundStart`.
 *
 * Before that window: status stays 'registered' (participant will be asked to
 *   confirm separately when the window opens).
 * At or after round start: status stays 'registered' — the matching algorithm
 *   has already run; the registration won't be included in matching anyway.
 */
export function decideRegistrationStatus(
  roundStart: Date,
  now: Date,
  confirmationWindowMinutes: number,
): AutoConfirmDecision {
  const confirmationStart = new Date(
    roundStart.getTime() - confirmationWindowMinutes * 60_000,
  );
  if (now >= confirmationStart && now < roundStart) {
    return { status: 'confirmed', confirmedAt: now.toISOString() };
  }
  return { status: 'registered' };
}

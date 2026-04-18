/**
 * Round phase computation utilities
 *
 * Used by RoundItem to determine what to display for each round based on current time.
 * Kept as pure functions for easy unit testing.
 */

export type CountdownPhase =
  | 'before-confirmation'
  | 'confirmation-window'
  | 'matching'
  | 'walking'
  | 'networking'
  | 'completed';

export interface RoundPhaseInput {
  isRegistered: boolean;
  sessionDate?: string | null;
  roundDate?: string | null;
  roundStartTime?: string | null;
  participantStatus?: string | null;
  now: Date;
}

/**
 * Compute the INITIAL round phase for first render (before system parameters load).
 *
 * IMPORTANT: This function NEVER returns 'confirmation-window' — only 'before-confirmation'
 * or 'matching'. The 'confirmation-window' phase requires knowing the configured
 * confirmationWindowMinutes from the server, which isn't guaranteed to be loaded yet.
 * If this function returned 'confirmation-window' based on default params (5 min) but
 * server has different value (e.g. 1 min), the Confirm button would flash briefly on
 * first render before useEffect corrects the phase.
 *
 * The useEffect in RoundItem (which runs after mount and has fresh params) is responsible
 * for transitioning to 'confirmation-window' when appropriate.
 */
export function computeInitialRoundPhase(input: RoundPhaseInput): CountdownPhase {
  const { isRegistered, sessionDate, roundDate, roundStartTime, participantStatus, now } = input;

  if (!isRegistered || !sessionDate || !roundStartTime || roundStartTime === 'To be set' || roundStartTime === 'TBD') {
    return 'before-confirmation';
  }
  if (participantStatus === 'unconfirmed') {
    return 'before-confirmation';
  }

  try {
    const [h, m] = roundStartTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return 'before-confirmation';

    const rs = new Date(roundDate || sessionDate);
    if (isNaN(rs.getTime())) return 'before-confirmation';
    rs.setHours(h, m, 0, 0);

    if (now >= rs) return 'matching'; // Past T-0 — show matching spinner
    return 'before-confirmation'; // Before T-0 — safe default (no button flash)
  } catch {
    return 'before-confirmation';
  }
}

export interface ConfirmButtonVisibilityInput {
  countdownPhase: CountdownPhase;
  participantStatus?: string | null;
  hasFreshData: boolean;
  isConfirming: boolean;
  lastConfirmTimestamp?: number;
  now: Date;
  // For guard: verify we're still in confirmation window
  sessionDate?: string | null;
  roundDate?: string | null;
  roundStartTime?: string | null;
  confirmationWindowMinutes: number;
}

/**
 * Determine if the Confirm Attendance button should be visible.
 *
 * All conditions must be true:
 * - In confirmation window phase (set by useEffect after fresh data)
 * - Actually in confirmation window by current clock (guard against stale phase)
 * - Fresh data has been loaded (prevents flash from cached data)
 * - Participant status is 'registered'
 * - Not currently submitting a confirm action
 * - No recent confirm (prevents button flash during optimistic update)
 */
export function shouldShowConfirmButton(input: ConfirmButtonVisibilityInput): boolean {
  const {
    countdownPhase,
    participantStatus,
    hasFreshData,
    isConfirming,
    lastConfirmTimestamp,
    now,
    sessionDate,
    roundDate,
    roundStartTime,
    confirmationWindowMinutes,
  } = input;

  if (countdownPhase !== 'confirmation-window') return false;
  if (!hasFreshData) return false;
  if (participantStatus !== 'registered') return false;
  if (isConfirming) return false;

  // Skip during brief window after clicking confirm (optimistic update)
  const timeSinceLastConfirm = lastConfirmTimestamp ? Date.now() - lastConfirmTimestamp : Infinity;
  if (timeSinceLastConfirm < 5000) return false;

  // Actual time guard: verify we're in the confirmation window right now
  if (!sessionDate || !roundStartTime) return false;
  try {
    const [h, m] = roundStartTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;

    const rs = new Date(roundDate || sessionDate);
    if (isNaN(rs.getTime())) return false;
    rs.setHours(h, m, 0, 0);

    const confirmationStart = new Date(rs.getTime() - confirmationWindowMinutes * 60 * 1000);
    if (now < confirmationStart) return false;
    if (now >= rs) return false;
  } catch {
    return false;
  }

  return true;
}

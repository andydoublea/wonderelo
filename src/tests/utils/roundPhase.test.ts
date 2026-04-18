/**
 * Unit tests for round phase computation.
 *
 * The main concern: the Confirm Attendance button should NOT flash on initial render
 * for a freshly-registered round that's in the future.
 */

import { describe, it, expect } from 'vitest';
import {
  computeInitialRoundPhase,
  shouldShowConfirmButton,
  type RoundPhaseInput,
  type ConfirmButtonVisibilityInput,
} from '../../utils/roundPhase';

const TODAY = '2026-04-18';
const baseInput: RoundPhaseInput = {
  isRegistered: true,
  sessionDate: TODAY,
  roundDate: TODAY,
  roundStartTime: '20:00',
  participantStatus: 'registered',
  now: new Date('2026-04-18T18:00:00'),
};

describe('computeInitialRoundPhase', () => {
  describe('regression: Confirm button flash', () => {
    it('NEVER returns "confirmation-window" — only useEffect may set that phase', () => {
      // Scenario: user registers for a round starting in 3 minutes
      // Default confirmationWindowMinutes (5) would wrongly trigger 'confirmation-window'
      // Fix: initial phase always returns 'before-confirmation' for future rounds
      const now = new Date('2026-04-18T19:57:00'); // 3 min before round
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for round 1 minute in future (edge case)', () => {
      const now = new Date('2026-04-18T19:59:00'); // 1 min before round
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for round 4 minutes in future', () => {
      const now = new Date('2026-04-18T19:56:00');
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('before-confirmation');
    });

    it('returns "before-confirmation" even when well inside confirmation window', () => {
      // Even if we're 1 second before T-0, initial phase is conservative
      // (useEffect will upgrade to 'confirmation-window')
      const now = new Date('2026-04-18T19:59:59');
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('before-confirmation');
    });
  });

  describe('T-0 boundary', () => {
    it('returns "matching" exactly at T-0', () => {
      const now = new Date('2026-04-18T20:00:00');
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('matching');
    });

    it('returns "matching" after T-0', () => {
      const now = new Date('2026-04-18T20:05:00');
      const phase = computeInitialRoundPhase({ ...baseInput, now });
      expect(phase).toBe('matching');
    });
  });

  describe('defensive returns', () => {
    it('returns "before-confirmation" when not registered', () => {
      expect(computeInitialRoundPhase({ ...baseInput, isRegistered: false })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" when session.date missing', () => {
      expect(computeInitialRoundPhase({ ...baseInput, sessionDate: null })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" when round.startTime missing', () => {
      expect(computeInitialRoundPhase({ ...baseInput, roundStartTime: null })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for "To be set" placeholder', () => {
      expect(computeInitialRoundPhase({ ...baseInput, roundStartTime: 'To be set' })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for "TBD" placeholder', () => {
      expect(computeInitialRoundPhase({ ...baseInput, roundStartTime: 'TBD' })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for unconfirmed participant', () => {
      expect(computeInitialRoundPhase({ ...baseInput, participantStatus: 'unconfirmed' })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for invalid date', () => {
      expect(computeInitialRoundPhase({ ...baseInput, sessionDate: 'not-a-date', roundDate: null })).toBe('before-confirmation');
    });

    it('returns "before-confirmation" for invalid time format', () => {
      expect(computeInitialRoundPhase({ ...baseInput, roundStartTime: 'xx:yy' })).toBe('before-confirmation');
    });
  });

  describe('roundDate vs sessionDate fallback', () => {
    it('uses roundDate when provided', () => {
      const phase = computeInitialRoundPhase({
        ...baseInput,
        sessionDate: '2026-04-17',  // Yesterday
        roundDate: '2026-04-19',    // Tomorrow
        now: new Date('2026-04-18T20:00:00'),
      });
      // Round is tomorrow 20:00, we're today 20:00 → still in future
      expect(phase).toBe('before-confirmation');
    });

    it('falls back to sessionDate when roundDate missing', () => {
      const phase = computeInitialRoundPhase({
        ...baseInput,
        sessionDate: '2026-04-17',  // Yesterday
        roundDate: null,
        now: new Date('2026-04-18T10:00:00'),
      });
      // Session was yesterday, today's 10:00 is past
      expect(phase).toBe('matching');
    });
  });
});

describe('shouldShowConfirmButton', () => {
  const baseBtn: ConfirmButtonVisibilityInput = {
    countdownPhase: 'confirmation-window',
    participantStatus: 'registered',
    hasFreshData: true,
    isConfirming: false,
    lastConfirmTimestamp: undefined,
    now: new Date('2026-04-18T19:57:00'),  // 3 min before T-0
    sessionDate: TODAY,
    roundDate: TODAY,
    roundStartTime: '20:00',
    confirmationWindowMinutes: 5,
  };

  it('shows button in normal confirmation window', () => {
    expect(shouldShowConfirmButton(baseBtn)).toBe(true);
  });

  describe('regression: button flash prevention', () => {
    it('does NOT show button when hasFreshData is false', () => {
      expect(shouldShowConfirmButton({ ...baseBtn, hasFreshData: false })).toBe(false);
    });

    it('does NOT show button if phase is not confirmation-window', () => {
      expect(shouldShowConfirmButton({ ...baseBtn, countdownPhase: 'before-confirmation' })).toBe(false);
    });

    it('does NOT show button for round 6 minutes in future (before window)', () => {
      const now = new Date('2026-04-18T19:54:00'); // 6 min before, window is 5 min
      expect(shouldShowConfirmButton({ ...baseBtn, now })).toBe(false);
    });

    it('does NOT show button after T-0', () => {
      const now = new Date('2026-04-18T20:00:01');
      expect(shouldShowConfirmButton({ ...baseBtn, now })).toBe(false);
    });

    it('does NOT show button during recent confirm (within 5s)', () => {
      const input = { ...baseBtn, lastConfirmTimestamp: Date.now() - 2000 }; // 2s ago
      expect(shouldShowConfirmButton(input)).toBe(false);
    });

    it('SHOWS button after confirm cooldown expired (>5s)', () => {
      const input = { ...baseBtn, lastConfirmTimestamp: Date.now() - 6000 }; // 6s ago
      expect(shouldShowConfirmButton(input)).toBe(true);
    });

    it('does NOT show button while isConfirming', () => {
      expect(shouldShowConfirmButton({ ...baseBtn, isConfirming: true })).toBe(false);
    });

    it('does NOT show button when status is not registered', () => {
      expect(shouldShowConfirmButton({ ...baseBtn, participantStatus: 'confirmed' })).toBe(false);
      expect(shouldShowConfirmButton({ ...baseBtn, participantStatus: 'matched' })).toBe(false);
      expect(shouldShowConfirmButton({ ...baseBtn, participantStatus: 'unconfirmed' })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles missing confirmationWindowMinutes gracefully', () => {
      const input = { ...baseBtn, confirmationWindowMinutes: 0 };
      // Window is 0 min — effectively no button
      expect(shouldShowConfirmButton(input)).toBe(false);
    });

    it('handles very short confirmation window (1 minute)', () => {
      // Round at 20:00, window 1 min → confirmationStart is 19:59
      const input = {
        ...baseBtn,
        confirmationWindowMinutes: 1,
        now: new Date('2026-04-18T19:58:00'), // 2 min before round, before window
      };
      expect(shouldShowConfirmButton(input)).toBe(false);
    });

    it('handles very short confirmation window (1 minute) — in window', () => {
      const input = {
        ...baseBtn,
        confirmationWindowMinutes: 1,
        now: new Date('2026-04-18T19:59:30'), // 30s before T-0, within 1 min window
      };
      expect(shouldShowConfirmButton(input)).toBe(true);
    });

    it('does not show button for invalid date', () => {
      expect(shouldShowConfirmButton({ ...baseBtn, sessionDate: 'invalid', roundDate: null })).toBe(false);
    });
  });
});

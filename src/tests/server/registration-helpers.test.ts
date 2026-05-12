/**
 * Unit tests for server-side registration helpers.
 *
 * Validates the auto-confirm decision: registrations that arrive during the
 * confirmation window are marked as 'confirmed' so they can join matching
 * without a separate confirm step.
 */

import { describe, it, expect } from 'vitest';
import { decideRegistrationStatus } from '../../supabase/functions/server/registration-helpers';

describe('decideRegistrationStatus', () => {
  // Round starts at 2026-05-12T18:00:00Z (a stable absolute moment)
  const roundStart = new Date('2026-05-12T18:00:00Z');
  const confirmationWindowMinutes = 5;

  describe('before confirmation window', () => {
    it('keeps status "registered" when registering 10 min before round', () => {
      const now = new Date('2026-05-12T17:50:00Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('registered');
      expect(result.confirmedAt).toBeUndefined();
    });

    it('keeps status "registered" exactly at the edge (5 min 1 sec before round)', () => {
      const now = new Date('2026-05-12T17:54:59Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('registered');
    });
  });

  describe('within confirmation window', () => {
    it('auto-confirms when registering exactly at T-confirmationWindowMinutes', () => {
      const now = new Date('2026-05-12T17:55:00Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBe('2026-05-12T17:55:00.000Z');
    });

    it('auto-confirms when registering 3 min before round (mid-window)', () => {
      const now = new Date('2026-05-12T17:57:00Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBe('2026-05-12T17:57:00.000Z');
    });

    it('auto-confirms when registering 1 sec before round (latest possible)', () => {
      const now = new Date('2026-05-12T17:59:59Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('confirmed');
      expect(result.confirmedAt).toBe('2026-05-12T17:59:59.000Z');
    });

    it('matches the user scenario: safetyWindow=2, confirmation=5 → register at T-3 auto-confirms', () => {
      // User's example: confirmation window opens at T-5, registration still
      // accepted until T-2. Registering at T-3 (= 3 min after confirmation start
      // = 2 min before registration deadline) must auto-confirm.
      const now = new Date('2026-05-12T17:57:00Z'); // T-3
      const result = decideRegistrationStatus(roundStart, now, 5);
      expect(result.status).toBe('confirmed');
    });
  });

  describe('at or after round start', () => {
    it('keeps status "registered" exactly at round start', () => {
      const now = new Date('2026-05-12T18:00:00Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('registered');
      expect(result.confirmedAt).toBeUndefined();
    });

    it('keeps status "registered" after round start', () => {
      const now = new Date('2026-05-12T18:05:00Z');
      const result = decideRegistrationStatus(roundStart, now, confirmationWindowMinutes);
      expect(result.status).toBe('registered');
    });
  });

  describe('edge cases', () => {
    it('handles confirmationWindowMinutes = 0 (no auto-confirm window)', () => {
      const now = new Date('2026-05-12T17:59:00Z');
      const result = decideRegistrationStatus(roundStart, now, 0);
      expect(result.status).toBe('registered');
    });

    it('handles confirmationWindowMinutes = 1 (very narrow window) — outside', () => {
      const now = new Date('2026-05-12T17:58:00Z'); // T-2, outside 1-min window
      const result = decideRegistrationStatus(roundStart, now, 1);
      expect(result.status).toBe('registered');
    });

    it('handles confirmationWindowMinutes = 1 (very narrow window) — inside', () => {
      const now = new Date('2026-05-12T17:59:30Z'); // T-30s, inside 1-min window
      const result = decideRegistrationStatus(roundStart, now, 1);
      expect(result.status).toBe('confirmed');
    });

    it('handles large confirmation window (e.g. 60 min)', () => {
      const now = new Date('2026-05-12T17:30:00Z'); // T-30, inside 60-min window
      const result = decideRegistrationStatus(roundStart, now, 60);
      expect(result.status).toBe('confirmed');
    });
  });
});

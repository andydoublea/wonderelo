/**
 * Tests for round status transitions.
 *
 * Specifically validates that the round transitions to 'confirmation-window'
 * at T-confirmationWindowMinutes (not T-safetyWindowMinutes), so the
 * confirmation badge appears when confirmation actually opens — independent
 * of when registration closes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock systemParameters before importing sessionStatus
vi.mock('../../utils/systemParameters', () => ({
  getParametersOrDefault: () => ({
    confirmationWindowMinutes: 5,
    safetyWindowMinutes: 2,
    walkingTimeMinutes: 3,
    findingTimeMinutes: 1,
    notificationEarlyMinutes: 10,
    notificationEarlyEnabled: true,
    notificationLateMinutes: 5,
    notificationLateEnabled: true,
    smsRoundEndedEnabled: true,
    minimalGapBetweenRounds: 10,
    minimalRoundDuration: 5,
    maximalRoundDuration: 240,
    minimalTimeToFirstRound: 10,
    contactSharingDelayMinutes: 5,
    timePickerIntervalMinutes: 5,
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
  }),
}));

import {
  getRoundStatus,
  isRoundAvailableForRegistration,
  isRoundWaitingForConfirmation,
} from '../../utils/sessionStatus';

// Use a fixed local-time date so all calculations are deterministic.
const DATE = '2026-05-12';
const ROUND_START_TIME = '18:00';

const session: any = {
  id: 'session-1',
  status: 'published',
  date: DATE,
  rounds: [],
};

const round: any = {
  id: 'round-1',
  startTime: ROUND_START_TIME,
  duration: 10,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper: set "now" relative to round start (local time)
function setTime(localIsoTime: string) {
  vi.setSystemTime(new Date(`${DATE}T${localIsoTime}:00`));
}

describe('getRoundStatus — new model (confirmation-window starts at T-confirmation, not T-safety)', () => {
  it('returns "registration-open" 10 min before round (well before confirmation)', () => {
    setTime('17:50');
    expect(getRoundStatus(session, round)).toBe('registration-open');
  });

  it('returns "registration-open" 6 min before round (just before confirmation)', () => {
    setTime('17:54');
    expect(getRoundStatus(session, round)).toBe('registration-open');
  });

  it('returns "confirmation-window" exactly at T-confirmationWindowMinutes (5 min before)', () => {
    setTime('17:55');
    expect(getRoundStatus(session, round)).toBe('confirmation-window');
  });

  it('returns "confirmation-window" 3 min before round (mid-window)', () => {
    setTime('17:57');
    expect(getRoundStatus(session, round)).toBe('confirmation-window');
  });

  it('returns "confirmation-window" 1 min before round (still in window even though reg closed at T-2)', () => {
    // safetyWindow=2 means registration closed at T-2 (17:58).
    // The round status is still 'confirmation-window' until T-0 — the status
    // is governed by confirmationWindowMinutes, not safetyWindowMinutes.
    setTime('17:59');
    expect(getRoundStatus(session, round)).toBe('confirmation-window');
  });

  it('returns "walking" exactly at T-0', () => {
    setTime('18:00');
    expect(getRoundStatus(session, round)).toBe('walking');
  });

  it('returns "finding" after walking time elapses', () => {
    setTime('18:03'); // walkingTime=3, so T+3 = finding
    expect(getRoundStatus(session, round)).toBe('finding');
  });

  it('returns "networking" after walking + finding elapses', () => {
    setTime('18:04'); // walking(3) + finding(1) = T+4
    expect(getRoundStatus(session, round)).toBe('networking');
  });

  it('returns "completed" after walking + finding + duration elapses', () => {
    setTime('18:15'); // walking(3) + finding(1) + duration(10) = T+14, +1 buffer
    expect(getRoundStatus(session, round)).toBe('completed');
  });

  it('returns "draft" when session is draft', () => {
    setTime('17:50');
    expect(getRoundStatus({ ...session, status: 'draft' }, round)).toBe('draft');
  });
});

describe('isRoundAvailableForRegistration — uses safetyWindowMinutes (registration close)', () => {
  it('allows registration well before round', () => {
    setTime('17:50');
    expect(isRoundAvailableForRegistration(session, round)).toBe(true);
  });

  it('allows registration during confirmation window (between T-confirmation and T-safety)', () => {
    // safetyWindow=2, confirmation=5 → registration still open at T-3
    setTime('17:57');
    expect(isRoundAvailableForRegistration(session, round)).toBe(true);
  });

  it('blocks registration exactly at T-safetyWindowMinutes', () => {
    setTime('17:58'); // safetyWindow=2 → reg closes at 17:58
    expect(isRoundAvailableForRegistration(session, round)).toBe(false);
  });

  it('blocks registration after T-safetyWindowMinutes', () => {
    setTime('17:59');
    expect(isRoundAvailableForRegistration(session, round)).toBe(false);
  });
});

describe('isRoundWaitingForConfirmation — uses confirmationWindowMinutes', () => {
  it('returns false before confirmation window opens', () => {
    setTime('17:54');
    expect(isRoundWaitingForConfirmation(session, round)).toBe(false);
  });

  it('returns true once confirmation window opens', () => {
    setTime('17:55');
    expect(isRoundWaitingForConfirmation(session, round)).toBe(true);
  });

  it('returns true mid-confirmation-window', () => {
    setTime('17:57');
    expect(isRoundWaitingForConfirmation(session, round)).toBe(true);
  });

  it('returns false at/after round start', () => {
    setTime('18:00');
    expect(isRoundWaitingForConfirmation(session, round)).toBe(false);
  });
});

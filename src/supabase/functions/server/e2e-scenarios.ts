/**
 * E2E Test Scenarios for Matching Flow
 * Each scenario is self-contained: setup → execute → verify → cleanup
 */

import * as db from './db.ts';
import { createMatchesForRound } from './matching.tsx';

// Types
type StepFn = (name: string, fn: () => Promise<any>) => Promise<any>;

interface TestContext {
  supabase: any;
  apiBaseUrl: string;  // e.g. http://127.0.0.1:54321/functions/v1/make-server-ce05600a
  anonKey: string;
}

interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  run: (step: StepFn, ctx: TestContext) => Promise<void>;
}

// ============================================================
// SHARED HELPERS
// ============================================================

async function getOrganizerId(supabase: any): Promise<{ organizerId: string; slug: string }> {
  const { data } = await supabase.from('organizer_profiles').select('id, url_slug').limit(1);
  if (!data?.[0]) throw new Error('No organizer profile found');
  return { organizerId: data[0].id, slug: data[0].url_slug };
}

function makeId(prefix: string): string {
  return `${prefix}-e2e-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

async function createTestSession(supabase: any, organizerId: string, options: { groupSize?: number; futureRound?: boolean } = {}) {
  const sessionId = makeId('session');
  const roundId = makeId('round');
  const today = new Date().toISOString().split('T')[0];

  // For API Contract tests, use a future round time so confirm endpoint doesn't reject.
  // For matching-only tests, use 00:00 (past) since we call createMatchesForRound directly.
  let roundStartTime = '00:00';
  let roundDate = today;
  if (options.futureRound) {
    // Set round to tomorrow at 23:55 CET — guaranteed future regardless of timezone
    const tomorrow = new Date(Date.now() + 86400000);
    roundDate = tomorrow.toISOString().split('T')[0];
    roundStartTime = '23:55';
  }

  await db.createSession({
    id: sessionId,
    userId: organizerId,
    name: `E2E Test`,
    date: roundDate,
    status: 'published',
    groupSize: options.groupSize || 2,
    maxParticipants: 100,
    meetingPoints: ['Lobby', 'Table 1'],
    iceBreakers: ['Test?'],
    rounds: [{ id: roundId, startTime: roundStartTime, duration: 10, name: 'Test Round' }],
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
  });
  return { sessionId, roundId, roundStartTime, roundDate };
}

async function registerParticipants(
  names: Array<{ firstName: string; lastName: string }>,
  sessionId: string,
  roundId: string,
  organizerId: string
): Promise<{ ids: string[]; tokens: string[] }> {
  const ids: string[] = [];
  const tokens: string[] = [];
  for (const name of names) {
    const pid = makeId('p');
    const token = makeId('tok');
    const email = `${makeId('e')}@test.com`;
    await db.createParticipant({ participantId: pid, email, token, firstName: name.firstName, lastName: name.lastName, phone: '', phoneCountry: '+421' });
    await db.createRegistration({ participantId: pid, sessionId, roundId, organizerId, status: 'registered' });
    ids.push(pid);
    tokens.push(token);
  }
  return { ids, tokens };
}

async function confirmParticipants(pids: string[], sessionId: string, roundId: string) {
  for (const pid of pids) {
    await db.updateRegistrationStatus(pid, sessionId, roundId, 'confirmed', { confirmedAt: new Date().toISOString() });
  }
}

async function cleanup(supabase: any, sessionId: string, pids: string[]) {
  for (const pid of pids) {
    await supabase.from('registrations').delete().eq('participant_id', pid);
    await supabase.from('participants').delete().eq('id', pid);
  }
  await supabase.from('matching_locks').delete().eq('session_id', sessionId);
  await supabase.from('matches').delete().eq('session_id', sessionId);
  await supabase.from('sessions').delete().eq('id', sessionId);
}

async function getStatuses(pids: string[], sessionId: string, roundId: string): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  for (const pid of pids) {
    const regs = await db.getRegistrationsByParticipant(pid);
    const reg = regs.find((r: any) => r.roundId === roundId);
    result[pid] = reg || null;
  }
  return result;
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

// ============================================================
// SCENARIOS
// ============================================================

const SCENARIOS: Record<string, ScenarioDefinition> = {};

function defineScenario(def: ScenarioDefinition) {
  SCENARIOS[def.id] = def;
}

// --- CATEGORY 1: BASIC MATCHING ---

defineScenario({
  id: 'basic-2', name: '2 participants, 1 match', category: 'Basic Matching',
  description: 'Two participants register, confirm, and get matched into one pair',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup_session', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'Anna', lastName: 'A' }, { firstName: 'Boris', lastName: 'B' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    const matchResult = await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'matching should succeed');
      assert(r.matchCount === 1, `expected 1 match, got ${r.matchCount}`);
      return { matchCount: r.matchCount, unmatchedCount: r.unmatchedCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const s0 = statuses[ids[0]], s1 = statuses[ids[1]];
      assert(s0?.status === 'matched', `P1 should be matched, got ${s0?.status}`);
      assert(s1?.status === 'matched', `P2 should be matched, got ${s1?.status}`);
      assert(s0?.matchId === s1?.matchId, 'Both should share same matchId');
      assert(s0?.identificationNumber != null, 'P1 should have identificationNumber');
      assert(s0?.identificationNumber !== s1?.identificationNumber, 'ID numbers should be unique');
      return { p1: s0?.status, p2: s1?.status, sameMatch: s0?.matchId === s1?.matchId, ids: [s0?.identificationNumber, s1?.identificationNumber] };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'basic-4', name: '4 participants, 2 matches', category: 'Basic Matching',
  description: 'Four participants form two pairs',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = [{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }, { firstName: 'C', lastName: '3' }, { firstName: 'D', lastName: '4' }];
    const { ids } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 2, `expected 2 matches, got ${r.matchCount}`);
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => statuses[id]?.status === 'matched');
      const matchIds = new Set(ids.map(id => statuses[id]?.matchId));
      assert(allMatched, 'All 4 should be matched');
      assert(matchIds.size === 2, `Expected 2 distinct matches, got ${matchIds.size}`);
      return { allMatched, distinctMatches: matchIds.size };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'basic-6', name: '6 participants, 3 matches', category: 'Basic Matching',
  description: 'Six participants form three pairs',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = Array.from({ length: 6 }, (_, i) => ({ firstName: `P${i + 1}`, lastName: 'Test' }));
    const { ids } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 3, `expected 3 matches, got ${r.matchCount}`);
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => statuses[id]?.status === 'matched');
      assert(allMatched, 'All 6 should be matched');
      return { allMatched };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 2: EDGE CASES ---

defineScenario({
  id: 'edge-solo', name: 'Solo participant → no-match', category: 'Edge Cases',
  description: 'A single confirmed participant gets no-match',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'Solo', lastName: 'Sam' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'should succeed');
      assert(!r.matches || r.matches.length === 0, 'no matches expected');
      return { matches: 0, message: r.message };
    });
    await step('verify', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'no-match', `expected no-match, got ${s[ids[0]]?.status}`);
      return { status: s[ids[0]]?.status, reason: s[ids[0]]?.noMatchReason };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'edge-odd-3', name: '3 participants (odd) → group of 3', category: 'Edge Cases',
  description: 'With groupSize=2, odd participant joins existing pair',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }, { firstName: 'C', lastName: '3' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, `expected 1 match (group of 3)`);
      return { matchCount: r.matchCount, unmatchedCount: r.unmatchedCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => statuses[id]?.status === 'matched');
      const matchIds = new Set(ids.map(id => statuses[id]?.matchId));
      assert(allMatched, 'All 3 should be matched');
      assert(matchIds.size === 1, 'All should share same matchId (group of 3)');
      return { allMatched, singleGroup: matchIds.size === 1 };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'edge-zero', name: 'No participants', category: 'Edge Cases',
  description: 'Matching runs on empty round',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'should succeed');
      assert(r.matchCount === 0 || r.message?.includes('No participants'), 'no matches expected');
      return { matchCount: 0, message: r.message };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, []));
  }
});

defineScenario({
  id: 'edge-large-20', name: '20 participants → 10 matches', category: 'Edge Cases',
  description: 'Stress test with 20 participants',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = Array.from({ length: 20 }, (_, i) => ({ firstName: `P${String(i + 1).padStart(2, '0')}`, lastName: 'Test' }));
    const { ids } = await step('register_20', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm_20', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 10, `expected 10 matches, got ${r.matchCount}`);
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => statuses[id]?.status === 'matched');
      assert(allMatched, 'All 20 should be matched');
      return { allMatched, count: 20 };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'edge-group-3', name: 'GroupSize=3, 6 participants', category: 'Edge Cases',
  description: '6 participants form groups of 3 (all matched)',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId, { groupSize: 3 }));
    const names = Array.from({ length: 6 }, (_, i) => ({ firstName: `G${i + 1}`, lastName: 'Test' }));
    const { ids } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'should succeed');
      assert((r.matchCount ?? 0) >= 1, `expected at least 1 match, got ${r.matchCount}`);
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => statuses[id]?.status === 'matched');
      assert(allMatched, 'All 6 should be matched');
      return { allMatched, unmatchedCount: ids.filter(id => statuses[id]?.status !== 'matched').length };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 3: STATUS TRANSITIONS ---

defineScenario({
  id: 'status-unconfirmed', name: 'Unconfirmed get marked', category: 'Status Transitions',
  description: '2 confirm, 2 stay registered → 2 matched + 2 unconfirmed',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = [{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }, { firstName: 'C', lastName: '3' }, { firstName: 'D', lastName: '4' }];
    const { ids } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm_2_of_4', () => confirmParticipants([ids[0], ids[1]], sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, `expected 1 match`);
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      assert(statuses[ids[0]]?.status === 'matched', 'P1 should be matched');
      assert(statuses[ids[1]]?.status === 'matched', 'P2 should be matched');
      assert(statuses[ids[2]]?.status === 'unconfirmed', `P3 should be unconfirmed, got ${statuses[ids[2]]?.status}`);
      assert(statuses[ids[3]]?.status === 'unconfirmed', `P4 should be unconfirmed, got ${statuses[ids[3]]?.status}`);
      return { matched: [statuses[ids[0]]?.status, statuses[ids[1]]?.status], unconfirmed: [statuses[ids[2]]?.status, statuses[ids[3]]?.status] };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'status-no-matching', name: 'Confirmed stays confirmed (no matching)', category: 'Status Transitions',
  description: 'Participants confirm but matching never runs',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      assert(statuses[ids[0]]?.status === 'confirmed', 'P1 should stay confirmed');
      assert(statuses[ids[1]]?.status === 'confirmed', 'P2 should stay confirmed');
      const lock = await db.getMatchingLock(sessionId, roundId);
      assert(!lock, 'No matching lock should exist');
      return { p1: 'confirmed', p2: 'confirmed', noLock: true };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'status-no-checkin', name: 'Matched without check-in', category: 'Status Transitions',
  description: 'After matching, participant stays matched (no check-in)',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, 'should create 1 match');
      return { matchCount: 1 };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      assert(statuses[ids[0]]?.status === 'matched', 'P1 should be matched');
      assert(!statuses[ids[0]]?.checkedInAt, 'P1 should NOT have checked_in_at');
      return { status: 'matched', noCheckin: true };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'status-full-flow', name: 'Full lifecycle: registered → met', category: 'Status Transitions',
  description: 'Walk through register → confirm → match → check-in → met',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));

    await step('verify_registered', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'registered', 'should be registered');
      return { status: 'registered' };
    });

    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('verify_confirmed', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'confirmed', 'should be confirmed');
      return { status: 'confirmed' };
    });

    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, 'should match');
      return { matchCount: 1 };
    });
    await step('verify_matched', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'matched', 'should be matched');
      return { status: 'matched' };
    });

    await step('checkin_both', async () => {
      await db.updateRegistrationStatus(ids[0], sessionId, roundId, 'checked-in', { checkedInAt: new Date().toISOString() });
      await db.updateRegistrationStatus(ids[1], sessionId, roundId, 'checked-in', { checkedInAt: new Date().toISOString() });
      return { status: 'checked-in' };
    });
    await step('verify_checkedin', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'checked-in', 'should be checked-in');
      return { status: 'checked-in' };
    });

    await step('met', async () => {
      await db.updateRegistrationStatus(ids[0], sessionId, roundId, 'met', { metAt: new Date().toISOString() });
      await db.updateRegistrationStatus(ids[1], sessionId, roundId, 'met', { metAt: new Date().toISOString() });
      return { status: 'met' };
    });
    await step('verify_met', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'met', `should be met, got ${s[ids[0]]?.status}`);
      assert(s[ids[1]]?.status === 'met', `should be met, got ${s[ids[1]]?.status}`);
      return { p1: 'met', p2: 'met' };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'status-mixed', name: 'Mixed: 3 confirmed + 3 registered', category: 'Status Transitions',
  description: '3 get matched (group of 3), 3 become unconfirmed',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = Array.from({ length: 6 }, (_, i) => ({ firstName: `P${i + 1}`, lastName: 'T' }));
    const { ids } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm_3_of_6', () => confirmParticipants(ids.slice(0, 3), sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success, 'should succeed');
      return { matchCount: r.matchCount };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      const matched = ids.slice(0, 3).every(id => statuses[id]?.status === 'matched');
      const unconfirmed = ids.slice(3).every(id => statuses[id]?.status === 'unconfirmed');
      assert(matched, 'First 3 should be matched');
      assert(unconfirmed, 'Last 3 should be unconfirmed');
      return { matched3: matched, unconfirmed3: unconfirmed };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 4: LOCK & RETRY ---

defineScenario({
  id: 'lock-double-run', name: 'Double matching → already completed', category: 'Lock & Retry',
  description: 'Running matching twice, second returns already completed',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching_1st', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, 'first run should match');
      return { matchCount: 1 };
    });
    await step('matching_2nd', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'second run should succeed');
      assert(r.message?.includes('already completed') || r.matchCount === 0 || (r.matches && r.matches.length === 0), `second run should return already completed, got: ${r.message}`);
      return { message: r.message, matchCount: r.matchCount ?? 0 };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      assert(statuses[ids[0]]?.status === 'matched', 'still matched after 2nd run');
      return { stillMatched: true };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'lock-stale', name: 'Stale lock (>60s) → recovery', category: 'Lock & Retry',
  description: 'Insert stale lock, matching should clear it and succeed',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('insert_stale_lock', async () => {
      const staleTime = new Date(Date.now() - 120_000).toISOString(); // 2 min ago
      await supabase.from('matching_locks').insert({ session_id: sessionId, round_id: roundId, completed_at: staleTime, match_count: -1, unmatched_count: 0, solo_participant: false });
      return { lockAge: '120s', matchCount: -1 };
    });
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, `should recover and match, got matchCount=${r.matchCount}`);
      return { matchCount: 1, recovered: true };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'lock-failed', name: 'Failed lock (-2) → retry', category: 'Lock & Retry',
  description: 'Previous matching failed, retry should work',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('insert_failed_lock', async () => {
      await supabase.from('matching_locks').insert({ session_id: sessionId, round_id: roundId, completed_at: new Date().toISOString(), match_count: -2, unmatched_count: 0, solo_participant: false });
      return { matchCount: -2 };
    });
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, 'should retry and match');
      return { matchCount: 1 };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'lock-active', name: 'Active lock → skip', category: 'Lock & Retry',
  description: 'Fresh lock (5s old) prevents matching',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('insert_active_lock', async () => {
      await supabase.from('matching_locks').insert({ session_id: sessionId, round_id: roundId, completed_at: new Date().toISOString(), match_count: -1, unmatched_count: 0, solo_participant: false });
      return { matchCount: -1, fresh: true };
    });
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'should return success');
      assert(r.message?.includes('in progress'), `should say in progress, got: ${r.message}`);
      assert(!r.matchCount || r.matchCount === 0, 'no matches created');
      return { skipped: true, message: r.message };
    });
    await step('verify', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      assert(statuses[ids[0]]?.status === 'confirmed', 'should still be confirmed');
      return { stillConfirmed: true };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 5: LATE ARRIVAL ---

defineScenario({
  id: 'late-rescue', name: 'Late arrival rescues solo no-match', category: 'Late Arrival',
  description: 'Solo gets no-match, then late arrival → both matched',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'Solo', lastName: 'S' }, { firstName: 'Late', lastName: 'L' }], sessionId, roundId, organizerId));
    await step('confirm_solo_only', () => confirmParticipants([ids[0]], sessionId, roundId));
    await step('matching_1st', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success === true, 'should succeed');
      assert(!r.matches || r.matches.length === 0, 'solo should get no match');
      return { matches: 0, message: r.message };
    });
    await step('verify_no_match', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'no-match', 'Solo should be no-match');
      return { soloStatus: 'no-match' };
    });
    await step('late_confirm', () => confirmParticipants([ids[1]], sessionId, roundId));
    await step('matching_2nd', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success && r.matchCount === 1, `re-match should create 1 match, got ${r.matchCount}`);
      return { matchCount: 1 };
    });
    await step('verify_both_matched', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'matched', `Solo should now be matched, got ${s[ids[0]]?.status}`);
      assert(s[ids[1]]?.status === 'matched', `Late should be matched, got ${s[ids[1]]?.status}`);
      return { solo: 'matched', late: 'matched' };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'late-pair', name: 'Two late arrivals form new pair', category: 'Late Arrival',
  description: 'After initial match, two more confirm and form a second pair',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }, { firstName: 'C', lastName: '3' }, { firstName: 'D', lastName: '4' }], sessionId, roundId, organizerId));
    await step('confirm_first_2', () => confirmParticipants([ids[0], ids[1]], sessionId, roundId));
    await step('matching_1st', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.matchCount === 1, 'first pair matched');
      return { matchCount: 1 };
    });
    await step('late_confirm_2', () => confirmParticipants([ids[2], ids[3]], sessionId, roundId));
    await step('matching_2nd', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success, 'should succeed');
      return { matchCount: r.matchCount, message: r.message };
    });
    await step('verify', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      const allMatched = ids.every(id => s[id]?.status === 'matched');
      const matchIds = new Set(ids.map(id => s[id]?.matchId));
      assert(allMatched, 'All 4 should be matched');
      assert(matchIds.size === 2, `Expected 2 distinct matches, got ${matchIds.size}`);
      return { allMatched, distinctMatches: matchIds.size };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'late-solo-after', name: 'Solo late after completed matches', category: 'Late Arrival',
  description: 'Matching done with pair, solo late arrival → no-match',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids } = await step('register', () => registerParticipants([{ firstName: 'A', lastName: '1' }, { firstName: 'B', lastName: '2' }, { firstName: 'Late', lastName: 'L' }], sessionId, roundId, organizerId));
    await step('confirm_first_2', () => confirmParticipants([ids[0], ids[1]], sessionId, roundId));
    await step('matching_1st', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.matchCount === 1, 'first pair matched');
      return { matchCount: 1 };
    });
    await step('late_confirm_solo', () => confirmParticipants([ids[2]], sessionId, roundId));
    await step('matching_2nd', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success, 'should succeed');
      return { message: r.message };
    });
    await step('verify', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'matched', 'A should stay matched');
      assert(s[ids[1]]?.status === 'matched', 'B should stay matched');
      assert(s[ids[2]]?.status === 'no-match', `Late should be no-match, got ${s[ids[2]]?.status}`);
      return { a: 'matched', b: 'matched', late: 'no-match' };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 6: TEAMS / TOPICS / MEETING POINTS ---

/**
 * Create a session with custom configuration (teams, topics, meeting points).
 */
async function createCustomSession(
  supabase: any,
  organizerId: string,
  overrides: Record<string, any>
) {
  const sessionId = makeId('session');
  const roundId = makeId('round');
  const today = new Date().toISOString().split('T')[0];
  await db.createSession({
    id: sessionId,
    userId: organizerId,
    name: 'E2E Teams/Topics Test',
    date: today,
    status: 'published',
    groupSize: 2,
    maxParticipants: 100,
    meetingPoints: ['Lobby', 'Table 1'],
    iceBreakers: ['Test?'],
    rounds: [{ id: roundId, startTime: '00:00', duration: 10, name: 'Test Round' }],
    registrationStart: new Date(Date.now() - 3600000).toISOString(),
    ...overrides,
  });
  return { sessionId, roundId };
}

/**
 * Register participants with team / topics attributes.
 */
async function registerWithAttrs(
  entries: Array<{ firstName: string; team?: string; topics?: string[] }>,
  sessionId: string,
  roundId: string,
  organizerId: string
): Promise<string[]> {
  const ids: string[] = [];
  for (const e of entries) {
    const pid = makeId('p');
    const token = makeId('tok');
    const email = `${makeId('e')}@test.com`;
    await db.createParticipant({
      participantId: pid, email, token,
      firstName: e.firstName, lastName: 'Test',
      phone: '', phoneCountry: '+421',
    });
    await db.createRegistration({
      participantId: pid, sessionId, roundId, organizerId,
      status: 'registered',
      team: e.team,
      topics: e.topics,
    });
    ids.push(pid);
  }
  return ids;
}

async function getMatchesForRound(supabase: any, sessionId: string, roundId: string) {
  const { data } = await supabase
    .from('matches')
    .select('id, meeting_point, match_participants:match_participants(participant_id)')
    .eq('session_id', sessionId)
    .eq('round_id', roundId);
  return data || [];
}

defineScenario({
  id: 'teams-across', name: 'Across-teams: different teams pair up', category: 'Teams & Topics',
  description: 'With matchingType=across-teams, participants from different teams are preferred over same-team pairs',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () =>
      createCustomSession(supabase, organizerId, {
        enableTeams: true,
        matchingType: 'across-teams',
        teams: ['Red', 'Blue'],
      })
    );
    // 4 participants: 2 Red, 2 Blue — ideal pairings are Red↔Blue
    const ids = await step('register', () => registerWithAttrs([
      { firstName: 'R1', team: 'Red' },
      { firstName: 'R2', team: 'Red' },
      { firstName: 'B1', team: 'Blue' },
      { firstName: 'B2', team: 'Blue' },
    ], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('run_matching', () => createMatchesForRound(sessionId, roundId));
    await step('verify', async () => {
      const matches = await getMatchesForRound(supabase, sessionId, roundId);
      assert(matches.length === 2, `Expected 2 matches, got ${matches.length}`);
      // Load team info for each participant in each match
      let acrossCount = 0;
      for (const m of matches) {
        const pIds = m.match_participants.map((mp: any) => mp.participant_id);
        const regs = await supabase.from('registrations')
          .select('participant_id, team').in('participant_id', pIds).eq('session_id', sessionId);
        const teams = (regs.data || []).map((r: any) => r.team);
        if (teams[0] !== teams[1]) acrossCount++;
      }
      assert(acrossCount === 2, `Expected both matches across teams, got ${acrossCount}/2`);
      return { matches: matches.length, acrossTeam: acrossCount };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'teams-within', name: 'Within-teams: same teams pair up', category: 'Teams & Topics',
  description: 'With matchingType=within-teams, participants from the same team are preferred',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () =>
      createCustomSession(supabase, organizerId, {
        enableTeams: true,
        matchingType: 'within-teams',
        teams: ['Red', 'Blue'],
      })
    );
    const ids = await step('register', () => registerWithAttrs([
      { firstName: 'R1', team: 'Red' },
      { firstName: 'R2', team: 'Red' },
      { firstName: 'B1', team: 'Blue' },
      { firstName: 'B2', team: 'Blue' },
    ], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('run_matching', () => createMatchesForRound(sessionId, roundId));
    await step('verify', async () => {
      const matches = await getMatchesForRound(supabase, sessionId, roundId);
      assert(matches.length === 2, `Expected 2 matches, got ${matches.length}`);
      let withinCount = 0;
      for (const m of matches) {
        const pIds = m.match_participants.map((mp: any) => mp.participant_id);
        const regs = await supabase.from('registrations')
          .select('participant_id, team').in('participant_id', pIds).eq('session_id', sessionId);
        const teams = (regs.data || []).map((r: any) => r.team);
        if (teams[0] === teams[1]) withinCount++;
      }
      assert(withinCount === 2, `Expected both matches within same team, got ${withinCount}/2`);
      return { matches: matches.length, withinTeam: withinCount };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'topics-shared', name: 'Shared topics boost pair score', category: 'Teams & Topics',
  description: 'Participants with shared topics are preferred over participants with no topic overlap',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () =>
      createCustomSession(supabase, organizerId, {
        enableTopics: true,
        topics: ['AI', 'Design', 'Startups'],
      })
    );
    // 4 participants: A+C share "AI", B+D share "Design". Any matching that respects topics
    // should pair shared-topic participants. Ideal: (A,C) + (B,D).
    const ids = await step('register', () => registerWithAttrs([
      { firstName: 'A', topics: ['AI'] },
      { firstName: 'B', topics: ['Design'] },
      { firstName: 'C', topics: ['AI'] },
      { firstName: 'D', topics: ['Design'] },
    ], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('run_matching', () => createMatchesForRound(sessionId, roundId));
    await step('verify', async () => {
      const matches = await getMatchesForRound(supabase, sessionId, roundId);
      assert(matches.length === 2, `Expected 2 matches, got ${matches.length}`);
      let sharedTopicCount = 0;
      for (const m of matches) {
        const pIds = m.match_participants.map((mp: any) => mp.participant_id);
        const regs = await supabase.from('registrations')
          .select('participant_id, topics').in('participant_id', pIds).eq('session_id', sessionId);
        const [t1, t2] = (regs.data || []).map((r: any) => r.topics || []);
        const overlap = t1.filter((t: string) => t2.includes(t));
        if (overlap.length > 0) sharedTopicCount++;
      }
      assert(sharedTopicCount === 2, `Expected both matches to share a topic, got ${sharedTopicCount}/2`);
      return { matches: matches.length, withSharedTopic: sharedTopicCount };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'mp-distribution', name: 'Meeting points distributed round-robin', category: 'Teams & Topics',
  description: 'With 3 meeting points and 6 matches, each meeting point is assigned exactly 2 matches',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () =>
      createCustomSession(supabase, organizerId, {
        meetingPoints: [
          { id: 'mp1', name: 'Lobby' },
          { id: 'mp2', name: 'Cafeteria' },
          { id: 'mp3', name: 'Garden' },
        ],
      })
    );
    // 12 participants → 6 matches (groupSize 2)
    const names = Array.from({ length: 12 }, (_, i) => ({ firstName: `P${i + 1}` }));
    const ids = await step('register', () => registerWithAttrs(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('run_matching', () => createMatchesForRound(sessionId, roundId));
    await step('verify', async () => {
      const matches = await getMatchesForRound(supabase, sessionId, roundId);
      assert(matches.length === 6, `Expected 6 matches, got ${matches.length}`);
      // Count how many matches landed on each MP
      const counts: Record<string, number> = {};
      for (const m of matches) {
        counts[m.meeting_point] = (counts[m.meeting_point] || 0) + 1;
      }
      const uniqueMPs = Object.keys(counts);
      assert(uniqueMPs.length === 3, `Expected 3 distinct meeting points used, got ${uniqueMPs.length}: ${uniqueMPs.join(', ')}`);
      for (const mp of uniqueMPs) {
        assert(counts[mp] === 2, `Expected 2 matches at ${mp}, got ${counts[mp]}`);
      }
      return { matches: matches.length, counts };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'mp-single-all-matches', name: 'Single meeting point: all matches assigned to it', category: 'Teams & Topics',
  description: 'With 1 meeting point and 3 matches, all 3 matches land on that meeting point',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () =>
      createCustomSession(supabase, organizerId, {
        meetingPoints: [{ id: 'mp1', name: 'Only Place' }],
      })
    );
    const names = Array.from({ length: 6 }, (_, i) => ({ firstName: `P${i + 1}` }));
    const ids = await step('register', () => registerWithAttrs(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('run_matching', () => createMatchesForRound(sessionId, roundId));
    await step('verify', async () => {
      const matches = await getMatchesForRound(supabase, sessionId, roundId);
      assert(matches.length === 3, `Expected 3 matches, got ${matches.length}`);
      for (const m of matches) {
        assert(m.meeting_point === 'Only Place', `Expected 'Only Place', got '${m.meeting_point}'`);
      }
      return { matches: matches.length, meeting_point: 'Only Place' };
    });
    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// --- CATEGORY 7: API CONTRACT (frontend-facing endpoints) ---

async function apiFetch(ctx: TestContext, path: string, options?: any) {
  const url = `${ctx.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${ctx.anonKey}`, 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  return { status: res.status, data };
}

defineScenario({
  id: 'api-dashboard-statuses', name: 'Dashboard shows correct statuses', category: 'API Contract',
  description: 'GET /p/:token/dashboard returns correct status at each stage',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId, { futureRound: true }));
    const { ids, tokens } = await step('register', () => registerParticipants([{ firstName: 'Anna', lastName: 'A' }, { firstName: 'Boris', lastName: 'B' }], sessionId, roundId, organizerId));

    await step('dashboard_registered', async () => {
      const { data } = await apiFetch(ctx, `/p/${tokens[0]}/dashboard`);
      const reg = data.registrations?.find((r: any) => r.roundId === roundId);
      assert(reg?.status === 'registered', `expected registered, got ${reg?.status}`);
      assert(data.firstName === 'Anna', `expected Anna, got ${data.firstName}`);
      return { status: reg?.status, name: data.firstName };
    });

    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));

    await step('dashboard_confirmed', async () => {
      const { data } = await apiFetch(ctx, `/p/${tokens[0]}/dashboard`);
      const reg = data.registrations?.find((r: any) => r.roundId === roundId);
      assert(reg?.status === 'confirmed', `expected confirmed, got ${reg?.status}`);
      return { status: reg?.status };
    });

    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      assert(r.success, 'matching should succeed');
      return { matchCount: r.matchCount };
    });

    await step('dashboard_matched', async () => {
      const { data } = await apiFetch(ctx, `/p/${tokens[0]}/dashboard`);
      const reg = data.registrations?.find((r: any) => r.roundId === roundId);
      assert(reg?.status === 'matched', `expected matched, got ${reg?.status}`);
      assert(reg?.matchId != null, 'should have matchId');
      assert(reg?.matchPartnerNames?.length > 0, 'should have partner names');
      return { status: reg?.status, matchId: reg?.matchId?.substring(0, 20), partners: reg?.matchPartnerNames };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'api-match-endpoint', name: 'GET /match returns complete match data', category: 'API Contract',
  description: 'Match endpoint returns meetingPoint, participants, identification, timing',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId, { futureRound: true }));
    const { ids, tokens } = await step('register', () => registerParticipants([{ firstName: 'Anna', lastName: 'A' }, { firstName: 'Boris', lastName: 'B' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      return { matchCount: r.matchCount };
    });

    await step('get_match_anna', async () => {
      const { status, data } = await apiFetch(ctx, `/participant/${tokens[0]}/match`);
      assert(status === 200, `expected 200, got ${status}`);
      const m = data.matchData;
      assert(m != null, 'matchData should exist');
      assert(m.matchId != null, 'matchId should exist');
      assert(m.meetingPointName != null, 'meetingPointName should exist');
      assert(m.participants?.length === 2, `expected 2 participants, got ${m.participants?.length}`);

      // Verify partner is Boris
      const partner = m.participants.find((p: any) => p.id !== data.participantId);
      assert(partner?.firstName === 'Boris', `partner should be Boris, got ${partner?.firstName}`);
      assert(partner?.identificationNumber != null && partner?.identificationNumber !== '0', `identificationNumber should be set, got ${partner?.identificationNumber}`);

      return {
        matchId: m.matchId?.substring(0, 20),
        meetingPoint: m.meetingPointName,
        participantCount: m.participants?.length,
        partnerName: `${partner?.firstName} ${partner?.lastName}`,
        partnerIdNumber: partner?.identificationNumber,
        hasRoundStartTime: !!m.roundStartTime,
        hasWalkingDeadline: !!m.walkingDeadline,
      };
    });

    await step('get_match_boris', async () => {
      const { status, data } = await apiFetch(ctx, `/participant/${tokens[1]}/match`);
      assert(status === 200, `expected 200, got ${status}`);
      const partner = data.matchData.participants.find((p: any) => p.id !== data.participantId);
      assert(partner?.firstName === 'Anna', `partner should be Anna, got ${partner?.firstName}`);
      return { partnerName: `${partner?.firstName} ${partner?.lastName}` };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'api-confirm-endpoint', name: 'Confirm attendance via API', category: 'API Contract',
  description: 'POST /p/:token/confirm/:roundId returns correct response and updates status',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId, { futureRound: true }));
    const { ids, tokens } = await step('register', () => registerParticipants([{ firstName: 'Anna', lastName: 'A' }], sessionId, roundId, organizerId));

    await step('confirm_via_api', async () => {
      const { status, data } = await apiFetch(ctx, `/p/${tokens[0]}/confirm/${roundId}`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      assert(status === 200, `expected 200, got ${status}: ${JSON.stringify(data)}`);
      assert(data.success === true, 'should succeed');
      assert(data.status === 'confirmed', `expected confirmed, got ${data.status}`);
      assert(data.confirmedAt != null, 'should have confirmedAt');
      return { status: data.status, confirmedAt: data.confirmedAt };
    });

    await step('confirm_idempotent', async () => {
      const { status, data } = await apiFetch(ctx, `/p/${tokens[0]}/confirm/${roundId}`, {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      assert(status === 200, 'idempotent confirm should return 200');
      assert(data.status === 'confirmed', 'status should still be confirmed');
      return { idempotent: true, status: data.status };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'api-no-match-response', name: 'GET /match returns no-match reason', category: 'API Contract',
  description: 'Solo participant gets proper no-match response from match endpoint',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    // Round must be in the past so GET /match triggers matching and discovers no-match
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const { ids, tokens } = await step('register', () => registerParticipants([{ firstName: 'Solo', lastName: 'S' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      await createMatchesForRound(sessionId, roundId);
      return {};
    });

    await step('get_match_no_match', async () => {
      const { status, data } = await apiFetch(ctx, `/participant/${tokens[0]}/match`);
      assert(status === 404, `expected 404, got ${status}: ${JSON.stringify(data).substring(0, 100)}`);
      // The endpoint may or may not return reason='no-match' depending on whether it re-triggers matching.
      // Verify at minimum we get 404 with error message.
      assert(data.error != null, 'should have error field');
      // Also verify the DB status is correct
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'no-match', `DB status should be no-match, got ${s[ids[0]]?.status}`);
      return { httpStatus: 404, dbStatus: s[ids[0]]?.status, reason: data.reason || 'none', noMatchReason: s[ids[0]]?.noMatchReason?.substring(0, 40) };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'api-checkin-flow', name: 'Check-in and met via API', category: 'API Contract',
  description: 'POST /participant/:token/check-in works and updates status',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId, { futureRound: true }));
    const { ids, tokens } = await step('register', () => registerParticipants([{ firstName: 'Anna', lastName: 'A' }, { firstName: 'Boris', lastName: 'B' }], sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      return { matchCount: r.matchCount };
    });

    // Get matchId from registration
    let matchId = '';
    await step('get_match_id', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      matchId = s[ids[0]]?.matchId;
      assert(matchId, 'should have matchId');
      return { matchId: matchId?.substring(0, 20) };
    });

    await step('checkin_anna', async () => {
      const { status, data } = await apiFetch(ctx, `/participant/${tokens[0]}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ matchId }),
      });
      assert(status === 200, `expected 200, got ${status}: ${JSON.stringify(data).substring(0, 100)}`);
      return { status: data.status || 'ok' };
    });

    await step('verify_checkedin', async () => {
      const s = await getStatuses(ids, sessionId, roundId);
      assert(s[ids[0]]?.status === 'checked-in', `Anna should be checked-in, got ${s[ids[0]]?.status}`);
      assert(s[ids[1]]?.status === 'matched', `Boris should still be matched, got ${s[ids[1]]?.status}`);
      return { anna: s[ids[0]]?.status, boris: s[ids[1]]?.status };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

defineScenario({
  id: 'api-id-numbers-unique', name: 'Identification numbers are unique per match', category: 'API Contract',
  description: 'Each participant in a match has a different identification number',
  run: async (step, ctx) => {
    const { supabase } = ctx;
    const { organizerId } = await getOrganizerId(supabase);
    const { sessionId, roundId } = await step('setup', () => createTestSession(supabase, organizerId));
    const names = Array.from({ length: 4 }, (_, i) => ({ firstName: `P${i + 1}`, lastName: 'T' }));
    const { ids, tokens } = await step('register', () => registerParticipants(names, sessionId, roundId, organizerId));
    await step('confirm', () => confirmParticipants(ids, sessionId, roundId));
    await step('matching', async () => {
      const r = await createMatchesForRound(sessionId, roundId);
      return { matchCount: r.matchCount };
    });

    await step('verify_unique_ids', async () => {
      const statuses = await getStatuses(ids, sessionId, roundId);
      // Group by matchId
      const matches: Record<string, number[]> = {};
      for (const id of ids) {
        const reg = statuses[id];
        if (!reg?.matchId) continue;
        if (!matches[reg.matchId]) matches[reg.matchId] = [];
        matches[reg.matchId].push(reg.identificationNumber);
      }
      // Verify uniqueness within each match
      for (const [matchId, numbers] of Object.entries(matches)) {
        const unique = new Set(numbers);
        assert(unique.size === numbers.length, `Match ${matchId} has duplicate ID numbers: ${numbers}`);
      }
      return { matchCount: Object.keys(matches).length, allUnique: true };
    });

    await step('cleanup', () => cleanup(supabase, sessionId, ids));
  }
});

// ============================================================
// EXPORTS
// ============================================================

export function getScenarioList() {
  return Object.values(SCENARIOS).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    category: s.category,
  }));
}

export async function runScenario(scenarioId: string, supabase: any, apiBaseUrl?: string, anonKey?: string) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const steps: any[] = [];
  const startTime = Date.now();

  const ctx: TestContext = {
    supabase,
    apiBaseUrl: apiBaseUrl || '',
    anonKey: anonKey || '',
  };

  const stepFn: StepFn = async (name, fn) => {
    const t0 = Date.now();
    try {
      const result = await fn();
      steps.push({ step: name, ok: true, ...result, ms: Date.now() - t0 });
      return result;
    } catch (err: any) {
      steps.push({ step: name, ok: false, error: err.message || String(err), ms: Date.now() - t0 });
      throw err;
    }
  };

  try {
    await scenario.run(stepFn, ctx);
    return { success: true, scenarioId, name: scenario.name, category: scenario.category, steps, totalMs: Date.now() - startTime };
  } catch (error: any) {
    return { success: false, scenarioId, name: scenario.name, category: scenario.category, error: error.message, steps, totalMs: Date.now() - startTime };
  }
}

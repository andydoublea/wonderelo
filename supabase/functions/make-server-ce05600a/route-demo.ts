/**
 * Demo Route — sets up and maintains a demo event for public demonstration
 *
 * POST /demo/setup
 *   - Ensures a demo organizer exists
 *   - Ensures a session with 5 future rounds exists (regenerates expired ones)
 *   - Ensures 3 mock participants are registered + confirmed in each round
 */

import { getGlobalSupabaseClient } from './global-supabase.tsx';
import { debugLog, errorLog } from './debug.tsx';

function db() {
  return getGlobalSupabaseClient();
}

// Fixed IDs for demo entities
const DEMO_ORGANIZER_ID = '00000000-0000-0000-0000-00000000de00';
const DEMO_SESSION_ID = 'demo-session-001';
const DEMO_SLUG = 'demo';

const MOCK_PARTICIPANTS = [
  { id: 'demo-participant-001', email: 'alice.demo@wonderelo.com', token: 'demo-token-alice-001', firstName: 'Alice', lastName: 'Johnson' },
  { id: 'demo-participant-002', email: 'bob.demo@wonderelo.com', token: 'demo-token-bob-002', firstName: 'Bob', lastName: 'Smith' },
  { id: 'demo-participant-003', email: 'carol.demo@wonderelo.com', token: 'demo-token-carol-003', firstName: 'Carol', lastName: 'Davis' },
];

const MEETING_POINTS = [
  { id: 'demo-mp-1', name: 'Table 1' },
  { id: 'demo-mp-2', name: 'Table 2' },
  { id: 'demo-mp-3', name: 'Table 3' },
  { id: 'demo-mp-4', name: 'Table 4' },
  { id: 'demo-mp-5', name: 'Table 5' },
];

/**
 * Generate 5 round definitions starting ~15 minutes from now
 */
function generateFutureRounds(now: Date): Array<{
  id: string;
  name: string;
  date: string;
  startTime: string;
  duration: number;
  sortOrder: number;
}> {
  const rounds = [];
  const startOffset = 15; // first round starts 15 minutes from now
  const roundDuration = 7;
  const gap = 3;

  for (let i = 0; i < 5; i++) {
    const offsetMinutes = startOffset + i * (roundDuration + gap);
    const roundStart = new Date(now.getTime() + offsetMinutes * 60 * 1000);
    const hours = roundStart.getHours().toString().padStart(2, '0');
    const minutes = roundStart.getMinutes().toString().padStart(2, '0');
    const dateStr = `${roundStart.getFullYear()}-${(roundStart.getMonth() + 1).toString().padStart(2, '0')}-${roundStart.getDate().toString().padStart(2, '0')}`;

    rounds.push({
      id: `demo-round-${Date.now()}-${i}`,
      name: `Round ${i + 1}`,
      date: dateStr,
      startTime: `${hours}:${minutes}`,
      duration: roundDuration,
      sortOrder: i,
    });
  }
  return rounds;
}

/**
 * Check if a round is expired (its start_time + duration has passed)
 */
function isRoundExpired(round: { date: string; start_time: string; duration: number }, now: Date): boolean {
  const [hours, minutes] = round.start_time.split(':').map(Number);
  const roundDate = new Date(round.date + 'T00:00:00');
  roundDate.setHours(hours, minutes, 0, 0);
  const roundEnd = new Date(roundDate.getTime() + round.duration * 60 * 1000);
  return now >= roundEnd;
}

/**
 * Check if a round's confirmation window has started (< 5 min before start)
 */
function isConfirmationStarted(round: { date: string; start_time: string }, now: Date): boolean {
  const [hours, minutes] = round.start_time.split(':').map(Number);
  const roundDate = new Date(round.date + 'T00:00:00');
  roundDate.setHours(hours, minutes, 0, 0);
  const confirmationStart = new Date(roundDate.getTime() - 5 * 60 * 1000);
  return now >= confirmationStart;
}

async function ensureDemoOrganizer(): Promise<void> {
  const { data: existing } = await db()
    .from('organizer_profiles')
    .select('id')
    .eq('id', DEMO_ORGANIZER_ID)
    .maybeSingle();

  if (!existing) {
    debugLog('[demo] Creating demo organizer');
    const { error } = await db()
      .from('organizer_profiles')
      .insert({
        id: DEMO_ORGANIZER_ID,
        email: 'demo@wonderelo.com',
        organizer_name: 'Lovely event',
        url_slug: DEMO_SLUG,
        role: 'organizer',
        description: 'Experience Wonderelo speed networking firsthand. This is a live demo event.',
      });
    if (error && !error.message?.includes('duplicate')) throw error;
  } else {
    // Keep display name in sync with current branding (idempotent)
    await db()
      .from('organizer_profiles')
      .update({ organizer_name: 'Lovely event' })
      .eq('id', DEMO_ORGANIZER_ID);
  }
}

async function ensureDemoSession(now: Date): Promise<void> {
  const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  const { data: existing } = await db()
    .from('sessions')
    .select('id')
    .eq('id', DEMO_SESSION_ID)
    .maybeSingle();

  if (!existing) {
    debugLog('[demo] Creating demo session');
    const { error } = await db()
      .from('sessions')
      .insert({
        id: DEMO_SESSION_ID,
        user_id: DEMO_ORGANIZER_ID,
        name: 'Speed Networking',
        description: '5 rounds of 1-on-1 speed networking. Each round lasts 7 minutes — get matched with someone new every time!',
        date: dateStr,
        status: 'published',
        limit_participants: false,
        max_participants: 50,
        group_size: 2,
        enable_teams: false,
        enable_topics: false,
        meeting_points: MEETING_POINTS,
      });
    if (error) throw error;
  } else {
    // Update date to today so it always appears current
    await db()
      .from('sessions')
      .update({ date: dateStr, status: 'published', updated_at: new Date().toISOString() })
      .eq('id', DEMO_SESSION_ID);
  }
}

async function refreshDemoRounds(now: Date): Promise<string[]> {
  // Get existing rounds for the demo session
  const { data: existingRounds } = await db()
    .from('rounds')
    .select('*')
    .eq('session_id', DEMO_SESSION_ID)
    .order('sort_order', { ascending: true });

  const rounds = existingRounds || [];

  // Check if any round has entered confirmation window or expired
  const needsRefresh = rounds.length < 5 || rounds.some(r => isConfirmationStarted(r, now));

  if (!needsRefresh) {
    debugLog('[demo] Rounds still valid, no refresh needed');
    return rounds.map(r => r.id);
  }

  debugLog('[demo] Refreshing demo rounds');

  // Delete all old rounds and their registrations
  for (const round of rounds) {
    if (isConfirmationStarted(round, now)) {
      // Delete registrations for this round (cascade won't happen with PostgREST)
      await db()
        .from('registrations')
        .delete()
        .eq('round_id', round.id)
        .eq('session_id', DEMO_SESSION_ID);
      // Delete matches for this round
      await db()
        .from('matches')
        .delete()
        .eq('round_id', round.id)
        .eq('session_id', DEMO_SESSION_ID);
      // Delete the round
      await db()
        .from('rounds')
        .delete()
        .eq('id', round.id);
    }
  }

  // Get remaining rounds
  const { data: remainingRounds } = await db()
    .from('rounds')
    .select('*')
    .eq('session_id', DEMO_SESSION_ID)
    .order('sort_order', { ascending: true });

  const remaining = remainingRounds || [];
  const missingCount = 5 - remaining.length;

  if (missingCount <= 0) {
    return remaining.map(r => r.id);
  }

  // Generate new rounds to fill up to 5
  const newRounds = generateFutureRounds(now);
  // Only take as many as we need
  const roundsToAdd = newRounds.slice(newRounds.length - missingCount);

  // Re-sort: existing rounds get lower sort_order, new rounds get higher
  for (let i = 0; i < roundsToAdd.length; i++) {
    roundsToAdd[i].sortOrder = remaining.length + i;
    roundsToAdd[i].name = `Round ${remaining.length + i + 1}`;
  }

  for (const round of roundsToAdd) {
    const { error } = await db()
      .from('rounds')
      .insert({
        id: round.id,
        session_id: DEMO_SESSION_ID,
        name: round.name,
        date: round.date,
        start_time: round.startTime,
        duration: round.duration,
        status: 'scheduled',
        sort_order: round.sortOrder,
        confirmation_window: 5,
        group_size: 2,
        meeting_points: [],
      });
    if (error) throw error;
  }

  // Get all round IDs
  const { data: allRounds } = await db()
    .from('rounds')
    .select('id')
    .eq('session_id', DEMO_SESSION_ID)
    .order('sort_order', { ascending: true });

  return (allRounds || []).map(r => r.id);
}

async function ensureMockParticipants(roundIds: string[]): Promise<void> {
  for (const p of MOCK_PARTICIPANTS) {
    // Upsert participant
    const { data: existing } = await db()
      .from('participants')
      .select('id')
      .eq('id', p.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await db()
        .from('participants')
        .insert({
          id: p.id,
          email: p.email,
          token: p.token,
          first_name: p.firstName,
          last_name: p.lastName,
          phone: '',
          phone_country: '+421',
        });
      if (error && !error.message?.includes('duplicate')) throw error;
    }

    // Register + confirm in each round
    for (const roundId of roundIds) {
      const { data: existingReg } = await db()
        .from('registrations')
        .select('participant_id')
        .eq('participant_id', p.id)
        .eq('round_id', roundId)
        .eq('session_id', DEMO_SESSION_ID)
        .maybeSingle();

      if (!existingReg) {
        const nowIso = new Date().toISOString();
        const { error } = await db()
          .from('registrations')
          .insert({
            participant_id: p.id,
            session_id: DEMO_SESSION_ID,
            round_id: roundId,
            organizer_id: DEMO_ORGANIZER_ID,
            status: 'confirmed',
            registered_at: nowIso,
            confirmed_at: nowIso,
            notifications_enabled: false,
          });
        if (error && !error.message?.includes('duplicate')) throw error;
      }
    }
  }
}

export function registerDemoRoutes(app: any): void {
  // POST /demo/setup — ensure demo data is fresh
  app.post('/make-server-ce05600a/demo/setup', async (c: any) => {
    try {
      const now = new Date();

      await ensureDemoOrganizer();
      await ensureDemoSession(now);
      const roundIds = await refreshDemoRounds(now);
      await ensureMockParticipants(roundIds);

      return c.json({
        success: true,
        organizerId: DEMO_ORGANIZER_ID,
        sessionId: DEMO_SESSION_ID,
        slug: DEMO_SLUG,
        roundCount: roundIds.length,
      });
    } catch (error) {
      errorLog('[demo] Setup error:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }, 500);
    }
  });
}

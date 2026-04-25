/**
 * sms_schedules + sms_outbox DB helpers.
 *
 * sms_schedules = our promise to fire one QStash event at target_send_at per
 *                 (round × kind). Created when round is published.
 *
 * sms_outbox    = one row per actual send. Created at dispatch time when
 *                 QStash fires our endpoint and we fan-out Twilio calls.
 */

import * as db from './db.ts';

export type SmsKind = 'round-before-confirmation' | 'round-starting-soon' | 'round-ended';

// Use the same Supabase client as db.ts via its internal factory.
// Rather than re-creating the client here, we use db's raw query mechanism
// indirectly by calling the existing supabase singleton getter.
// (db.ts exports a `db()` that returns the PostgrestClient; it's designed
// for internal reuse but we need direct table access — so we import
// getSupabase from global-supabase.tsx to stay consistent.)
import { getGlobalSupabaseClient } from './global-supabase.tsx';

const sb = () => getGlobalSupabaseClient();

// ============================================================
// sms_schedules
// ============================================================

export interface SmsSchedule {
  id: string;
  kind: SmsKind;
  roundId: string;
  sessionId: string;
  targetSendAt: string;
  status: 'pending' | 'scheduled' | 'dispatched' | 'canceled' | 'failed';
  qstashMessageId: string | null;
  lastError: string | null;
  scheduledAt: string | null;
  dispatchedAt: string | null;
}

function mapSchedule(r: any): SmsSchedule {
  return {
    id: r.id,
    kind: r.kind,
    roundId: r.round_id,
    sessionId: r.session_id,
    targetSendAt: r.target_send_at,
    status: r.status,
    qstashMessageId: r.qstash_message_id,
    lastError: r.last_error,
    scheduledAt: r.scheduled_at,
    dispatchedAt: r.dispatched_at,
  };
}

/**
 * Insert a schedule row. Idempotent — if one already exists for
 * (kind, round_id), returns the existing id and does NOT change it.
 * Caller uses this + scheduleQStashDelivery() to track state.
 */
export async function upsertSchedule(p: {
  kind: SmsKind;
  roundId: string;
  sessionId: string;
  targetSendAt: Date;
}): Promise<{ id: string; inserted: boolean; existing?: SmsSchedule }> {
  // Try to fetch existing first
  const { data: existing } = await sb()
    .from('sms_schedules')
    .select('*')
    .eq('kind', p.kind)
    .eq('round_id', p.roundId)
    .maybeSingle();

  if (existing) {
    return { id: existing.id, inserted: false, existing: mapSchedule(existing) };
  }

  const { data, error } = await sb()
    .from('sms_schedules')
    .insert({
      kind: p.kind,
      round_id: p.roundId,
      session_id: p.sessionId,
      target_send_at: p.targetSendAt.toISOString(),
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    // If a race inserted the row between SELECT and INSERT, fetch it
    if ((error as any).code === '23505') {
      const { data: race } = await sb()
        .from('sms_schedules')
        .select('*')
        .eq('kind', p.kind)
        .eq('round_id', p.roundId)
        .maybeSingle();
      if (race) return { id: race.id, inserted: false, existing: mapSchedule(race) };
    }
    throw error;
  }
  return { id: data.id, inserted: true };
}

export async function markScheduleScheduled(id: string, qstashMessageId: string) {
  const { error } = await sb()
    .from('sms_schedules')
    .update({
      status: 'scheduled',
      qstash_message_id: qstashMessageId,
      scheduled_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function markScheduleFailed(id: string, lastError: string) {
  const { error } = await sb()
    .from('sms_schedules')
    .update({ status: 'failed', last_error: lastError })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Atomically transition a schedule from 'scheduled' → 'dispatched'.
 * Returns the schedule row if this call won the claim, null otherwise.
 * Used by /sms/dispatch to avoid double-processing when QStash retries.
 */
export async function claimScheduleForDispatch(
  kind: SmsKind,
  roundId: string,
): Promise<SmsSchedule | null> {
  // Try claiming — works whether status is 'pending' or 'scheduled'
  const { data, error } = await sb()
    .from('sms_schedules')
    .update({ status: 'dispatched', dispatched_at: new Date().toISOString() })
    .eq('kind', kind)
    .eq('round_id', roundId)
    .in('status', ['pending', 'scheduled'])
    .select('*');
  if (error) throw error;
  return data && data.length > 0 ? mapSchedule(data[0]) : null;
}

export async function getScheduleByRoundKind(kind: SmsKind, roundId: string): Promise<SmsSchedule | null> {
  const { data, error } = await sb()
    .from('sms_schedules')
    .select('*')
    .eq('kind', kind)
    .eq('round_id', roundId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSchedule(data) : null;
}

export async function cancelSchedulesForRound(roundId: string): Promise<SmsSchedule[]> {
  const { data: existing } = await sb()
    .from('sms_schedules')
    .select('*')
    .eq('round_id', roundId)
    .in('status', ['pending', 'scheduled']);
  const list = (existing || []).map(mapSchedule);

  if (list.length > 0) {
    await sb()
      .from('sms_schedules')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('round_id', roundId)
      .in('status', ['pending', 'scheduled']);
  }
  return list; // caller iterates to cancel each QStash message
}

/** For reconciliation cron: schedules whose target passed but still not dispatched. */
export async function getOverdueSchedules(beforeIso: string): Promise<SmsSchedule[]> {
  const { data, error } = await sb()
    .from('sms_schedules')
    .select('*')
    .lt('target_send_at', beforeIso)
    .in('status', ['pending', 'scheduled']);
  if (error) throw error;
  return (data || []).map(mapSchedule);
}

// ============================================================
// sms_outbox (per-send record)
// ============================================================

export interface SmsOutboxRow {
  id: string;
  scheduleId: string | null;
  kind: SmsKind;
  participantId: string;
  sessionId: string;
  roundId: string;
  targetSendAt: string;
  status: 'attempting' | 'sent' | 'delivered' | 'undelivered' | 'failed' | 'canceled';
  twilioSid: string | null;
  twilioDeliveryStatus: string | null;
  twilioErrorCode: string | null;
  phoneSentTo: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapOutbox(r: any): SmsOutboxRow {
  return {
    id: r.id,
    scheduleId: r.schedule_id,
    kind: r.kind,
    participantId: r.participant_id,
    sessionId: r.session_id,
    roundId: r.round_id,
    targetSendAt: r.target_send_at,
    status: r.status,
    twilioSid: r.twilio_sid,
    twilioDeliveryStatus: r.twilio_delivery_status,
    twilioErrorCode: r.twilio_error_code,
    phoneSentTo: r.phone_sent_to,
    attempts: r.attempts,
    lastAttemptAt: r.last_attempt_at,
    lastError: r.last_error,
    sentAt: r.sent_at,
    deliveredAt: r.delivered_at,
    failedAt: r.failed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * UPSERT an outbox row in 'attempting' state. Returns { created, row }.
 * If a row exists for (kind, participant, round) already:
 *   - status=sent/delivered → {created:false, row:existing}. Caller skips.
 *   - otherwise (failed/attempting/canceled) → re-arm to 'attempting' for retry.
 *
 * This is called at dispatch time for each eligible participant.
 */
export async function upsertOutboxAttempting(p: {
  scheduleId: string | null;
  kind: SmsKind;
  participantId: string;
  sessionId: string;
  roundId: string;
  targetSendAt: Date;
}): Promise<{ created: boolean; row: SmsOutboxRow; existing?: SmsOutboxRow }> {
  const { data: existing } = await sb()
    .from('sms_outbox')
    .select('*')
    .eq('kind', p.kind)
    .eq('participant_id', p.participantId)
    .eq('round_id', p.roundId)
    .maybeSingle();

  if (existing) {
    const exMapped = mapOutbox(existing);
    if (['sent', 'delivered'].includes(existing.status)) {
      return { created: false, row: exMapped, existing: exMapped };
    }
    // Re-arm for retry
    const { data: updated } = await sb()
      .from('sms_outbox')
      .update({
        status: 'attempting',
        attempts: existing.attempts + 1,
        last_attempt_at: new Date().toISOString(),
        schedule_id: p.scheduleId,
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    return { created: false, row: mapOutbox(updated), existing: exMapped };
  }

  const { data, error } = await sb()
    .from('sms_outbox')
    .insert({
      schedule_id: p.scheduleId,
      kind: p.kind,
      participant_id: p.participantId,
      session_id: p.sessionId,
      round_id: p.roundId,
      target_send_at: p.targetSendAt.toISOString(),
      status: 'attempting',
      attempts: 1,
      last_attempt_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) {
    if ((error as any).code === '23505') {
      // race — fetch existing
      const { data: race } = await sb()
        .from('sms_outbox')
        .select('*')
        .eq('kind', p.kind)
        .eq('participant_id', p.participantId)
        .eq('round_id', p.roundId)
        .maybeSingle();
      if (race) return { created: false, row: mapOutbox(race), existing: mapOutbox(race) };
    }
    throw error;
  }
  return { created: true, row: mapOutbox(data) };
}

/**
 * Bulk version of upsertOutboxAttempting for fan-out at scale.
 * Returns { rows, alreadySent } where:
 *   - rows: outbox rows ready to send (id-keyed by participant_id)
 *   - alreadySent: participant_ids that should be skipped (sent/delivered already)
 *
 * One round-trip to read existing rows + one round-trip to upsert new ones,
 * regardless of recipient count. Replaces 3N queries with 2 chunked operations.
 */
export async function bulkUpsertOutboxAttempting(
  scheduleId: string | null,
  kind: SmsKind,
  sessionId: string,
  roundId: string,
  participantIds: string[],
  targetSendAt: Date,
): Promise<{ rowsByParticipant: Map<string, SmsOutboxRow>; alreadySent: Set<string> }> {
  const out = new Map<string, SmsOutboxRow>();
  const alreadySent = new Set<string>();
  if (participantIds.length === 0) return { rowsByParticipant: out, alreadySent };

  // 1) Read existing rows for this (kind, round). One query, paginated for safety.
  const existingByPid = new Map<string, any>();
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb()
      .from('sms_outbox')
      .select('*')
      .eq('kind', kind)
      .eq('round_id', roundId)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) existingByPid.set(r.participant_id, r);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // 2) Partition: skip-already-sent / re-arm-existing / insert-new
  const toReArm: any[] = [];
  const toInsert: any[] = [];
  const now = new Date().toISOString();
  const targetIso = targetSendAt.toISOString();

  for (const pid of participantIds) {
    const ex = existingByPid.get(pid);
    if (ex) {
      if (['sent', 'delivered'].includes(ex.status)) {
        alreadySent.add(pid);
        continue;
      }
      toReArm.push({ id: ex.id, attempts: (ex.attempts || 0) + 1 });
    } else {
      toInsert.push({
        schedule_id: scheduleId,
        kind, participant_id: pid, session_id: sessionId, round_id: roundId,
        target_send_at: targetIso, status: 'attempting', attempts: 1, last_attempt_at: now,
      });
    }
  }

  // 3a) Bulk INSERT new rows. Postgres returns the inserted rows including UUIDs.
  // Race tolerance: if a concurrent caller inserted a row for one of our
  // participants between our SELECT and INSERT, the unique constraint
  // (kind, participant_id, round_id) fires and the entire chunk fails with
  // 23505. Recovery: re-fetch existing rows for the affected participants
  // and continue. Real-world frequency is low (we only see this when a late
  // registration arrives during dispatch fan-out).
  if (toInsert.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const slice = toInsert.slice(i, i + CHUNK);
      const { data, error } = await sb()
        .from('sms_outbox')
        .insert(slice)
        .select('*');
      if (!error) {
        for (const r of data || []) out.set(r.participant_id, mapOutbox(r));
        continue;
      }
      const code = (error as any).code;
      if (code !== '23505') throw error;
      // Race: someone (probably another dispatch invocation) inserted rows
      // for participants we wanted. Re-fetch them per-row and merge.
      const slicePids = slice.map((r: any) => r.participant_id);
      const { data: refetched, error: refetchErr } = await sb()
        .from('sms_outbox')
        .select('*')
        .eq('kind', kind)
        .eq('round_id', roundId)
        .in('participant_id', slicePids);
      if (refetchErr) throw refetchErr;
      for (const r of refetched || []) out.set(r.participant_id, mapOutbox(r));
    }
  }

  // 3b) Bulk UPDATE re-arm existing rows. Each row has its own attempts count
  // so we can't do a single UPDATE — but we can chunk individual UPDATEs in
  // parallel chunks. At realistic event sizes (re-arms only happen on retries),
  // this is rare so we just sequence them.
  for (const r of toReArm) {
    const { data, error } = await sb()
      .from('sms_outbox')
      .update({ status: 'attempting', attempts: r.attempts, last_attempt_at: now, schedule_id: scheduleId })
      .eq('id', r.id)
      .select('*')
      .single();
    if (error) throw error;
    if (data) out.set(data.participant_id, mapOutbox(data));
  }

  return { rowsByParticipant: out, alreadySent };
}

/**
 * Bulk-update outbox rows to status='sent'. PostgREST upsert can't be used
 * (it tries to INSERT on no-conflict, requiring all NOT NULL columns we'd
 * have to re-fetch). Instead we group rows by their unique value tuple where
 * possible — but realistically every row has its own twilio_sid, so we run
 * UPDATEs in parallel chunks. ~30 concurrent updates × ~10ms each = ~16ms
 * per row at scale, so 5000 finishes in under 2s.
 */
const UPDATE_CONCURRENCY = 30;

export async function bulkMarkOutboxSent(updates: Array<{ id: string; twilioSid: string; phoneSentTo: string }>) {
  if (updates.length === 0) return;
  const now = new Date().toISOString();
  for (let i = 0; i < updates.length; i += UPDATE_CONCURRENCY) {
    const chunk = updates.slice(i, i + UPDATE_CONCURRENCY);
    await Promise.all(chunk.map(async (u) => {
      // Only transition from 'attempting' → 'sent'. The Twilio status callback
      // (sms/twilio-status) may have already promoted us to 'delivered' or
      // 'undelivered' by the time we run; without this filter we'd overwrite a
      // terminal state with the intermediate 'sent', losing delivery info.
      const { error } = await sb()
        .from('sms_outbox')
        .update({
          status: 'sent',
          twilio_sid: u.twilioSid,
          phone_sent_to: u.phoneSentTo,
          sent_at: now,
          last_error: null,
        })
        .eq('id', u.id)
        .eq('status', 'attempting');
      if (error) throw error;
    }));
  }
}

export async function bulkMarkOutboxFailed(updates: Array<{ id: string; error: string }>) {
  if (updates.length === 0) return;
  const now = new Date().toISOString();
  for (let i = 0; i < updates.length; i += UPDATE_CONCURRENCY) {
    const chunk = updates.slice(i, i + UPDATE_CONCURRENCY);
    await Promise.all(chunk.map(async (u) => {
      // Same guard: don't overwrite delivered/undelivered set by Twilio webhook.
      const { error } = await sb()
        .from('sms_outbox')
        .update({
          status: 'failed',
          last_error: u.error.slice(0, 500),
          failed_at: now,
        })
        .eq('id', u.id)
        .eq('status', 'attempting');
      if (error) throw error;
    }));
  }
}

export async function markOutboxSent(id: string, twilioSid: string, phoneSentTo: string) {
  const { error } = await sb()
    .from('sms_outbox')
    .update({
      status: 'sent',
      twilio_sid: twilioSid,
      phone_sent_to: phoneSentTo,
      sent_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function markOutboxFailed(id: string, error: string) {
  const { error: dbErr } = await sb()
    .from('sms_outbox')
    .update({
      status: 'failed',
      last_error: error.slice(0, 500),
      failed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (dbErr) throw dbErr;
}

export async function updateOutboxDeliveryStatus(
  twilioSid: string,
  deliveryStatus: string,
  errorCode: string | null,
) {
  const terminal = ['delivered', 'undelivered', 'failed'].includes(deliveryStatus);
  const update: Record<string, unknown> = {
    twilio_delivery_status: deliveryStatus,
    twilio_error_code: errorCode,
  };
  if (deliveryStatus === 'delivered') {
    update.status = 'delivered';
    update.delivered_at = new Date().toISOString();
  } else if (deliveryStatus === 'undelivered' || deliveryStatus === 'failed') {
    update.status = 'undelivered';
    update.failed_at = new Date().toISOString();
  }
  const { error } = await sb().from('sms_outbox').update(update).eq('twilio_sid', twilioSid);
  if (error) throw error;
  return terminal;
}

export async function listOutboxByRoundKind(roundId: string, kind: SmsKind): Promise<SmsOutboxRow[]> {
  const { data, error } = await sb()
    .from('sms_outbox')
    .select('*')
    .eq('round_id', roundId)
    .eq('kind', kind);
  if (error) throw error;
  return (data || []).map(mapOutbox);
}

export async function cancelOutboxForRound(roundId: string) {
  const { error } = await sb()
    .from('sms_outbox')
    .update({ status: 'canceled' })
    .eq('round_id', roundId)
    .in('status', ['attempting']);
  if (error) throw error;
}

// Admin / audit
export async function listOutboxRecent(limit = 200) {
  const { data, error } = await sb()
    .from('sms_outbox')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapOutbox);
}

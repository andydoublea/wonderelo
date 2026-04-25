/**
 * SMS dispatch logic: extracted from index.ts so it can be exercised by e2e
 * tests without going through the QStash-signed HTTP endpoint.
 *
 * The route handler in index.ts validates the QStash signature and then calls
 * dispatchSmsForRound() from here. Tests import dispatchSmsForRound() directly.
 */

import * as db from './db.ts';
import { errorLog } from './debug.tsx';
import { parseRoundStartTime } from './time-helpers.tsx';
import { sendSms, renderSmsTemplate } from './sms.tsx';
import { sendEmail } from './email.tsx';
import {
  claimScheduleForDispatch,
  bulkUpsertOutboxAttempting,
  bulkMarkOutboxSent,
  bulkMarkOutboxFailed,
  type SmsKind,
} from './sms-outbox.ts';

/**
 * Normalize phone+country to E.164 format. Returns null if phone is empty or
 * unrecoverable.
 */
export function composeE164(phone: string | undefined, phoneCountry: string | undefined): string | null {
  if (!phone) return null;
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('00')) return '+' + clean.slice(2);
  const prefix = (phoneCountry || '').trim();
  if (!prefix) return null;
  const local = clean.startsWith('0') ? clean.slice(1) : clean;
  const normalizedPrefix = prefix.startsWith('+') ? prefix : '+' + prefix;
  return `${normalizedPrefix}${local}`;
}

/**
 * Per-kind config: which admin toggles and templates apply, and which
 * registration statuses are eligible at this notification point.
 */
export function kindConfig(kind: SmsKind, sysParams: any, texts: any) {
  switch (kind) {
    case 'round-before-confirmation':
      return {
        smsEnabled: sysParams.notificationEarlyEnabled !== false,
        emailEnabled: sysParams.emailBeforeConfirmationEnabled === true,
        smsTemplate: texts.smsConfirmationReminder,
        emailSubject: texts.emailBeforeConfirmationSubject,
        emailBody: texts.emailBeforeConfirmationBody,
        eligibleStatuses: ['registered', 'confirmed'],
        linkPath: (token: string) => `/p/${token}?from=notification-before`,
      };
    case 'round-starting-soon':
      return {
        smsEnabled: sysParams.notificationLateEnabled !== false,
        emailEnabled: sysParams.emailAtConfirmationEnabled === true,
        smsTemplate: texts.smsRoundStartingSoon,
        emailSubject: texts.emailAtConfirmationSubject,
        emailBody: texts.emailAtConfirmationBody,
        eligibleStatuses: ['registered', 'confirmed'],
        linkPath: (token: string) => `/p/${token}?from=sms-reminder`,
      };
    case 'round-ended':
      return {
        smsEnabled: sysParams.smsRoundEndedEnabled !== false,
        emailEnabled: sysParams.emailAfterNetworkingEnabled === true,
        smsTemplate: texts.smsRoundEnded,
        emailSubject: texts.emailAfterNetworkingSubject,
        emailBody: texts.emailAfterNetworkingBody,
        eligibleStatuses: ['matched', 'checked-in', 'met'],
        linkPath: (token: string) => `/p/${token}/contact-sharing?from=sms-ended`,
      };
  }
}

export interface DispatchOptions {
  /**
   * If true, skip the schedule claim — used by e2e tests that seed a row
   * directly. In production QStash invokes once and we MUST claim atomically
   * so a redelivery is a no-op.
   */
  skipClaim?: boolean;
  /**
   * If true, sendSms() short-circuits to a fake success (no Twilio call). Used
   * by load tests so we don't burn real credits. We can't use Deno.env.set on
   * the Supabase edge runtime (read-only env), so the flag is plumbed through.
   */
  mockSms?: boolean;
}

/**
 * Fan-out SMS + email for one (kind × round) batch.
 *
 * Concurrency notes:
 * - We process the eligible list in parallel chunks of size SMS_DISPATCH_CONCURRENCY
 *   (default 30). Twilio paid accounts allow ~200 msg/sec; concurrency 30 stays
 *   well under that with retry headroom.
 * - One slow Twilio call doesn't block other in-flight calls within a chunk;
 *   each call is try/catch'd so a single failure doesn't take down the chunk.
 * - With concurrency=30 a 5000-recipient round dispatches in ~30-60s on
 *   staging (vs. 25 minutes when sequential). Stays inside the edge function's
 *   150s wall-time limit.
 */
export async function dispatchSmsForRound(
  kind: SmsKind,
  roundId: string,
  sessionId: string,
  options: DispatchOptions = {},
) {
  let schedule;
  if (options.skipClaim) {
    // Fabricate a minimal schedule context (only id + targetSendAt are read below)
    schedule = { id: 0, targetSendAt: new Date().toISOString() };
  } else {
    schedule = await claimScheduleForDispatch(kind, roundId);
    if (!schedule) return { skipped: 'already dispatched or canceled' };
  }

  const sysParams = (await db.getAdminSetting('system_parameters')) || {};
  const texts = (await db.getAdminSetting('notification_texts')) || {};
  const cfg = kindConfig(kind, sysParams, texts);

  if (!cfg.smsEnabled && !cfg.emailEnabled) {
    return { skipped: 'both SMS and email disabled for this kind' };
  }

  const session = await db.getSessionById(sessionId);
  const round = session?.rounds?.find((r: any) => r.id === roundId);
  if (!session || !round) return { error: 'round not found' };

  const registrations = await db.getRegistrationsForRound(sessionId, roundId);
  const eligible = registrations.filter((r: any) =>
    cfg.eligibleStatuses.includes(r.status) &&
    r.notificationsEnabled !== false &&
    (cfg.smsEnabled ? r.phone : r.email)
  );

  const appUrl = Deno.env.get('APP_URL') || 'https://wonderelo.com';
  const meetingPoints = round?.meetingPoints?.length > 0 ? round.meetingPoints : (session.meetingPoints || []);
  const location = meetingPoints.length > 0 ? (meetingPoints[0]?.name || meetingPoints[0] || '') : '';
  const roundStartUtc = parseRoundStartTime(round.date, round.startTime);

  const SMS_CONCURRENCY = parseInt(Deno.env.get('SMS_DISPATCH_CONCURRENCY') || '30', 10);
  let smsSent = 0, smsFailed = 0, emailSent = 0, emailFailed = 0;

  const minutesUntilStart = Math.max(0, Math.round((roundStartUtc.getTime() - Date.now()) / 60000));
  const buildVars = (reg: any) => ({
    sessionName: session.name || '',
    minutes: String(minutesUntilStart),
    location,
    firstName: reg.firstName || '',
    name: `${reg.firstName || ''} ${reg.lastName || ''}`.trim(),
    time: round.startTime || '',
    date: round.date || '',
    link: reg.token ? `${appUrl}${cfg.linkPath(reg.token)}` : appUrl,
    eventName: session.name || '',
  });

  // ============= SMS PATH (bulk outbox + parallel send + bulk status) =============
  if (cfg.smsEnabled && cfg.smsTemplate) {
    const smsCandidates = eligible.filter((r: any) => r.phone);
    const { rowsByParticipant, alreadySent } = await bulkUpsertOutboxAttempting(
      schedule.id || null,
      kind,
      sessionId,
      roundId,
      smsCandidates.map((r: any) => r.participantId),
      new Date(schedule.targetSendAt),
    );

    const sentUpdates: Array<{ id: string; twilioSid: string; phoneSentTo: string }> = [];
    const failedUpdates: Array<{ id: string; error: string }> = [];
    const base = Deno.env.get('SUPABASE_URL') || '';
    const statusCallback = base ? `${base}/functions/v1/make-server-ce05600a/sms/twilio-status` : undefined;

    const sendOne = async (reg: any) => {
      if (alreadySent.has(reg.participantId)) return; // already counted as 'sent' previously, no-op

      const row = rowsByParticipant.get(reg.participantId);
      if (!row) return; // unexpected — bulk insert should have produced a row

      const to = composeE164(reg.phone, reg.phoneCountry);
      if (!to) {
        failedUpdates.push({ id: row.id, error: `bad phone: ${reg.phone} / ${reg.phoneCountry}` });
        smsFailed++;
        return;
      }
      const smsBody = renderSmsTemplate(cfg.smsTemplate, buildVars(reg));
      const result = await sendSms({ to, body: smsBody, statusCallback, mock: options.mockSms });
      if (result.success) {
        sentUpdates.push({ id: row.id, twilioSid: result.sid || '', phoneSentTo: to });
        smsSent++;
      } else {
        failedUpdates.push({ id: row.id, error: result.error || 'twilio failed' });
        smsFailed++;
      }
    };

    for (let i = 0; i < smsCandidates.length; i += SMS_CONCURRENCY) {
      const chunk = smsCandidates.slice(i, i + SMS_CONCURRENCY);
      await Promise.all(chunk.map((reg: any) => sendOne(reg).catch(err => {
        errorLog(`sendOne unexpected error for ${reg.participantId}:`, err);
      })));
    }

    // Bulk persist outcomes — one round-trip per N=500 instead of N individual UPDATEs
    await bulkMarkOutboxSent(sentUpdates);
    await bulkMarkOutboxFailed(failedUpdates);
  }

  // ============= EMAIL PATH (parallel, no outbox table) =============
  if (cfg.emailEnabled && cfg.emailSubject && cfg.emailBody) {
    const emailCandidates = eligible.filter((r: any) => r.email);
    const sendEmailOne = async (reg: any) => {
      try {
        const vars = buildVars(reg);
        const subject = renderSmsTemplate(cfg.emailSubject, vars);
        const body = renderSmsTemplate(cfg.emailBody, vars);
        const html = body.replace(/\n/g, '<br>');
        const result = await sendEmail({ to: reg.email, subject, html });
        if (result.success) emailSent++;
        else {
          emailFailed++;
          errorLog(`Email ${kind} failed for ${reg.email}: ${result.error}`);
        }
      } catch (e) {
        emailFailed++;
        errorLog(`Email ${kind} exception for ${reg.email}:`, e);
      }
    };
    for (let i = 0; i < emailCandidates.length; i += SMS_CONCURRENCY) {
      const chunk = emailCandidates.slice(i, i + SMS_CONCURRENCY);
      await Promise.all(chunk.map((reg: any) => sendEmailOne(reg)));
    }
  }

  return {
    kind, roundId,
    eligible: eligible.length,
    smsSent, smsFailed, emailSent, emailFailed,
    concurrency: SMS_CONCURRENCY,
  };
}

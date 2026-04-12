/**
 * Participant Routes
 * VERSION: 8.0.0-postgres
 *
 * Handles all participant-related endpoints including:
 * - Dashboard (/p/:token/dashboard)
 * - Profile updates (/p/:token/update-profile)
 * - Attendance confirmation (/p/:token/confirm/:roundId)
 * - Notification preferences (/p/:token/notification-preference)
 */

import { Hono } from 'npm:hono';
import * as db from './db.ts';
import { errorLog, debugLog } from './debug.tsx';
import { getParticipantDashboard } from './participant-dashboard.tsx';
import { createMatchesForRound } from './matching.tsx';
import { parseRoundStartTime } from './time-helpers.tsx';

export function registerParticipantRoutes(app: Hono, getCurrentTime: (c: any) => Date) {

  // ========================================
  // PUBLIC: Get participant dashboard
  // ========================================
  app.get('/make-server-ce05600a/p/:token/dashboard', async (c) => {
    const token = c.req.param('token');
    const result = await getParticipantDashboard(token, getCurrentTime, c);

    if (result.error) {
      return c.json(result, result.status || 500);
    }

    return c.json(result);
  });

  // ========================================
  // PUBLIC: Get participant info by token
  // ========================================
  app.get('/make-server-ce05600a/p/:token', async (c) => {
    try {
      const token = c.req.param('token');

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      const registrations = await db.getRegistrationsByParticipant(participant.participantId);

      return c.json({
        success: true,
        participantId: participant.participantId,
        email: participant.email,
        phone: participant.phone || '',
        phoneCountry: participant.phoneCountry || '+421',
        firstName: participant.firstName || '',
        lastName: participant.lastName || '',
        registrations
      });

    } catch (error) {
      errorLog('Error fetching participant info:', error);
      return c.json({
        error: 'Failed to fetch participant info',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Get match info for participant
  // ========================================
  app.get('/make-server-ce05600a/participant/:token/match', async (c) => {
    try {
      const token = c.req.param('token');

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      debugLog('[GET /match] Fetching match data for token:', token?.substring(0, 20) + '...');

      // Get participant from token
      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Get participant registrations
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);

      // Find the ACTIVE match (status: matched, checked-in, met) — exclude completed rounds
      const activeStatuses = ['matched', 'checked-in', 'met'];
      const activeRegistration = registrations.find((r: any) =>
        activeStatuses.includes(r.status) && !r.roundCompletedAt
      );

      if (!activeRegistration) {
        // Try to trigger matching for confirmed OR no-match participants (retry may re-match)
        const matchableReg = registrations.find((r: any) =>
          (r.status === 'confirmed' || r.status === 'no-match') && !r.roundCompletedAt
        );
        if (matchableReg) {
          try {
            const session = await db.getSessionById(matchableReg.sessionId);
            const round = session?.rounds?.find((r: any) => r.id === matchableReg.roundId);
            if (round?.date && round?.startTime) {
              const roundStart = parseRoundStartTime(round.date, round.startTime);
              if (getCurrentTime(c) >= roundStart) {
                debugLog('[GET /match] Participant not matched yet — triggering matching (retry)');
                await createMatchesForRound(matchableReg.sessionId, matchableReg.roundId);

                // Re-check registrations after matching — return match data if available
                const updatedRegs = await db.getRegistrationsByParticipant(participant.participantId);
                const newActiveReg = updatedRegs.find((r: any) =>
                  activeStatuses.includes(r.status) && !r.roundCompletedAt
                );
                if (newActiveReg) {
                  debugLog('[GET /match] Matching just produced a result — returning match data');
                  // Fall through to match data building below by reassigning
                  const { sessionId, roundId, matchId } = newActiveReg;
                  if (matchId) {
                    const match = await db.getMatchById(matchId);
                    if (match) {
                      const matchParticipants = await db.getMatchParticipants(matchId);
                      const matchSession = await db.getSessionById(sessionId);
                      const matchRound = matchSession?.rounds?.find((r: any) => r.id === roundId);

                      let walkingTimeMinutes = 3;
                      let findingTimeMinutes = 1;
                      try {
                        const systemParams = await db.getAdminSetting('system_parameters');
                        if (systemParams) {
                          walkingTimeMinutes = systemParams.walkingTimeMinutes ?? 3;
                          findingTimeMinutes = systemParams.findingTimeMinutes ?? 1;
                        }
                      } catch (e) { /* use defaults */ }

                      const parseRoundStart = parseRoundStartTime;

                      let walkingDeadline: string;
                      let roundStartTimeISO: string | null = null;
                      let networkingEndTime: string | null = null;

                      if (matchRound?.date && matchRound?.startTime) {
                        const roundStartTime = parseRoundStart(matchRound.date, matchRound.startTime);
                        roundStartTimeISO = roundStartTime.toISOString();
                        walkingDeadline = new Date(roundStartTime.getTime() + walkingTimeMinutes * 60000).toISOString();
                        networkingEndTime = new Date(
                          roundStartTime.getTime()
                          + walkingTimeMinutes * 60000
                          + findingTimeMinutes * 60000
                          + (matchRound.duration || 10) * 60000
                        ).toISOString();
                      } else {
                        const matchedAt = newActiveReg.matchedAt || new Date().toISOString();
                        walkingDeadline = new Date(new Date(matchedAt).getTime() + walkingTimeMinutes * 60000).toISOString();
                      }

                      const allMeetingPoints = matchRound?.meetingPoints?.length > 0
                        ? matchRound.meetingPoints
                        : (matchSession?.meetingPoints || []);
                      const meetingPointObj = allMeetingPoints.find((mp: any) =>
                        (mp.name === match.meetingPoint) || (mp.id === match.meetingPoint)
                      );

                      return c.json({
                        success: true,
                        participantId: participant.participantId,
                        matchData: {
                          matchId: match.matchId,
                          meetingPointName: match.meetingPoint || 'TBD',
                          meetingPointImageUrl: meetingPointObj?.imageUrl || null,
                          meetingPointType: meetingPointObj?.type || 'physical',
                          meetingPointVideoCallUrl: meetingPointObj?.videoCallUrl || null,
                          identificationImageUrl: null,
                          participants: matchParticipants.map((p: any) => ({
                            id: p.participantId,
                            firstName: p.firstName,
                            lastName: p.lastName,
                            identificationNumber: p.identificationNumber?.toString() || '0'
                          })),
                          roundStartTime: roundStartTimeISO,
                          walkingDeadline: walkingDeadline,
                          networkingEndTime: networkingEndTime,
                          confirmations: [],
                          choices: []
                        }
                      });
                    }
                  }
                }

                // Check if matching produced no-match
                const newNoMatch = updatedRegs.find((r: any) => r.status === 'no-match' && !r.roundCompletedAt);
                if (newNoMatch) {
                  return c.json({
                    error: 'No active match found',
                    reason: 'no-match',
                    message: newNoMatch.noMatchReason || 'You could not be matched with other participants'
                  }, 404);
                }
              }
            }
          } catch (matchErr) {
            errorLog('[GET /match] Error triggering matching:', matchErr);
          }
        }

        return c.json({ error: 'No active match found' }, 404);
      }

      const { sessionId, roundId, matchId } = activeRegistration;

      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }

      // Get match data
      const match = await db.getMatchById(matchId);

      if (!match) {
        return c.json({ error: 'Match data not found' }, 404);
      }

      // Get match participants
      const matchParticipants = await db.getMatchParticipants(matchId);

      // Get session and round for timing
      const session = await db.getSessionById(sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);

      // Fetch system parameters for phase durations
      let walkingTimeMinutes = 3;
      let findingTimeMinutes = 1;
      try {
        const systemParams = await db.getAdminSetting('system_parameters');
        if (systemParams) {
          walkingTimeMinutes = systemParams.walkingTimeMinutes ?? 3;
          findingTimeMinutes = systemParams.findingTimeMinutes ?? 1;
        }
      } catch (e) {
        debugLog('[GET /match] Error fetching system params, using defaults');
      }

      const parseRoundStart = parseRoundStartTime;

      // Calculate walking deadline = matchedAt + walkingTimeMinutes
      // Uses matchedAt (not roundStartTime) so participant always gets full walking time
      // This is consistent with dashboard's "missed" auto-detection
      const matchedAt = activeRegistration.matchedAt || activeRegistration.lastStatusUpdate || new Date().toISOString();
      const walkingDeadline = new Date(new Date(matchedAt).getTime() + walkingTimeMinutes * 60000).toISOString();
      let roundStartTimeISO: string | null = null;
      let networkingEndTime: string | null = null;

      if (round?.date && round?.startTime) {
        const roundStartTime = parseRoundStart(round.date, round.startTime);
        roundStartTimeISO = roundStartTime.toISOString();
        // Networking end = roundStart + walkingTime + findingTime + round.duration
        networkingEndTime = new Date(
          roundStartTime.getTime()
          + walkingTimeMinutes * 60000
          + findingTimeMinutes * 60000
          + (round.duration || 10) * 60000
        ).toISOString();
      }

      // Look up the full meeting point object from the session/round
      const allMeetingPoints = round?.meetingPoints?.length > 0
        ? round.meetingPoints
        : (session?.meetingPoints || []);
      const meetingPointObj = allMeetingPoints.find((mp: any) =>
        (mp.name === match.meetingPoint) || (mp.id === match.meetingPoint)
      );

      // Build match data response
      const matchData = {
        matchId: match.matchId,
        meetingPointName: match.meetingPoint || 'TBD',
        meetingPointImageUrl: meetingPointObj?.imageUrl || null,
        meetingPointType: meetingPointObj?.type || 'physical',
        meetingPointVideoCallUrl: meetingPointObj?.videoCallUrl || null,
        identificationImageUrl: null,
        participants: matchParticipants.map((p: any) => ({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          identificationNumber: '123'
        })),
        roundStartTime: roundStartTimeISO,
        walkingDeadline: walkingDeadline,
        networkingEndTime: networkingEndTime,
        confirmations: [],
        choices: []
      };

      debugLog('[GET /match] Match data found:', matchId);

      return c.json({
        success: true,
        participantId: participant.participantId,
        matchData
      });

    } catch (error) {
      errorLog('Error fetching match data:', error);
      return c.json({
        error: 'Failed to fetch match data',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Update participant profile
  // ========================================
  app.post('/make-server-ce05600a/p/:token/update-profile', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { email, phone, phoneCountry, firstName, lastName } = body;

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Update participant in participants table (single update replaces profile+email+token updates)
      await db.updateParticipant(participant.participantId, {
        email: email || participant.email,
        phone: phone || participant.phone || '',
        phoneCountry: phoneCountry || participant.phoneCountry || '+421',
        firstName: firstName || participant.firstName || '',
        lastName: lastName || participant.lastName || '',
      });

      // Get updated participant
      const updatedParticipant = await db.getParticipantById(participant.participantId);

      return c.json({
        success: true,
        profile: {
          participantId: updatedParticipant?.participantId,
          email: updatedParticipant?.email,
          phone: updatedParticipant?.phone,
          phoneCountry: updatedParticipant?.phoneCountry,
          firstName: updatedParticipant?.firstName,
          lastName: updatedParticipant?.lastName,
        }
      });

    } catch (error) {
      errorLog('Error updating participant profile:', error);
      return c.json({
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // NOTE: /p/:token/confirm/:roundId is handled by the inline route in index.tsx

  // ========================================
  // PUBLIC: Set notification preference
  // ========================================
  app.post('/make-server-ce05600a/p/:token/notification-preference', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { roundId, sessionId, enabled } = body;

      if (!token || !roundId || !sessionId || typeof enabled !== 'boolean') {
        return c.json({ error: 'Token, roundId, sessionId, and enabled required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Update notification preference directly on the registration row
      await db.updateRegistrationStatus(participant.participantId, sessionId, roundId,
        // Keep current status (we only want to update notifications_enabled)
        (await db.getRegistration(participant.participantId, sessionId, roundId))?.status || 'registered',
        { notificationsEnabled: enabled }
      );

      return c.json({
        success: true,
        notificationsEnabled: enabled
      });

    } catch (error) {
      errorLog('Error updating notification preference:', error);
      return c.json({
        error: 'Failed to update notification preference',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Check in at meeting point
  // ========================================
  app.post('/make-server-ce05600a/participant/:token/check-in', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { matchId } = body;

      debugLog('[POST /check-in] Check-in request:', { token: token?.substring(0, 20) + '...', matchId });

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Find the registration with this matchId
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);
      const registration = registrations.find((r: any) => r.matchId === matchId);

      if (!registration) {
        return c.json({ error: 'Registration not found for this match' }, 404);
      }

      // Idempotent: if already checked-in or met, return success
      if (registration.status === 'checked-in' || registration.status === 'met') {
        debugLog(`[POST /check-in] Already ${registration.status}, returning success (idempotent)`);
        return c.json({
          success: true,
          status: registration.status,
          checkedInAt: registration.checkedInAt || registration.lastStatusUpdate
        });
      }

      // Allow check-in from 'matched' or 'missed' status (missed = walking deadline passed but still at venue)
      const checkInAllowedStatuses = ['matched', 'missed'];
      if (!checkInAllowedStatuses.includes(registration.status)) {
        debugLog(`[POST /check-in] Cannot check in: status is "${registration.status}", expected "matched" or "missed"`);
        return c.json({
          error: 'Cannot check in',
          message: `Cannot check in when status is "${registration.status}". You must be matched first.`,
          currentStatus: registration.status
        }, 400);
      }

      const now = new Date().toISOString();

      // Update status to 'checked-in'
      await db.updateRegistrationStatus(participant.participantId, registration.sessionId, registration.roundId, 'checked-in', {
        checkedInAt: now,
      });

      debugLog('[POST /check-in] Check-in successful');

      return c.json({
        success: true,
        status: 'checked-in',
        checkedInAt: now
      });

    } catch (error) {
      errorLog('Error checking in:', error);
      return c.json({
        error: 'Failed to check in',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Get match partner data
  // ========================================
  app.get('/make-server-ce05600a/participant/:token/match-partner', async (c) => {
    try {
      const token = c.req.param('token');

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      debugLog('[GET /match-partner] Fetching match partner data');

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Get participant registrations
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);

      // Find the ACTIVE match (status: matched, checked-in, met) — exclude completed rounds
      const activeStatuses = ['matched', 'checked-in', 'met'];
      const activeRegistration = registrations.find((r: any) =>
        activeStatuses.includes(r.status) && !r.roundCompletedAt
      );

      if (!activeRegistration) {
        return c.json({ error: 'No active match found' }, 404);
      }

      const { sessionId, roundId, matchId } = activeRegistration;

      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }

      // Get match participants
      const matchParticipants = await db.getMatchParticipants(matchId);

      // My stable identification number from DB
      const myNumber = activeRegistration.identificationNumber || 0;

      const partnersWithStatus = [];
      let allCheckedIn = true;
      let allMet = true;

      for (const p of matchParticipants) {
        if (p.participantId === participant.participantId) continue; // Skip self

        // Check partner's registration status for this round
        const partnerReg = await db.getRegistration(p.participantId, sessionId, roundId);
        const isCheckedIn = partnerReg?.status === 'checked-in' || partnerReg?.status === 'met';
        const isMet = partnerReg?.status === 'met';

        if (!isCheckedIn) allCheckedIn = false;
        if (!isMet) allMet = false;

        partnersWithStatus.push({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          isCheckedIn,
          // Partner's stable identification number (not revealed directly to caller)
          identificationNumber: partnerReg?.identificationNumber?.toString() || '0',
          // The options the caller sees for this partner (shuffled, 1 correct + 2 wrong)
          identificationOptions: partnerReg?.identificationOptions || [],
        });
      }

      // Redirect to networking when YOUR status is 'met' (you or your partner confirmed)
      const shouldStartNetworking = activeRegistration.status === 'met';

      // Get session and round for timing
      const session = await db.getSessionById(sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);

      // Calculate walkingDeadline and findingDeadline
      let walkingDeadline: string | null = null;
      let findingDeadline: string | null = null;
      let walkingTimeMinutes = 3;
      let findingTimeMinutes = 1;

      try {
        const systemParams = await db.getAdminSetting('system_parameters');
        if (systemParams) {
          walkingTimeMinutes = systemParams.walkingTimeMinutes ?? 3;
          findingTimeMinutes = systemParams.findingTimeMinutes ?? 1;
        }
      } catch (e) {
        debugLog('[GET /match-partner] Error fetching system params, using defaults');
      }

      if (round?.date && round?.startTime) {
        const roundStartTime = parseRoundStartTime(round.date, round.startTime);

        // Walking deadline = roundStart + walkingTime
        const walkingDeadlineMs = roundStartTime.getTime() + walkingTimeMinutes * 60000;
        walkingDeadline = new Date(walkingDeadlineMs).toISOString();

        const now = new Date();

        // Finding countdown logic:
        // - Starts when ALL partners checked in, OR when walking time expires
        // - Does NOT start when only some partners arrived
        if (allCheckedIn) {
          // All partners are at the meeting point — finding starts from the last check-in
          // Collect all check-in timestamps (including self)
          const checkInTimes: number[] = [];
          if (activeRegistration.checkedInAt) {
            checkInTimes.push(new Date(activeRegistration.checkedInAt).getTime());
          }
          for (const p of matchParticipants) {
            if (p.participantId === participant.participantId) continue;
            const partnerReg = await db.getRegistration(p.participantId, sessionId, roundId);
            if (partnerReg?.checkedInAt) {
              checkInTimes.push(new Date(partnerReg.checkedInAt).getTime());
            }
          }
          const lastCheckIn = checkInTimes.length > 0 ? Math.max(...checkInTimes) : now.getTime();
          findingDeadline = new Date(lastCheckIn + findingTimeMinutes * 60000).toISOString();
        } else if (now.getTime() >= walkingDeadlineMs) {
          // Walking time expired — finding starts regardless of who arrived
          findingDeadline = new Date(walkingDeadlineMs + findingTimeMinutes * 60000).toISOString();
        }
        // else: findingDeadline stays null — still waiting for partners
      }

      const matchPartnerData = {
        matchId,
        myIdentificationNumber: myNumber.toString(),
        myName: `${participant.firstName || 'Participant'} ${participant.lastName || ''}`.trim(),
        backgroundImageUrl: null,
        partners: partnersWithStatus,
        shouldStartNetworking,
        walkingDeadline,
        findingDeadline,
      };

      debugLog('[GET /match-partner] Match partner data found, shouldStartNetworking:', shouldStartNetworking, 'findingDeadline:', findingDeadline);

      return c.json(matchPartnerData);

    } catch (error) {
      errorLog('Error fetching match partner data:', error);
      return c.json({
        error: 'Failed to fetch match partner data',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Confirm match with partner
  // ========================================
  app.post('/make-server-ce05600a/participant/:token/confirm-match', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { matchId, targetParticipantId, selectedNumber } = body;

      debugLog('[POST /confirm-match] Confirming match:', { matchId, targetParticipantId, selectedNumber });

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      const now = new Date().toISOString();

      // Find the registration with this matchId
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);
      const registration = registrations.find((r: any) => r.matchId === matchId);

      if (!registration) {
        return c.json({ error: 'Registration not found for this match' }, 404);
      }

      // Idempotent: if already met, return success
      if (registration.status === 'met') {
        debugLog('[POST /confirm-match] Already met, returning success (idempotent)');
        return c.json({
          success: true,
          message: 'Match already confirmed'
        });
      }

      // Only allow confirm-match from 'checked-in' status
      if (registration.status !== 'checked-in') {
        debugLog(`[POST /confirm-match] Cannot confirm match: status is "${registration.status}", expected "checked-in"`);
        return c.json({
          error: 'Cannot confirm match',
          message: `Cannot confirm match when status is "${registration.status}". You must check in first.`,
          currentStatus: registration.status
        }, 400);
      }

      // Validate the selected number against the target partner's identification number
      if (targetParticipantId && selectedNumber !== undefined) {
        const targetRegs = await db.getRegistrationsByParticipant(targetParticipantId);
        const targetReg = targetRegs.find((r: any) => r.matchId === matchId);

        if (targetReg) {
          const correctNumber = targetReg.identificationNumber;
          debugLog(`[POST /confirm-match] Selected: ${selectedNumber}, Correct: ${correctNumber}`);

          if (correctNumber !== undefined && selectedNumber !== correctNumber) {
            // WRONG GUESS — regenerate target's identification number + options
            const newIdData = db.generateIdentificationData();
            await db.updateRegistrationStatus(targetParticipantId, targetReg.sessionId, targetReg.roundId, targetReg.status, {
              identificationNumber: newIdData.number,
              identificationOptions: newIdData.options,
            });

            debugLog(`[POST /confirm-match] Wrong number! Regenerated partner's number to ${newIdData.number}, options: ${newIdData.options}`);

            return c.json({
              incorrect: true,
              message: 'Wrong number. Your partner got a new number — look again!',
              newOptions: newIdData.options,
            });
          }
        }
      }

      // Correct number selected — set caller to 'met'
      await db.updateRegistrationStatus(participant.participantId, registration.sessionId, registration.roundId, 'met', {
        metAt: now,
      });

      // Bilateral confirmation: also set the target partner to 'met'
      // (only 1 of 2 needs to confirm — the other is auto-confirmed)
      if (targetParticipantId) {
        try {
          const targetRegs2 = await db.getRegistrationsByParticipant(targetParticipantId);
          const targetReg2 = targetRegs2.find((r: any) => r.matchId === matchId);
          if (targetReg2 && targetReg2.status === 'checked-in') {
            await db.updateRegistrationStatus(targetParticipantId, targetReg2.sessionId, targetReg2.roundId, 'met', {
              metAt: now,
            });
            debugLog(`[POST /confirm-match] Partner ${targetParticipantId} also set to 'met' (bilateral)`);
          }
        } catch (partnerErr) {
          // Don't fail the whole request if partner update fails
          errorLog('[POST /confirm-match] Error setting partner to met:', partnerErr);
        }
      }

      debugLog('[POST /confirm-match] Match confirmed successfully');

      return c.json({
        success: true,
        message: 'Match confirmed successfully'
      });

    } catch (error) {
      errorLog('Error confirming match:', error);
      return c.json({
        error: 'Failed to confirm match',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Get networking session data
  // ========================================
  app.get('/make-server-ce05600a/participant/:token/networking', async (c) => {
    try {
      const token = c.req.param('token');

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      debugLog('[GET /networking] Fetching networking session data');

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Get participant registrations
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);

      // Find the ACTIVE match (status: checked-in, met) — exclude completed rounds
      const activeStatuses = ['checked-in', 'met'];
      const activeRegistration = registrations.find((r: any) =>
        activeStatuses.includes(r.status) && !r.roundCompletedAt
      );

      if (!activeRegistration) {
        return c.json({ error: 'No active networking session found' }, 404);
      }

      const { sessionId, roundId, matchId } = activeRegistration;

      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }

      // Get match data
      const match = await db.getMatchById(matchId);

      if (!match) {
        return c.json({ error: 'Match data not found' }, 404);
      }

      // Get match participants
      const matchParticipants = await db.getMatchParticipants(matchId);

      // Get session for round details
      const session = await db.getSessionById(sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);

      // Get partners (exclude self)
      const partners = matchParticipants
        .filter(p => p.participantId !== participant.participantId)
        .map(p => ({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        }));

      // Get my contact sharing preferences
      const myContactSharing = await db.getContactSharing(matchId, participant.participantId);

      // Calculate networking end time
      // Networking duration = round.duration (the time participants actually have to network)
      // Start from metAt (when both partners confirmed meeting each other)
      let networkingEndTime: string;
      const roundDuration = round?.duration || 10; // minutes
      if (activeRegistration.metAt) {
        // Best case: we know when networking actually started
        networkingEndTime = new Date(new Date(activeRegistration.metAt).getTime() + roundDuration * 60000).toISOString();
      } else if (round?.date && round?.startTime) {
        // Fallback: estimate from round schedule
        const roundStartTime = parseRoundStartTime(round.date, round.startTime);
        let walkingTimeMinutes = 3;
        let findingTimeMinutes = 1;
        try {
          const systemParams = await db.getAdminSetting('system_parameters');
          if (systemParams) {
            walkingTimeMinutes = systemParams.walkingTimeMinutes ?? 3;
            findingTimeMinutes = systemParams.findingTimeMinutes ?? 1;
          }
        } catch (e) {
          debugLog('[GET /networking] Error fetching system params, using defaults');
        }
        const roundEndMs = roundStartTime.getTime()
          + walkingTimeMinutes * 60000
          + findingTimeMinutes * 60000
          + roundDuration * 60000;
        networkingEndTime = new Date(roundEndMs).toISOString();
      } else {
        networkingEndTime = new Date(Date.now() + roundDuration * 60000).toISOString();
      }

      const networkingData = {
        matchId: match.matchId,
        roundName: round?.name || 'Networking Round',
        networkingEndTime,
        partners,
        iceBreakers: session?.iceBreakers || [],
        myContactSharing: myContactSharing || {}
      };

      debugLog('[GET /networking] Networking data found');

      return c.json(networkingData);

    } catch (error) {
      errorLog('Error fetching networking data:', error);
      return c.json({
        error: 'Failed to fetch networking data',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Save contact sharing preferences
  // ========================================
  app.post('/make-server-ce05600a/participant/:token/contact-sharing', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { matchId, preferences } = body;

      debugLog('[POST /contact-sharing] Saving contact preferences:', { matchId, preferences });

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);

      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Save preferences to contact_sharing table
      await db.setContactSharing(matchId, participant.participantId, preferences);

      debugLog('[POST /contact-sharing] Contact preferences saved successfully');

      return c.json({
        success: true,
        message: 'Contact sharing preferences saved'
      });

    } catch (error) {
      errorLog('Error saving contact preferences:', error);
      return c.json({
        error: 'Failed to save contact preferences',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Get shared contacts (bilateral verification)
  // ========================================
  app.get('/make-server-ce05600a/participant/:token/shared-contacts', async (c) => {
    try {
      const token = c.req.param('token');

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      // Get participant registrations to find matches
      const registrations = await db.getRegistrationsByParticipant(participant.participantId);

      // Find all registrations with a matchId
      const matchedRegs = registrations.filter((r: any) => r.matchId);

      // Build lookup maps for sessions, rounds, and organizers
      const sessionIds = [...new Set(matchedRegs.map((r: any) => r.sessionId).filter(Boolean))];
      const roundIds = [...new Set(matchedRegs.map((r: any) => r.roundId).filter(Boolean))];
      const organizerIds = [...new Set(matchedRegs.map((r: any) => r.organizerId).filter(Boolean))];

      const sessionMap: Record<string, any> = {};
      for (const sid of sessionIds) {
        try {
          const s = await db.getSessionById(sid);
          if (s) sessionMap[sid] = s;
        } catch (_) { /* ignore */ }
      }

      const roundMap: Record<string, any> = {};
      for (const rid of roundIds) {
        try {
          const r = await db.getRoundById(rid);
          if (r) roundMap[rid] = r;
        } catch (_) { /* ignore */ }
      }

      const organizerMap: Record<string, any> = {};
      for (const oid of organizerIds) {
        try {
          const o = await db.getOrganizerById(oid);
          if (o) organizerMap[oid] = o;
        } catch (_) { /* ignore */ }
      }

      const sharedContacts: any[] = [];

      for (const reg of matchedRegs) {
        // Get all contact sharing preferences for this match
        const allPrefs = await db.getAllContactSharingForMatch(reg.matchId);

        // Get my preferences
        const myPrefs = allPrefs.find(p => p.participantId === participant.participantId);

        // Get match participants
        const matchParticipants = await db.getMatchParticipants(reg.matchId);
        const partners = matchParticipants.filter(p => p.participantId !== participant.participantId);

        // Enrich with session/round/organizer info
        const session = sessionMap[reg.sessionId];
        const round = roundMap[reg.roundId];
        const organizer = organizerMap[reg.organizerId];

        for (const partner of partners) {
          const partnerPrefs = allPrefs.find(p => p.participantId === partner.participantId);

          // Check bilateral consent: I shared with them AND they shared with me
          const iSharedWithPartner = myPrefs?.preferences?.[partner.participantId] === true;
          const partnerSharedWithMe = partnerPrefs?.preferences?.[participant.participantId] === true;

          if (iSharedWithPartner && partnerSharedWithMe) {
            // Both agreed — share contact info
            sharedContacts.push({
              matchId: reg.matchId,
              roundId: reg.roundId,
              roundName: round?.name || 'Round',
              sessionId: reg.sessionId,
              sessionName: session?.name || '',
              sessionDate: session?.date || round?.date || '',
              organizerName: organizer?.organizerName || organizer?.displayName || '',
              organizerSlug: organizer?.urlSlug || '',
              allPartners: partners.map(p => ({ firstName: p.firstName, lastName: p.lastName })),
              partner: {
                firstName: partner.firstName,
                lastName: partner.lastName,
                email: partner.email,
                phone: partner.phone,
              },
              sharedAt: partnerPrefs?.updatedAt || myPrefs?.updatedAt,
            });
          }
        }
      }

      return c.json({
        success: true,
        sharedContacts,
        totalMatches: matchedRegs.length,
      });

    } catch (error) {
      errorLog('Error fetching shared contacts:', error);
      return c.json({
        error: 'Failed to fetch shared contacts',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // ========================================
  // PUBLIC: Submit missed round feedback
  // ========================================
  app.post('/make-server-ce05600a/participant/:token/missed-feedback', async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { roundId, feedback } = body;

      if (!token) {
        return c.json({ error: 'Token required' }, 400);
      }

      const participant = await db.getParticipantByToken(token);
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }

      debugLog('[POST /missed-feedback] Saving feedback:', { participantId: participant.participantId, roundId, feedback });

      // Store feedback — try event_logs first, fall back to logging only
      try {
        const supabase = db.getClient();
        await supabase
          .from('event_logs')
          .insert({
            event_type: 'missed_round_feedback',
            user_id: participant.participantId,
            event_data: {
              roundId,
              feedback,
              timestamp: new Date().toISOString(),
            },
          });
      } catch (dbError) {
        // Table may not exist yet — just log it
        debugLog('[POST /missed-feedback] Could not store in DB, logging only:', { participantId: participant.participantId, roundId, feedback });
      }

      return c.json({ success: true });
    } catch (error) {
      errorLog('Error saving missed feedback:', error);
      return c.json({ error: 'Failed to save feedback' }, 500);
    }
  });

  debugLog('✅ Participant routes registered');
}

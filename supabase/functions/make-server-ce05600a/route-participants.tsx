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

      // Find the ACTIVE match (status: matched, checked-in, waiting-for-meet-confirmation)
      const activeStatuses = ['matched', 'checked-in', 'waiting-for-meet-confirmation'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));

      if (!activeRegistration) {
        const noMatchReg = registrations.find((r: any) => r.status === 'no-match');
        if (noMatchReg) {
          return c.json({
            error: 'No active match found',
            reason: 'no-match',
            message: noMatchReg.noMatchReason || 'You could not be matched with other participants'
          }, 404);
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

      // Calculate walking deadline
      const walkingTimeMinutes = 3; // Default 3 minutes
      const matchedAt = activeRegistration.matchedAt || activeRegistration.lastStatusUpdate || new Date().toISOString();
      const walkingDeadline = new Date(new Date(matchedAt).getTime() + walkingTimeMinutes * 60000).toISOString();

      // Build match data response
      const matchData = {
        matchId: match.matchId,
        meetingPointName: match.meetingPoint || 'TBD',
        meetingPointImageUrl: null,
        identificationImageUrl: null,
        participants: matchParticipants.map((p: any) => ({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          identificationNumber: '123'
        })),
        roundStartTime: round?.date && round?.startTime
          ? new Date(`${round.date}T${round.startTime}:00`).toISOString()
          : null,
        walkingDeadline: walkingDeadline,
        networkingEndTime: round?.date && round?.startTime && round?.duration
          ? new Date(new Date(`${round.date}T${round.startTime}:00`).getTime() + round.duration * 60000).toISOString()
          : null,
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

      // Find the ACTIVE match
      const activeStatuses = ['matched', 'checked-in', 'waiting-for-meet-confirmation'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));

      if (!activeRegistration) {
        return c.json({ error: 'No active match found' }, 404);
      }

      const { sessionId, roundId, matchId } = activeRegistration;

      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }

      // Get match participants
      const matchParticipants = await db.getMatchParticipants(matchId);

      // Get check-in status for all partners
      const identificationNumbers = [1, 2, 3];
      const myNumber = identificationNumbers[Math.floor(Math.random() * identificationNumbers.length)];

      const partnersWithStatus = [];
      let allCheckedIn = true;
      let allMet = true;

      for (const p of matchParticipants) {
        if (p.participantId === participant.participantId) continue; // Skip self

        // Check partner's registration status for this round
        const partnerReg = await db.getRegistration(p.participantId, sessionId, roundId);
        const isCheckedIn = partnerReg?.status === 'checked-in' || partnerReg?.status === 'waiting-for-meet-confirmation' || partnerReg?.status === 'met';
        const isMet = partnerReg?.status === 'met';

        if (!isCheckedIn) allCheckedIn = false;
        if (!isMet) allMet = false;

        partnersWithStatus.push({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          isCheckedIn,
          identificationNumber: identificationNumbers[Math.floor(Math.random() * identificationNumbers.length)].toString()
        });
      }

      const shouldStartNetworking = allMet && activeRegistration.status === 'met';

      const matchPartnerData = {
        matchId,
        myIdentificationNumber: myNumber.toString(),
        myName: `${participant.firstName || 'Participant'} ${participant.lastName || ''}`.trim(),
        backgroundImageUrl: null,
        partners: partnersWithStatus,
        availableNumbers: identificationNumbers,
        shouldStartNetworking
      };

      debugLog('[GET /match-partner] Match partner data found, shouldStartNetworking:', shouldStartNetworking);

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

      if (registration) {
        await db.updateRegistrationStatus(participant.participantId, registration.sessionId, registration.roundId, 'met', {
          metAt: now,
        });
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

      // Find the ACTIVE match (status: checked-in, waiting-for-meet-confirmation, met)
      const activeStatuses = ['checked-in', 'waiting-for-meet-confirmation', 'met'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));

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

      const networkingData = {
        matchId: match.matchId,
        roundName: round?.name || 'Networking Round',
        networkingEndTime: round?.date && round?.startTime && round?.duration
          ? new Date(new Date(`${round.date}T${round.startTime}:00`).getTime() + round.duration * 60000).toISOString()
          : new Date(Date.now() + 10 * 60000).toISOString(),
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

      const sharedContacts: any[] = [];

      for (const reg of matchedRegs) {
        // Get all contact sharing preferences for this match
        const allPrefs = await db.getAllContactSharingForMatch(reg.matchId);

        // Get my preferences
        const myPrefs = allPrefs.find(p => p.participantId === participant.participantId);

        // Get match participants
        const matchParticipants = await db.getMatchParticipants(reg.matchId);
        const partners = matchParticipants.filter(p => p.participantId !== participant.participantId);

        for (const partner of partners) {
          const partnerPrefs = allPrefs.find(p => p.participantId === partner.participantId);

          // Check bilateral consent: I shared with them AND they shared with me
          const iSharedWithPartner = myPrefs?.preferences?.[partner.participantId] === true;
          const partnerSharedWithMe = partnerPrefs?.preferences?.[participant.participantId] === true;

          if (iSharedWithPartner && partnerSharedWithMe) {
            // Both agreed — share contact info
            sharedContacts.push({
              matchId: reg.matchId,
              roundName: reg.roundName || 'Round',
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

  debugLog('✅ Participant routes registered');
}

/**
 * Participant Routes
 * VERSION: 6.32.2-flat-structure
 * 
 * Handles all participant-related endpoints including:
 * - Dashboard (/p/:token/dashboard)
 * - Profile updates (/p/:token/update-profile)
 * - Attendance confirmation (/p/:token/confirm/:roundId)
 * - Notification preferences (/p/:token/notification-preference)
 */

import { Hono } from 'npm:hono';
import * as kv from './kv_wrapper.tsx';
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
      
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      const normalizedEmail = participant.email.toLowerCase().trim();
      const participantEmail = await kv.get(`participant_email:${normalizedEmail}`);
      
      if (participantEmail && participantEmail.token !== token) {
        return c.json({
          success: false,
          redirect: true,
          correctToken: participantEmail.token,
          message: 'This is an old token. Please use the correct token.'
        });
      }
      
      const profile = await kv.get(`participant_profile:${participant.participantId}`);
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      return c.json({
        success: true,
        participantId: participant.participantId,
        email: participant.email,
        phone: profile?.phone || '',
        phoneCountry: profile?.phoneCountry || '+421',
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
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
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Get participant registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      // Find the ACTIVE match (status: matched, checked-in, waiting-for-meet-confirmation)
      const activeStatuses = ['matched', 'checked-in', 'waiting-for-meet-confirmation'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));
      
      if (!activeRegistration) {
        // Check for no-match status
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
      const match = await kv.get(`match:${sessionId}:${roundId}:${matchId}`);
      
      if (!match) {
        return c.json({ error: 'Match data not found' }, 404);
      }
      
      // Get session data for round timing
      const allSessions = await kv.getByPrefix(`user_sessions:`);
      const session = allSessions.find((s: any) => s.id === sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);
      
      // Calculate walking deadline (matchedAt + walkingTime from session parameters)
      const walkingTimeMinutes = session?.parameters?.walkingTime || 3; // Default 3 minutes
      const matchedAt = activeRegistration.matchedAt || activeRegistration.lastStatusUpdate || new Date().toISOString();
      const walkingDeadline = new Date(new Date(matchedAt).getTime() + walkingTimeMinutes * 60000).toISOString();
      
      // Build match data response
      const matchData = {
        matchId: match.matchId,
        meetingPointName: match.meetingPoint || 'TBD',
        meetingPointImageUrl: null, // TODO: Add meeting point images
        identificationImageUrl: null, // TODO: Add identification images
        participants: match.participants.map((p: any) => ({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          identificationNumber: '123' // TODO: Generate identification numbers
        })),
        roundStartTime: round?.date && round?.startTime 
          ? new Date(`${round.date}T${round.startTime}:00`).toISOString()
          : null,
        walkingDeadline: walkingDeadline,
        networkingEndTime: round?.date && round?.startTime && round?.duration
          ? new Date(new Date(`${round.date}T${round.startTime}:00`).getTime() + round.duration * 60000).toISOString()
          : null,
        confirmations: [], // TODO: Track confirmations
        choices: [] // TODO: Track participant choices
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
      
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Update participant profile
      const profile = await kv.get(`participant_profile:${participant.participantId}`) || {};
      
      const updatedProfile = {
        ...profile,
        participantId: participant.participantId,
        email: email || participant.email,
        phone: phone || profile.phone || '',
        phoneCountry: phoneCountry || profile.phoneCountry || '+421',
        firstName: firstName || profile.firstName || '',
        lastName: lastName || profile.lastName || '',
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`participant_profile:${participant.participantId}`, updatedProfile);
      
      // If email changed, handle email update logic
      if (email && email !== participant.email) {
        const normalizedEmail = email.toLowerCase().trim();
        const oldNormalizedEmail = participant.email.toLowerCase().trim();
        
        // Update token mapping
        await kv.set(`participant_email:${normalizedEmail}`, {
          participantId: participant.participantId,
          token: token,
          createdAt: participant.createdAt || new Date().toISOString()
        });
        
        // Remove old email mapping
        await kv.del(`participant_email:${oldNormalizedEmail}`);
        
        // Update participant_token entry
        await kv.set(`participant_token:${token}`, {
          ...participant,
          email: email
        });
      }
      
      return c.json({
        success: true,
        profile: updatedProfile
      });
      
    } catch (error) {
      errorLog('Error updating participant profile:', error);
      return c.json({ 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

  // NOTE: /p/:token/confirm/:roundId is handled by the inline route in index.tsx (has robust empty body handling)

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
      
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Update registration
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      const regIndex = registrations.findIndex((r: any) => 
        r.sessionId === sessionId && r.roundId === roundId
      );
      
      if (regIndex === -1) {
        return c.json({ error: 'Registration not found' }, 404);
      }
      
      registrations[regIndex] = {
        ...registrations[regIndex],
        notificationsEnabled: enabled
      };
      
      await kv.set(`participant_registrations:${participant.participantId}`, registrations);
      
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
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Get participant registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      // Find the registration with this matchId
      const regIndex = registrations.findIndex((r: any) => r.matchId === matchId);
      
      if (regIndex === -1) {
        return c.json({ error: 'Registration not found for this match' }, 404);
      }
      
      const registration = registrations[regIndex];
      const now = new Date().toISOString();
      
      // Update status to 'checked-in'
      registrations[regIndex] = {
        ...registration,
        status: 'checked-in',
        checkedInAt: now,
        lastStatusUpdate: now
      };
      
      await kv.set(`participant_registrations:${participant.participantId}`, registrations);
      
      // Update participant entry in round
      const roundParticipantId = registration.roundParticipantId || participant.participantId;
      const participantKey = `participant:${registration.sessionId}:${registration.roundId}:${roundParticipantId}`;
      const participantEntry = await kv.get(participantKey);
      
      if (participantEntry) {
        await kv.set(participantKey, {
          ...participantEntry,
          status: 'checked-in',
          checkedInAt: now
        });
      }
      
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
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Get participant profile
      const profile = await kv.get(`participant_profile:${participant.participantId}`) || {};
      
      // Get participant registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      // Find the ACTIVE match (status: matched, checked-in, waiting-for-meet-confirmation)
      const activeStatuses = ['matched', 'checked-in', 'waiting-for-meet-confirmation'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));
      
      if (!activeRegistration) {
        return c.json({ error: 'No active match found' }, 404);
      }
      
      const { sessionId, roundId, matchId } = activeRegistration;
      
      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }
      
      // Get match data
      const match = await kv.get(`match:${sessionId}:${roundId}:${matchId}`);
      
      if (!match) {
        return c.json({ error: 'Match data not found' }, 404);
      }
      
      // Generate identification numbers (1-3) for each participant
      const identificationNumbers = [1, 2, 3];
      const myNumber = identificationNumbers[Math.floor(Math.random() * identificationNumbers.length)];
      
      // Get check-in status for all participants
      const partnersWithStatus = [];
      let allCheckedIn = true;
      let allMet = true;
      
      for (const p of match.participants) {
        if (p.participantId === participant.participantId) continue; // Skip self
        
        // Check if this partner is checked in or met
        const partnerRegistrations = await kv.get(`participant_registrations:${p.participantId}`) || [];
        const partnerReg = partnerRegistrations.find((r: any) => r.matchId === matchId);
        const isCheckedIn = partnerReg?.status === 'checked-in' || partnerReg?.status === 'waiting-for-meet-confirmation' || partnerReg?.status === 'met';
        const isMet = partnerReg?.status === 'met';
        
        if (!isCheckedIn) {
          allCheckedIn = false;
        }
        
        if (!isMet) {
          allMet = false;
        }
        
        partnersWithStatus.push({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          isCheckedIn,
          identificationNumber: identificationNumbers[Math.floor(Math.random() * identificationNumbers.length)].toString()
        });
      }
      
      // Only start networking when all participants have status 'met' (confirmed their partners)
      const shouldStartNetworking = allMet && activeRegistration.status === 'met';
      
      // Build response
      const matchPartnerData = {
        matchId: match.matchId,
        myIdentificationNumber: myNumber.toString(),
        myName: `${profile.firstName || 'Participant'} ${profile.lastName || ''}`.trim(),
        backgroundImageUrl: null, // TODO: Add background images
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
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // TODO: Implement number verification logic
      // For now, just accept any number
      
      const now = new Date().toISOString();
      
      // Update participant status to 'waiting-for-meet-confirmation' or 'met'
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      const regIndex = registrations.findIndex((r: any) => r.matchId === matchId);
      
      if (regIndex !== -1) {
        registrations[regIndex] = {
          ...registrations[regIndex],
          status: 'met',
          metAt: now,
          lastStatusUpdate: now
        };
        
        await kv.set(`participant_registrations:${participant.participantId}`, registrations);
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
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Get participant profile
      const profile = await kv.get(`participant_profile:${participant.participantId}`) || {};
      
      // Get participant registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      // Find the ACTIVE match (status: checked-in, waiting-for-meet-confirmation, met)
      const activeStatuses = ['checked-in', 'waiting-for-meet-confirmation', 'met'];
      const activeRegistration = registrations.find((r: any) => activeStatuses.includes(r.status));
      
      debugLog('[GET /networking] Looking for active registration:', {
        participantId: participant.participantId,
        totalRegistrations: registrations.length,
        registrationStatuses: registrations.map((r: any) => ({ sessionId: r.sessionId, roundId: r.roundId, status: r.status, matchId: r.matchId })),
        foundActive: !!activeRegistration
      });
      
      if (!activeRegistration) {
        return c.json({ error: 'No active networking session found' }, 404);
      }
      
      const { sessionId, roundId, matchId } = activeRegistration;
      
      if (!matchId) {
        return c.json({ error: 'No match ID in registration' }, 404);
      }
      
      // Get match data
      const match = await kv.get(`match:${sessionId}:${roundId}:${matchId}`);
      
      if (!match) {
        return c.json({ error: 'Match data not found' }, 404);
      }
      
      // Get session data for round details
      const allSessions = await kv.getByPrefix(`user_sessions:`);
      const session = allSessions.find((s: any) => s.id === sessionId);
      const round = session?.rounds?.find((r: any) => r.id === roundId);
      
      // Get partners
      const partners = [];
      for (const p of match.participants) {
        if (p.participantId === participant.participantId) continue; // Skip self
        
        partners.push({
          id: p.participantId,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email
        });
      }
      
      // Get my contact sharing preferences
      const contactSharingKey = `contact_sharing:${matchId}:${participant.participantId}`;
      const myContactSharing = await kv.get(contactSharingKey) || {};
      
      // Build response
      const networkingData = {
        matchId: match.matchId,
        roundName: round?.name || 'Networking Round',
        networkingEndTime: round?.date && round?.startTime && round?.duration
          ? new Date(new Date(`${round.date}T${round.startTime}:00`).getTime() + round.duration * 60000).toISOString()
          : new Date(Date.now() + 10 * 60000).toISOString(), // Default 10 minutes from now
        partners,
        iceBreakers: session?.iceBreakers || [],
        myContactSharing
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
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Save preferences
      const contactSharingKey = `contact_sharing:${matchId}:${participant.participantId}`;
      await kv.set(contactSharingKey, preferences);
      
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

  debugLog('✅ Participant routes registered');
}
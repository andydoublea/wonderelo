/**
 * Participant Routes
 * VERSION: 6.32.0-triple-layer-protection
 * 
 * Handles all participant-related endpoints including:
 * - Dashboard (/p/:token/dashboard)
 * - Profile updates (/p/:token/update-profile)
 * - Registration management (/p/:token/register, /p/:token/unregister)
 * - Attendance confirmation (/p/:token/confirm/:roundId)
 * - Notification preferences (/p/:token/notification-preference)
 */

import { Hono } from 'npm:hono';
import * as kv from '../kv_wrapper.tsx';
import { errorLog, debugLog } from '../debug.tsx';
import { getParticipantDashboard } from '../participant-dashboard.tsx';

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

  // ========================================
  // PUBLIC: Confirm attendance for a round
  // ========================================
  app.post('/make-server-ce05600a/p/:token/confirm/:roundId', async (c) => {
    try {
      const token = c.req.param('token');
      const roundId = c.req.param('roundId');
      const body = await c.req.json();
      const { sessionId } = body;
      
      debugLog('🎯 CONFIRM ATTENDANCE ENDPOINT CALLED', { token, roundId, sessionId });
      
      if (!token || !roundId || !sessionId) {
        return c.json({ error: 'Token, roundId, and sessionId required' }, 400);
      }
      
      // Get participant from token
      const participant = await kv.get(`participant_token:${token}`);
      
      if (!participant) {
        return c.json({ error: 'Invalid token' }, 404);
      }
      
      // Get current registrations
      const registrations = await kv.get(`participant_registrations:${participant.participantId}`) || [];
      
      // Find the specific registration
      const regIndex = registrations.findIndex((r: any) => 
        r.sessionId === sessionId && r.roundId === roundId
      );
      
      if (regIndex === -1) {
        return c.json({ error: 'Registration not found' }, 404);
      }
      
      const registration = registrations[regIndex];
      
      // Handle already confirmed status (idempotent)
      if (registration.status === 'confirmed') {
        debugLog(`ℹ️ Already confirmed: round ${roundId}`);
        return c.json({
          success: true,
          status: 'confirmed',
          message: 'Already confirmed'
        });
      }
      
      // ✅ VERIFICATION: Only allow confirmation if status is 'registered'
      if (registration.status !== 'registered') {
        debugLog(`⚠️ Cannot confirm: current status is "${registration.status}" (only "registered" can be confirmed)`);
        return c.json({ 
          error: 'Cannot confirm',
          message: `Round status is "${registration.status}". Only "registered" rounds can be confirmed.`,
          currentStatus: registration.status
        }, 400);
      }
      
      // 🔥 CRITICAL: Set confirmedAt timestamp to mark this as user-initiated confirmation
      const now = new Date().toISOString();
      registrations[regIndex] = {
        ...registration,
        status: 'confirmed',
        confirmedAt: now,
        lastStatusUpdate: now
      };
      
      // Save updated registrations
      await kv.set(`participant_registrations:${participant.participantId}`, registrations);
      
      // Update participant entry in round
      const roundParticipantId = registration.roundParticipantId || participant.participantId;
      const participantKey = `participant:${sessionId}:${roundId}:${roundParticipantId}`;
      const participantEntry = await kv.get(participantKey);
      
      if (participantEntry) {
        await kv.set(participantKey, {
          ...participantEntry,
          status: 'confirmed',
          confirmedAt: now
        });
        debugLog(`✅ Updated participant entry: ${participantKey}`);
      }
      
      debugLog(`✅✅✅ VERIFICATION PASSED: Participant confirmed attendance for round ${roundId}`);
      
      return c.json({
        success: true,
        status: 'confirmed',
        confirmedAt: now,
        message: 'Attendance confirmed successfully'
      });
      
    } catch (error) {
      errorLog('Error confirming attendance:', error);
      return c.json({ 
        error: 'Failed to confirm attendance',
        details: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  });

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

  debugLog('✅ Participant routes registered');
}
